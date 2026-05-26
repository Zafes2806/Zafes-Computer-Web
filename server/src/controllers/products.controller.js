const { OK, Created } = require('../core/success.response');
const productService = require('../services/product.service');
const { getPlainProductWithPcConfiguration, getPlainProductsWithPcConfiguration } = require('../utils/pcConfiguration');
const { parsePaginationQuery } = require('../utils/pagination');
const { isForceDelete } = require('../utils/requestFlags');

function sendProductListResponse(res, message, result) {
    return new OK({
        message,
        metadata: getPlainProductsWithPcConfiguration(result.items),
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function createProduct(req, res) {
    const createdProduct = await productService.createProduct(req.body);
    return new Created({
        message: 'Tạo sản phẩm thành công',
        metadata: getPlainProductWithPcConfiguration(createdProduct),
    }).send(res);
}

async function getProducts(req, res) {
    const adminScope = Boolean(req.user?.isAdmin);
    const pagination = parsePaginationQuery(req.query, {
        defaultLimit: 20,
        maxLimit: 500,
        alwaysPaginate: true,
    });
    const result = await productService.getProducts(
        {
            includeDeleted: req.query.includeDeleted,
            status: req.query.status,
            search: req.query.search,
            categoryId: req.query.categoryId,
            componentType: req.query.componentType,
            stockStatus: req.query.stockStatus,
        },
        pagination,
        { adminScope },
    );
    return sendProductListResponse(res, 'Lấy danh sách sản phẩm thành công', result);
}

async function updateProduct(req, res) {
    const updatedProduct = await productService.updateProduct({ ...req.body, id: req.params.id });
    return new OK({
        message: 'Cập nhật sản phẩm thành công',
        metadata: getPlainProductWithPcConfiguration(updatedProduct),
    }).send(res);
}

async function deleteProduct(req, res) {
    if (isForceDelete(req)) {
        await productService.permanentlyDeleteProduct(req.params.id);
        return new OK({ message: 'Xóa vĩnh viễn sản phẩm thành công' }).send(res);
    }

    const product = await productService.deleteProduct(req.params.id);
    return new OK({ message: 'Xóa sản phẩm thành công', metadata: product }).send(res);
}

async function updateProductStatus(req, res) {
    const result = await productService.updateProductStatus(req.params.id, req.body.status);
    return new OK({
        message: result.changed ? 'Cập nhật trạng thái sản phẩm thành công' : 'Trạng thái sản phẩm không thay đổi',
        metadata: getPlainProductWithPcConfiguration(result.product),
    }).send(res);
}

async function restoreProduct(req, res) {
    const result = await productService.restoreProduct(req.params.id);
    if (!result.restored) {
        return new OK({ message: 'Sản phẩm không nằm trong thùng rác', metadata: result.product }).send(res);
    }
    return new OK({
        message: 'Khôi phục sản phẩm thành công, sản phẩm đang ở trạng thái tạm khóa',
        metadata: getPlainProductWithPcConfiguration(result.product),
    }).send(res);
}

async function getProductsByCategories(req, res) {
    const metadata = await productService.getProductsByCategories();
    return new OK({ message: 'Lấy sản phẩm theo danh mục thành công', metadata }).send(res);
}

async function getProductById(req, res) {
    const adminScope = Boolean(req.user?.isAdmin)
        && (req.query.includeDeleted === true || req.query.includeDeleted === 'true');
    const metadata = await productService.getProductById(req.params.id, {
        adminScope,
        includeDeleted: req.query.includeDeleted,
        includeUnavailable: !adminScope,
    });
    return new OK({ message: 'Lấy chi tiết sản phẩm thành công', metadata }).send(res);
}

async function getProductByComponentType(req, res) {
    const metadata = await productService.getProductByComponentType(req.query.componentType);
    return new OK({ message: 'Lấy sản phẩm theo loại linh kiện thành công', metadata }).send(res);
}

async function getProductByIdCategory(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 });
    const result = await productService.getProductByIdCategory(
        { ...req.query, id: req.params.id },
        pagination,
    );
    return sendProductListResponse(res, 'Lấy danh sách sản phẩm theo danh mục thành công', result);
}

async function getProductHotSale(req, res) {
    const metadata = await productService.getProductHotSale();
    return new OK({ message: 'Lấy sản phẩm giảm giá thành công', metadata }).send(res);
}

async function getProductSearch(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 });
    const result = await productService.getProductSearch(req.query, pagination);
    return sendProductListResponse(res, 'Tìm kiếm sản phẩm thành công', result);
}

async function getProductSearchByCategory(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 });
    const result = await productService.getProductSearchByCategory(req.query, pagination);
    return sendProductListResponse(res, 'Tìm kiếm sản phẩm theo danh mục thành công', result);
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
    restoreProduct,
    updateProduct,
    updateProductStatus,
};
