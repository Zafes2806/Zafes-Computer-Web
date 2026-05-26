const { Op, Sequelize } = require('sequelize');

const { connect } = require('../config/index');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const {
    normalizeComponentType,
    getComponentTypeQueryValues,
} = require('../constants/componentTypes');
const modelProducts = require('../models/products.model');
const modelCategory = require('../models/category.model');
const modelProductReview = require('../models/productReview.model');
const modelUser = require('../models/users.model');
const modelCart = require('../models/cart.model');
const modelBuildPcCart = require('../models/buildPcCart.model');
const modelUserWatchProduct = require('../models/userWatchProduct.model');
const modelOrderItem = require('../models/orderItem.model');
const ProductSpec = require('../models/productSpec.model');
const PcConfiguration = require('../models/pcConfiguration.model');
const {
    getProductAvailabilityBaseInclude,
    getProductBaseInclude,
    getPublicProductBaseInclude,
    getSellableCategoryInclude,
} = require('../utils/productQuery');
const { buildPaginationMeta } = require('../utils/pagination');
const {
    getPlainProductWithPcConfiguration,
    getPlainProductsWithPcConfiguration,
} = require('../utils/pcConfiguration');
const {
    upsertPcConfiguration,
    removePcConfiguration,
} = require('./pcConfiguration.service');
const { PRODUCT_STATUS, normalizeProductStatus } = require('../constants/productStatus');
const { CATEGORY_STATUS } = require('../constants/categoryStatus');
const { getApprovedReviews } = require('./productReview.service');
const { hasMeaningfulRichText, sanitizeRichTextHtml } = require('../utils/htmlSanitizer');

function getActiveProductStatusCondition() {
    return {
        [Op.or]: [
            PRODUCT_STATUS.ACTIVE,
            null,
        ],
    };
}

function getComponentTypeCondition(componentType) {
    const values = getComponentTypeQueryValues(componentType);
    if (!values.length) return null;
    if (values.length === 1) return values[0];
    return { [Op.in]: values };
}

function parseSpecFilters(rawSpecFilters) {
    if (!rawSpecFilters) return {};

    let parsedFilters = rawSpecFilters;
    if (typeof rawSpecFilters === 'string') {
        try {
            parsedFilters = JSON.parse(rawSpecFilters);
        } catch (error) {
            return {};
        }
    }

    if (!parsedFilters || typeof parsedFilters !== 'object' || Array.isArray(parsedFilters)) {
        return {};
    }

    return Object.entries(parsedFilters).reduce((accumulator, [specKey, values]) => {
        const normalizedValues = (Array.isArray(values) ? values : [values])
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean);

        if (normalizedValues.length > 0) accumulator[specKey] = [...new Set(normalizedValues)];
        return accumulator;
    }, {});
}

async function getMatchingProductIdsBySpecFilters({ componentType, category, specFilters }) {
    const normalizedSpecFilters = parseSpecFilters(specFilters);
    const specEntries = Object.entries(normalizedSpecFilters);
    if (!componentType || specEntries.length === 0) return null;

    const componentTypeCondition = getComponentTypeCondition(componentType);
    if (!componentTypeCondition) return [];

    const productWhereClause = {
        componentType: componentTypeCondition,
        status: getActiveProductStatusCondition(),
    };
    if (category && category !== 'all') productWhereClause.categoryId = category;

    const distinctSpecKeyCount = Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('spec_key')));

    const rows = await ProductSpec.findAll({
        include: [{
            model: modelProducts,
            attributes: [],
            required: true,
            where: productWhereClause,
            include: [getSellableCategoryInclude()],
        }],
        where: {
            [Op.or]: specEntries.map(([specKey, specValues]) => ({
                specKey,
                specValue: { [Op.in]: specValues },
            })),
        },
        attributes: [
            'productId',
            [distinctSpecKeyCount, 'matchedSpecCount'],
        ],
        group: ['productId'],
        having: Sequelize.where(
            distinctSpecKeyCount,
            specEntries.length,
        ),
        raw: true,
    });

    return rows.map((row) => row.productId);
}

function parseProductIds(rawProductIds) {
    if (!rawProductIds || typeof rawProductIds !== 'string') return null;
    const productIds = rawProductIds.split(',').map((item) => item.trim()).filter(Boolean);
    return productIds.length > 0 ? productIds : null;
}

