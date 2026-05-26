const { Op } = require('sequelize');

const { connect } = require('../config/index');
const { normalizeComponentType, getComponentTypeQueryValues } = require('../constants/componentTypes');
const { CATEGORY_STATUS, normalizeCategoryStatus } = require('../constants/categoryStatus');
const { SPEC_DEFINITION_STATUS } = require('../constants/specDefinitionStatus');
const { PRODUCT_STATUS } = require('../constants/productStatus');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const modelCategory = require('../models/category.model');
const ProductSpec = require('../models/productSpec.model');
const modelProduct = require('../models/products.model');
const SpecDefinition = require('../models/specDefinition.model');
const { getPublicProductBaseInclude } = require('../utils/productQuery');
const { getPlainProductsWithPcConfiguration } = require('../utils/pcConfiguration');
const { buildPaginationMeta } = require('../utils/pagination');

const COMPONENT_FILTER_TYPES = [
    'cpu',
    'ram',
    'vga',
    'mainboard',
    'ssd',
    'hdd',
    'power',
    'cooler',
    'case',
    'monitor',
    'keyboard',
    'mouse',
    'headset',
];

function parseDefinitionOptions(options) {
    if (Array.isArray(options)) {
        return options;
    }

    if (typeof options === 'string') {
        try {
            const parsed = JSON.parse(options);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    return [];
}

function createComponentBucketMaps() {
    return new Map(COMPONENT_FILTER_TYPES.map((type) => [type, new Map()]));
}

function ensureTypeBucket(buckets, type) {
    if (!buckets.has(type)) {
        buckets.set(type, new Map());
    }

    return buckets.get(type);
}

function addComponentValue(buckets, type, name, productId) {
    if (!name) {
        return;
    }

    const typeBucket = ensureTypeBucket(buckets, type);
    if (!typeBucket.has(name)) {
        typeBucket.set(name, new Set());
    }

    if (productId) {
        typeBucket.get(name).add(productId);
    }
}

function addPcConfigurationComponents(buckets, product) {
    const pcConfiguration = product.pcConfiguration || {};

    addComponentValue(buckets, 'cpu', pcConfiguration.cpu, product.id);
    addComponentValue(buckets, 'ram', pcConfiguration.ram, product.id);
    addComponentValue(buckets, 'mainboard', pcConfiguration.motherboard, product.id);
    addComponentValue(buckets, 'vga', pcConfiguration.gpu, product.id);
    addComponentValue(buckets, 'cooler', pcConfiguration.cooler, product.id);
    addComponentValue(buckets, 'power', pcConfiguration.power, product.id);
    addComponentValue(buckets, 'case', pcConfiguration.computerCase, product.id);

    const storage = typeof pcConfiguration.storage === 'string' ? pcConfiguration.storage.trim() : '';
    if (!storage) {
        return;
    }

    const normalizedStorage = storage.toLowerCase();
    if (normalizedStorage.includes('ssd')) {
        addComponentValue(buckets, 'ssd', storage, product.id);
    } else if (normalizedStorage.includes('hdd')) {
        addComponentValue(buckets, 'hdd', storage, product.id);
    }
}

function addStandaloneComponent(buckets, product) {
    const normalizedType = normalizeComponentType(product.componentType);
    if (!normalizedType || normalizedType === 'pc') {
        return;
    }

    addComponentValue(buckets, normalizedType, product.name, product.id);
}

function buildComponentBuckets(products) {
    const buckets = createComponentBucketMaps();

    products.forEach((product) => {
        addPcConfigurationComponents(buckets, product);
        addStandaloneComponent(buckets, product);
    });

    return buckets;
}

function serializeGroupedBuckets(buckets) {
    const result = [];

    for (const [type, componentsByName] of buckets.entries()) {
        const components = [];

        for (const [name, productIds] of componentsByName.entries()) {
            productIds.forEach((productId) => {
                components.push({
                    id: `${type}-${productId}`,
                    name,
                    type,
                    productId,
                });
            });
        }

        if (components.length > 0) {
            result.push({
                type,
                label: type,
                components,
            });
        }
    }

    return result;
}

function serializeUniqueBuckets(buckets) {
    const result = [];

    for (const [type, componentsByName] of buckets.entries()) {
        const components = [];

        for (const [name, productIds] of componentsByName.entries()) {
            const [productId] = Array.from(productIds);
            if (!productId) {
                continue;
            }

            components.push({
                id: `${type}-${productId}`,
                name,
                type,
                productId,
            });
        }

        if (components.length > 0) {
            result.push({
                type,
                label: type,
                components,
            });
        }
    }

    return result;
}

async function buildSpecDefinitionFilters(products, normalizedComponentType) {
    const nonPcProducts = products.filter((product) => product.componentType && product.componentType !== 'pc');
    const nonPcProductIds = nonPcProducts.map((product) => product.id);

    const definitionComponentTypes = normalizedComponentType
        ? [normalizedComponentType]
        : [...new Set(nonPcProducts.map((product) => normalizeComponentType(product.componentType)).filter(Boolean))];

    if (!definitionComponentTypes.length) {
        return [];
    }

    const [specs, definitions] = await Promise.all([
        nonPcProductIds.length > 0
            ? ProductSpec.findAll({
                where: { productId: { [Op.in]: nonPcProductIds } },
                attributes: ['specKey', 'specValue', 'productId'],
            })
            : [],
        SpecDefinition.findAll({
            where: {
                componentType: {
                    [Op.in]: definitionComponentTypes,
                },
                status: SPEC_DEFINITION_STATUS.ACTIVE,
            },
            order: [
                ['componentType', 'ASC'],
                ['displayOrder', 'ASC'],
                ['id', 'ASC'],
            ],
        }),
    ]);

    const productTypeMap = new Map(
        nonPcProducts.map((product) => [product.id, normalizeComponentType(product.componentType)]),
    );
    const valueProductMap = new Map();

    specs.forEach((spec) => {
        const componentType = productTypeMap.get(spec.productId);
        if (!componentType) {
            return;
        }

        const valueKey = `${componentType}:${spec.specKey}:${spec.specValue}`;
        if (!valueProductMap.has(valueKey)) {
            valueProductMap.set(valueKey, new Set());
        }

        valueProductMap.get(valueKey).add(spec.productId);
    });

    return definitions.map((definition) => {
        const options = parseDefinitionOptions(definition.options);
        const components = options.map((value) => {
            const valueKey = `${definition.componentType}:${definition.specKey}:${value}`;
            const productIds = Array.from(valueProductMap.get(valueKey) || []);

            return {
                id: `spec-${definition.componentType}-${definition.specKey}-${value}`,
                name: value,
                type: `${definition.componentType}:${definition.specKey}`,
                productId: productIds[0] || null,
                allProductIds: productIds,
                specBased: true,
                count: productIds.length,
            };
        });

        return {
            type: `${definition.componentType}:${definition.specKey}`,
            label: definition.label,
            componentType: definition.componentType,
            specKey: definition.specKey,
            specBased: true,
            components,
        };
    });
}

async function getProductsForFilters(queryOptions = {}) {
    const where = {
        deletedAt: null,
        status: PRODUCT_STATUS.ACTIVE,
        ...(queryOptions.where || {}),
    };

    const products = await modelProduct.findAll({
        ...queryOptions,
        where,
        include: getPublicProductBaseInclude(),
    });

    return getPlainProductsWithPcConfiguration(products);
}

function buildCategoryListWhere(query = {}, adminScope = false) {
    const includeDeleted = adminScope && (query.includeDeleted === true || query.includeDeleted === 'true');
    const status = adminScope ? query.status || CATEGORY_STATUS.ACTIVE : CATEGORY_STATUS.ACTIVE;
    const search = query.search?.trim();
    const whereClause = {};

    if (search) {
        whereClause.name = { [Op.like]: `%${search}%` };
    }

    if (status === 'deleted') {
        whereClause.deletedAt = { [Op.ne]: null };
    } else if (status === 'all') {
        if (!includeDeleted) {
            whereClause.deletedAt = null;
        }
    } else {
        whereClause.deletedAt = null;
        whereClause.status = normalizeCategoryStatus(status);
    }

    return {
        includeDeleted,
        whereClause,
    };
}

async function createCategory(payload) {
    const name = payload.name?.trim();
    const image = payload.image?.trim();

    if (!name || !image) {
        throw new BadRequestError('Tên và ảnh là bắt buộc');
    }

    return modelCategory.create({
        name,
        image,
        status: normalizeCategoryStatus(payload.status),
    });
}

async function getAllCategory(query = {}, pagination = null, { adminScope = false } = {}) {
    const { includeDeleted, whereClause } = buildCategoryListWhere(query, adminScope);
    const options = {
        where: whereClause,
        paranoid: !(includeDeleted || query.status === 'deleted'),
        order: [['createdAt', 'DESC']],
    };

    if (!pagination) {
        return {
            items: await modelCategory.findAll(options),
            pagination: null,
        };
    }

    const { count, rows } = await modelCategory.findAndCountAll({
        ...options,
        limit: pagination.limit,
        offset: pagination.offset,
    });

    return {
        items: rows,
        pagination: buildPaginationMeta(count, pagination),
    };
}

async function getCategoryAvailability(id) {
    const category = await modelCategory.findByPk(id, {
        paranoid: false,
        attributes: ['id', 'name', 'status', 'deletedAt'],
    });

    if (!category) {
        throw new NotFoundError('Không tìm thấy danh mục');
    }

    const availability = category.deletedAt
        ? 'deleted'
        : category.status === CATEGORY_STATUS.ACTIVE
            ? 'active'
            : 'inactive';

    return {
        id: category.id,
        name: category.name,
        status: category.status,
        deletedAt: category.deletedAt,
        availability,
    };
}

async function countLinkedProducts(categoryId, { includeDeleted = true } = {}) {
    return modelProduct.count({
        where: { categoryId },
        paranoid: !includeDeleted,
    });
}

async function ensureNoProductsLinked(categoryId, { includeDeleted = true, errorMessage } = {}) {
    const linkedProductsCount = await countLinkedProducts(categoryId, { includeDeleted });

    if (linkedProductsCount > 0) {
        throw new BadRequestError(errorMessage || 'Không thể thao tác với danh mục đang có sản phẩm liên kết');
    }
}

async function deleteCategory(id) {
    const category = await modelCategory.findByPk(id);
    if (!category) {
        throw new BadRequestError('Không tìm thấy danh mục');
    }
    await connect.transaction(async (transaction) => {
        if (category.status !== CATEGORY_STATUS.INACTIVE) {
            await category.update({ status: CATEGORY_STATUS.INACTIVE }, { transaction });
        }

        await category.destroy({ transaction });
    });
    return category;
}

async function restoreCategory(id) {
    const category = await modelCategory.findByPk(id, { paranoid: false });
    if (!category) {
        throw new BadRequestError('Không tìm thấy danh mục');
    }

    if (!category.deletedAt) {
        return {
            restored: false,
            category,
        };
    }

    await category.restore();
    await category.update({ status: CATEGORY_STATUS.INACTIVE });
    return {
        restored: true,
        category,
    };
}

async function permanentlyDeleteCategory(id) {
    const category = await modelCategory.findByPk(id, { paranoid: false });
    if (!category) {
        throw new BadRequestError('Không tìm thấy danh mục');
    }
    if (!category.deletedAt) {
        throw new BadRequestError('Chỉ có thể xóa vĩnh viễn danh mục đang ở trong thùng rác');
    }

    await ensureNoProductsLinked(id, {
        includeDeleted: true,
        errorMessage: 'Không thể xóa vĩnh viễn danh mục khi vẫn còn sản phẩm liên kết, kể cả trong thùng rác.',
    });
    await category.destroy({ force: true });
}

async function updateCategory(payload) {
    const category = await modelCategory.findByPk(payload.id);
    if (!category) {
        throw new BadRequestError('Không tìm thấy danh mục');
    }

    const name = payload.name?.trim();
    const image = payload.image?.trim();
    if (!name || !image) {
        throw new BadRequestError('Tên và ảnh là bắt buộc');
    }

    await category.update({
        name,
        image,
    });

    return category;
}

async function updateCategoryStatus(id, status) {
    const category = await modelCategory.findByPk(id);
    if (!category) {
        throw new BadRequestError('Không tìm thấy danh mục');
    }

    const nextStatus = normalizeCategoryStatus(status);
    if (category.status === nextStatus) {
        return { changed: false, category };
    }

    await category.update({ status: nextStatus });
    return { changed: true, category };
}

async function getCategoryByComponentTypes(query) {
    const normalizedComponentType = normalizeComponentType(query.componentType);
    const whereClause = {
        deletedAt: null,
        status: PRODUCT_STATUS.ACTIVE,
    };

    if (query.categoryId) {
        whereClause.categoryId = query.categoryId;
    }

    if (normalizedComponentType) {
        const queryValues = getComponentTypeQueryValues(normalizedComponentType);
        if (queryValues.length === 1) {
            whereClause.componentType = queryValues[0];
        } else if (queryValues.length > 1) {
            whereClause.componentType = { [Op.in]: queryValues };
        }
    }

    const products = await getProductsForFilters({
        where: whereClause,
        attributes: ['id', 'name', 'componentType'],
    });

    const componentFilters = serializeGroupedBuckets(buildComponentBuckets(products));
    const specDefinitionFilters = await buildSpecDefinitionFilters(products, normalizedComponentType);

    return [...componentFilters, ...specDefinitionFilters];
}

async function getAllProductsWithFilters() {
    const products = await getProductsForFilters({
        attributes: ['id', 'name', 'price', 'images', 'componentType', 'createdAt'],
        order: [['createdAt', 'DESC']],
    });

    return {
        products,
        filters: serializeUniqueBuckets(buildComponentBuckets(products)),
    };
}

module.exports = {
    createCategory,
    deleteCategory,
    getCategoryAvailability,
    getAllCategory,
    getAllProductsWithFilters,
    getCategoryByComponentTypes,
    permanentlyDeleteCategory,
    restoreCategory,
    updateCategory,
    updateCategoryStatus,
};
