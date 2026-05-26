const { OK, Created } = require('../core/success.response');
const categoryService = require('../services/category.service');
const { parsePaginationQuery } = require('../utils/pagination');
const { isForceDelete } = require('../utils/requestFlags');

async function createCategory(req, res) {
    const metadata = await categoryService.createCategory(req.body);
    return new Created({
        message: 'Tạo danh mục thành công',
        metadata,
    }).send(res);
}

async function getAllCategory(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 });
    const result = await categoryService.getAllCategory(req.query, pagination, {
        adminScope: Boolean(req.user?.isAdmin),
    });
    return new OK({
        message: 'Lấy danh sách danh mục thành công',
        metadata: result.items,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function getCategoryAvailability(req, res) {
    const metadata = await categoryService.getCategoryAvailability(req.params.id);
    return new OK({
        message: 'Lấy trạng thái danh mục thành công',
        metadata,
    }).send(res);
}

async function deleteCategory(req, res) {
    if (isForceDelete(req)) {
        await categoryService.permanentlyDeleteCategory(req.params.id);
        return new OK({ message: 'Xóa vĩnh viễn danh mục thành công' }).send(res);
    }

    const metadata = await categoryService.deleteCategory(req.params.id);
    return new OK({
        message: 'Xóa danh mục thành công',
        metadata,
    }).send(res);
}

async function restoreCategory(req, res) {
    const result = await categoryService.restoreCategory(req.params.id);

    if (!result.restored) {
        return new OK({
            message: 'Danh mục đang hoạt động',
            metadata: result.category,
        }).send(res);
    }

    return new OK({
        message: 'Khôi phục danh mục thành công',
        metadata: result.category,
    }).send(res);
}

async function updateCategory(req, res) {
    const metadata = await categoryService.updateCategory({ ...req.body, id: req.params.id });
    return new OK({ message: 'Cập nhật danh mục thành công', metadata }).send(res);
}

async function updateCategoryStatus(req, res) {
    const result = await categoryService.updateCategoryStatus(req.params.id, req.body.status);
    return new OK({
        message: result.changed ? 'Cập nhật trạng thái danh mục thành công' : 'Trạng thái danh mục không thay đổi',
        metadata: result.category,
    }).send(res);
}

async function getCategoryByComponentTypes(req, res) {
    const metadata = await categoryService.getCategoryByComponentTypes(req.query);
    return new OK({
        message: 'Lấy danh sách linh kiện thành công',
        metadata,
    }).send(res);
}

async function getAllProductsWithFilters(req, res) {
    const metadata = await categoryService.getAllProductsWithFilters();
    return new OK({
        message: 'Lấy danh sách sản phẩm thành công',
        metadata,
    }).send(res);
}

module.exports = {
    createCategory,
    deleteCategory,
    getAllCategory,
    getAllProductsWithFilters,
    getCategoryAvailability,
    getCategoryByComponentTypes,
    restoreCategory,
    updateCategory,
    updateCategoryStatus,
};