function mergeProductIdFilters(...filters) {
    const activeFilters = filters.filter((filter) => Array.isArray(filter));
    if (!activeFilters.length) return null;

    let mergedIds = [...new Set(activeFilters[0])];
    for (const filter of activeFilters.slice(1)) {
        const filterSet = new Set(filter);
        mergedIds = mergedIds.filter((productId) => filterSet.has(productId));
    }
    return mergedIds;
}

function buildProductWhereClause({ categoryId, search, minPrice, maxPrice, productIds, componentType, specMatchedIds }) {
    const whereClause = { status: getActiveProductStatusCondition() };
    if (categoryId && categoryId !== 'all') whereClause.categoryId = categoryId;

    if (componentType) {
        const componentTypeCondition = getComponentTypeCondition(componentType);
        if (componentTypeCondition) whereClause.componentType = componentTypeCondition;
    }

    if (search && search.trim() !== '') whereClause.name = { [Op.like]: `%${search.trim()}%` };

    const hasMinPrice = minPrice !== undefined && minPrice !== null && minPrice !== '';
    const hasMaxPrice = maxPrice !== undefined && maxPrice !== null && maxPrice !== '';
    if (hasMinPrice || hasMaxPrice) {
        whereClause.price = {};
        if (hasMinPrice) whereClause.price[Op.gte] = minPrice;
        if (hasMaxPrice) whereClause.price[Op.lte] = maxPrice;
    }

    const mergedProductIds = mergeProductIdFilters(parseProductIds(productIds), specMatchedIds);
    if (mergedProductIds) whereClause.id = { [Op.in]: mergedProductIds };

    return whereClause;
}

function getProductOrder(sort = 'newest') {
    const discountedPriceOrder = Sequelize.literal('ROUND(price * (1 - COALESCE(discount, 0) / 100))');

    switch (sort) {
        case 'price-asc':
            return [[discountedPriceOrder, 'ASC'], ['createdAt', 'DESC']];
        case 'price-desc':
            return [[discountedPriceOrder, 'DESC'], ['createdAt', 'DESC']];
        case 'discount':
            return [['discount', 'DESC'], ['createdAt', 'DESC']];
        default:
            return [['createdAt', 'DESC']];
    }
}

function buildSpecRecords(productId, specs = []) {
    if (!Array.isArray(specs)) return [];
    return specs
        .filter((spec) => spec.specKey && spec.specValue)
        .map((spec) => ({ productId, specKey: spec.specKey, specValue: spec.specValue }));
}

function getRequestPcConfiguration(body = {}) {
    return body.pcConfiguration || null;
}

async function findCategoryForManagement(categoryId, transaction) {
    const category = await modelCategory.findByPk(categoryId, {
        paranoid: false,
        ...(transaction ? { transaction } : {}),
    });

    if (!category) {
        throw new BadRequestError('Danh mục không tồn tại');
    }

    if (category.deletedAt) {
        throw new BadRequestError('Danh mục đã nằm trong thùng rác. Hãy khôi phục hoặc chọn danh mục khác.');
    }

    return category;
}

async function ensureStorefrontCategoryVisible(categoryId) {
    const category = await modelCategory.findOne({
        where: {
            id: categoryId,
            status: CATEGORY_STATUS.ACTIVE,
        },
    });

    if (!category) {
        throw new NotFoundError('Danh mục không tồn tại hoặc đã ngừng hiển thị');
    }

    return category;
}

async function assertProductCategorySupportsStatus(categoryId, status, transaction, currentProduct = null) {
    const category = await findCategoryForManagement(categoryId, transaction);

    if (normalizeProductStatus(status) === PRODUCT_STATUS.ACTIVE && category.status !== CATEGORY_STATUS.ACTIVE) {
        if (
            currentProduct
            && currentProduct.categoryId === category.id
            && normalizeProductStatus(currentProduct.status) === PRODUCT_STATUS.ACTIVE
        ) {
            return category;
        }

        throw new BadRequestError('Không thể mở bán sản phẩm khi danh mục đang tạm khóa.');
    }

    return category;
}

function assertManageableProduct(product) {
    if (!product) {
        throw new BadRequestError('Không tìm thấy sản phẩm');
    }
}

function assertNotDeletedProduct(product) {
    assertManageableProduct(product);
    if (product.deletedAt) {
        throw new BadRequestError('Sản phẩm đã ở trong thùng rác. Hãy khôi phục trước khi đổi trạng thái.');
    }
}

