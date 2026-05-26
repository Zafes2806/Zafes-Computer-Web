const { OK, Created } = require('../core/success.response');
const componentTypeService = require('../services/componentType.service');
const { parsePaginationQuery } = require('../utils/pagination');
const { isForceDelete } = require('../utils/requestFlags');

async function getAll(req, res) {
    const pagination = req.user?.isAdmin
        ? parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 })
        : null;
    const result = await componentTypeService.getAll(req.query, pagination, {
        adminScope: Boolean(req.user?.isAdmin),
    });

    return new OK({
        message: 'Lấy danh sách loại linh kiện thành công',
        metadata: result.items,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function create(req, res) {
    const metadata = await componentTypeService.create(req.body);
    return new Created({
        message: 'Tạo loại linh kiện thành công',
        metadata,
    }).send(res);
}

async function update(req, res) {
    const metadata = await componentTypeService.update(req.params.code, req.body);
    return new OK({
        message: 'Cập nhật loại linh kiện thành công',
        metadata,
    }).send(res);
}

async function updateStatus(req, res) {
    const result = await componentTypeService.updateStatus(req.params.code, req.body.status);
    return new OK({
        message: result.changed ? 'Cập nhật trạng thái loại linh kiện thành công' : 'Trạng thái loại linh kiện không thay đổi',
        metadata: result.componentType,
    }).send(res);
}

async function deleteComponentType(req, res) {
    if (isForceDelete(req)) {
        await componentTypeService.permanentlyDelete(req.params.code);
        return new OK({ message: 'Xóa vĩnh viễn loại linh kiện thành công' }).send(res);
    }

    await componentTypeService.deleteComponentType(req.params.code);
    return new OK({ message: 'Xóa loại linh kiện thành công' }).send(res);
}

async function restore(req, res) {
    const result = await componentTypeService.restore(req.params.code);
    return new OK({
        message: result.restored ? 'Khôi phục loại linh kiện thành công' : 'Loại linh kiện đang hoạt động',
        metadata: result.componentType,
    }).send(res);
}

module.exports = {
    create,
    deleteComponentType,
    getAll,
    restore,
    update,
    updateStatus,
};