async function findProductsForList({ whereClause, sort, pagination }) {
    const queryOptions = {
        where: whereClause,
        order: getProductOrder(sort),
        include: getPublicProductBaseInclude(),
    };

    if (pagination) {
        const { count, rows } = await modelProducts.findAndCountAll({
            ...queryOptions,
            limit: pagination.limit,
            offset: pagination.offset,
        });
        return { items: rows, pagination: buildPaginationMeta(count, pagination) };
    }

    return { items: await modelProducts.findAll(queryOptions), pagination: null };
}

async function findProductByIdWithBaseInclude(id, extraInclude = [], options = {}) {
    const adminScope = options.adminScope === true;
    const includeDeleted = adminScope && (options.includeDeleted === true || options.includeDeleted === 'true');
    const whereClause = { id };
    const includeUnavailable = !adminScope && (options.includeUnavailable === true || options.includeDeleted === true || options.includeDeleted === 'true');
    if (!adminScope && !includeUnavailable) {
        whereClause.status = getActiveProductStatusCondition();
    }

    return modelProducts.findOne({
        where: whereClause,
        paranoid: adminScope ? !includeDeleted : !includeUnavailable,
        include: [
            ...(adminScope
                ? getProductBaseInclude()
                : getProductAvailabilityBaseInclude({ requiredCategory: false })),
            ...extraInclude,
        ],
    });
}

async function createProduct(payload) {
    const normalizedComponentType = normalizeComponentType(payload.componentType);
    const normalizedStatus = normalizeProductStatus(payload.status);
    const sanitizedDescription = sanitizeRichTextHtml(payload.description);
    if (!hasMeaningfulRichText(sanitizedDescription)) {
        throw new BadRequestError('Mô tả sản phẩm không được để trống');
    }

    const productData = {
        name: payload.name,
        price: Number(payload.price),
        description: sanitizedDescription,
        images: payload.images,
        categoryId: payload.category,
        stock: Number(payload.stock),
        componentType: normalizedComponentType,
        discount: Number(payload.discount) || 0,
        status: normalizedStatus,
    };

    const product = await connect.transaction(async (transaction) => {
        await assertProductCategorySupportsStatus(payload.category, normalizedStatus, transaction);
        const createdProduct = await modelProducts.create(productData, { transaction });
        if (normalizedComponentType === 'pc') {
            await upsertPcConfiguration({
                productId: createdProduct.id,
                source: getRequestPcConfiguration(payload),
                transaction,
            });
        } else {
            const specRecords = buildSpecRecords(createdProduct.id, payload.specs);
            if (specRecords.length > 0) await ProductSpec.bulkCreate(specRecords, { transaction });
        }
        return createdProduct;
    });

    return findProductByIdWithBaseInclude(product.id, [], { adminScope: true });
}

async function getProducts(filters = {}, pagination, { adminScope = false } = {}) {
    const includeDeleted = adminScope && (filters.includeDeleted === true || filters.includeDeleted === 'true');
    const status = adminScope ? (filters.status || PRODUCT_STATUS.ACTIVE) : PRODUCT_STATUS.ACTIVE;
    const whereClause = {};
    const search = filters.search?.trim();

    if (status === 'deleted') {
        whereClause.deletedAt = { [Op.ne]: null };
    } else if (status !== 'all') {
        whereClause.deletedAt = null;
        whereClause.status = status === PRODUCT_STATUS.ACTIVE
            ? getActiveProductStatusCondition()
            : normalizeProductStatus(status);
    } else if (!includeDeleted) {
        whereClause.deletedAt = null;
    }

    if (filters.categoryId) {
        whereClause.categoryId = filters.categoryId;
    }

    if (filters.componentType) {
        const componentTypeCondition = getComponentTypeCondition(filters.componentType);
        if (componentTypeCondition) {
            whereClause.componentType = componentTypeCondition;
        }
    }

    if (search) {
        whereClause.name = { [Op.like]: `%${search}%` };
    }

    if (filters.stockStatus === 'out_of_stock') {
        whereClause.stock = { [Op.lte]: 0 };
    } else if (filters.stockStatus === 'low_stock') {
        whereClause.stock = { [Op.between]: [1, 5] };
    } else if (filters.stockStatus === 'in_stock') {
        whereClause.stock = { [Op.gt]: 0 };
    }

    const queryOptions = {
        where: whereClause,
        order: [['createdAt', 'DESC']],
        paranoid: !(includeDeleted || (adminScope && status === 'deleted')),
        include: adminScope ? getProductBaseInclude() : getPublicProductBaseInclude(),
    };

    if (!pagination) {
        return {
            items: await modelProducts.findAll(queryOptions),
            pagination: null,
        };
    }

    const { count, rows } = await modelProducts.findAndCountAll({
        ...queryOptions,
        limit: pagination.limit,
        offset: pagination.offset,
    });

    return {
        items: rows,
        pagination: buildPaginationMeta(count, pagination),
    };
}

async function updateProduct(payload) {
    const product = await modelProducts.findOne({ where: { id: payload.id } });
    if (!product) throw new BadRequestError('Không tìm thấy sản phẩm');

    const normalizedComponentType = normalizeComponentType(payload.componentType);
    const normalizedStatus = normalizeProductStatus(payload.status ?? product.status);
    const sanitizedDescription = sanitizeRichTextHtml(payload.description);
    if (!hasMeaningfulRichText(sanitizedDescription)) {
        throw new BadRequestError('Mô tả sản phẩm không được để trống');
    }

    await connect.transaction(async (transaction) => {
        await assertProductCategorySupportsStatus(payload.category, normalizedStatus, transaction, product);
        await product.update({
            name: payload.name,
            price: Number(payload.price),
            description: sanitizedDescription,
            discount: Number(payload.discount) || 0,
            images: payload.images ?? product.images,
            categoryId: payload.category,
            stock: Number(payload.stock),
            componentType: normalizedComponentType,
            status: normalizedStatus,
        }, { transaction });

        if (normalizedComponentType === 'pc') {
            await ProductSpec.destroy({ where: { productId: payload.id }, transaction });
            await upsertPcConfiguration({
                productId: payload.id,
                source: getRequestPcConfiguration(payload),
                transaction,
            });
            return;
        }

        await removePcConfiguration({ productId: payload.id, transaction });
        if (Array.isArray(payload.specs)) {
            await ProductSpec.destroy({ where: { productId: payload.id }, transaction });
            const specRecords = buildSpecRecords(payload.id, payload.specs);
            if (specRecords.length > 0) await ProductSpec.bulkCreate(specRecords, { transaction });
        }
    });

    return findProductByIdWithBaseInclude(payload.id, [], { adminScope: true });
}

async function deleteProduct(id) {
    const product = await modelProducts.findByPk(id);
    assertManageableProduct(product);

    await connect.transaction(async (transaction) => {
        if (product.status !== PRODUCT_STATUS.INACTIVE) {
            await product.update({ status: PRODUCT_STATUS.INACTIVE }, { transaction });
        }

        await product.destroy({ transaction });
    });
    return product;
}

async function updateProductStatus(id, status) {
    const product = await modelProducts.findByPk(id);
    assertNotDeletedProduct(product);

    const nextStatus = normalizeProductStatus(status);
    if (product.status === nextStatus) {
        return { changed: false, product };
    }

    await assertProductCategorySupportsStatus(product.categoryId, nextStatus);
    await product.update({ status: nextStatus });
    return { changed: true, product };
}

async function restoreProduct(id) {
    const product = await modelProducts.findByPk(id, { paranoid: false });
    assertManageableProduct(product);
    if (!product.deletedAt) return { restored: false, product };
    await findCategoryForManagement(product.categoryId);
    await product.restore();
    await product.update({ status: PRODUCT_STATUS.INACTIVE });
    return { restored: true, product };
}

async function permanentlyDeleteProduct(id) {
    const product = await modelProducts.findByPk(id, { paranoid: false });
    assertManageableProduct(product);

    if (!product.deletedAt) {
        throw new BadRequestError('Chỉ có thể xóa vĩnh viễn sản phẩm đã nằm trong thùng rác');
    }

    const orderItemCount = await modelOrderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
        throw new BadRequestError('Không thể xóa vĩnh viễn sản phẩm đã phát sinh trong đơn hàng. Hãy giữ sản phẩm trong thùng rác để bảo toàn lịch sử mua hàng và đối soát.');
    }

    await connect.transaction(async (transaction) => {
        await Promise.all([
            modelCart.destroy({ where: { productId: id }, force: true, transaction }),
            modelBuildPcCart.destroy({ where: { productId: id }, force: true, transaction }),
            modelUserWatchProduct.destroy({ where: { productId: id }, force: true, transaction }),
            modelProductReview.destroy({ where: { productId: id }, force: true, transaction }),
            ProductSpec.destroy({ where: { productId: id }, force: true, transaction }),
            PcConfiguration.destroy({ where: { productId: id }, force: true, transaction }),
        ]);

        await product.destroy({ force: true, transaction });
    });

    return { deleted: true };
}

async function getProductsByCategories() {
    const categories = await modelCategory.findAll({
        where: {
            deletedAt: null,
            status: CATEGORY_STATUS.ACTIVE,
        },
        include: [{
            model: modelProducts,
            where: { status: getActiveProductStatusCondition() },
            required: false,
            include: getProductBaseInclude(),
        }],
    });

    return categories.map((category) => ({
        category: { id: category.id, name: category.name },
        products: getPlainProductsWithPcConfiguration(category.products || []),
    }));
}

async function getProductById(id, options = {}) {
    const adminScope = options.adminScope === true;
    const product = await findProductByIdWithBaseInclude(id, [
        { model: ProductSpec, as: 'specs', attributes: ['specKey', 'specValue'] },
    ], {
        adminScope,
        includeDeleted: options.includeDeleted,
        includeUnavailable: options.includeUnavailable,
    });
    if (!product) throw new BadRequestError('Không tìm thấy sản phẩm');

    const includeDeleted = adminScope && (options.includeDeleted === true || options.includeDeleted === 'true');
    const reviews = includeDeleted
        ? await modelProductReview.findAll({
            where: { productId: id },
            include: [{ model: modelUser, attributes: ['id', 'fullName'], paranoid: false }],
            order: [['createdAt', 'DESC']],
            paranoid: false,
        })
        : await getApprovedReviews(id);

    return {
        product: getPlainProductWithPcConfiguration(product),
        reviews: includeDeleted
            ? reviews.map((item) => {
                const review = item.toJSON();
                return {
                    ...review,
                    user: review.user ? { id: review.user.id, name: review.user.fullName } : null,
                };
            })
            : reviews,
    };
}

async function getProductByComponentType(componentType) {
    const componentTypeCondition = getComponentTypeCondition(componentType);
    if (!componentTypeCondition) throw new BadRequestError('Loại linh kiện không hợp lệ');

    const products = await modelProducts.findAll({
        where: {
            componentType: componentTypeCondition,
            status: getActiveProductStatusCondition(),
        },
        include: getPublicProductBaseInclude(),
    });

    return getPlainProductsWithPcConfiguration(products);
}

async function getProductByIdCategory(query, pagination) {
    await ensureStorefrontCategoryVisible(query.id);

    return findProductsForList({
        whereClause: buildProductWhereClause({
            categoryId: query.id,
            search: query.search,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            productIds: query.productIds,
        }),
        sort: query.sort,
        pagination,
    });
}

async function getProductHotSale() {
    const products = await modelProducts.findAll({
        where: {
            discount: { [Op.gt]: 20 },
            status: getActiveProductStatusCondition(),
        },
        include: getPublicProductBaseInclude(),
    });
    return getPlainProductsWithPcConfiguration(products);
}

async function getProductSearch(query, pagination) {
    return findProductsForList({
        whereClause: buildProductWhereClause({
            search: query.search,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            productIds: query.productIds,
        }),
        sort: query.sort,
        pagination,
    });
}

async function getProductSearchByCategory(query, pagination) {
    if (query.category && query.category !== 'all') {
        await ensureStorefrontCategoryVisible(query.category);
    }

    const specMatchedProductIds = await getMatchingProductIdsBySpecFilters({
        componentType: query.componentType,
        category: query.category,
        specFilters: query.specFilters,
    });

    return findProductsForList({
        whereClause: buildProductWhereClause({
            categoryId: query.category,
            search: query.search,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            productIds: query.productIds,
            componentType: query.componentType,
            specMatchedIds: specMatchedProductIds,
        }),
        sort: query.sort,
        pagination,
    });
}

module.exports = {
    createProduct,
    deleteProduct,
    getProductByComponentType,
    getProductById,
    getProductByIdCategory,
    getProductHotSale,
    getProductSearch,
    getProductSearchByCategory,
    getProducts,
    getProductsByCategories,
    permanentlyDeleteProduct,
    restoreProduct,
    updateProductStatus,
    updateProduct,
};
