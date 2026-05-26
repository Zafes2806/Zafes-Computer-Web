const { OK, Created } = require('../core/success.response');
const specDefinitionService = require('../services/specDefinition.service');
const { parsePaginationQuery } = require('../utils/pagination');
const { isForceDelete } = require('../utils/requestFlags');

async function getAll(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 });
    const result = await specDefinitionService.getAll(req.query, pagination, {
        adminScope: Boolean(req.user?.isAdmin),
    });
    return new OK({
        message: 'Lấy danh sách thông số kỹ thuật thành công',
        metadata: result.items,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function create(req, res) {
    const metadata = await specDefinitionService.create(req.body);
    return new Created({
        message: 'Tạo thuộc tính thành công',
        metadata,
    }).send(res);
}

async function update(req, res) {
    const metadata = await specDefinitionService.update(req.params.id, req.body);
    return new OK({
        message: 'Cập nhật thuộc tính thành công',
        metadata,
    }).send(res);
}

async function updateStatus(req, res) {
    const result = await specDefinitionService.updateStatus(req.params.id, req.body.status);
    return new OK({
        message: result.changed ? 'Cập nhật trạng thái thuộc tính thành công' : 'Trạng thái thuộc tính không thay đổi',
        metadata: result.definition,
    }).send(res);
}

async function reorderSpecDefinitions(req, res) {
    const result = await specDefinitionService.reorder({
        sourceId: req.body.sourceId,
        targetId: req.body.targetId,
        status: req.body.status,
    });

    return new OK({
        message: result.changed ? 'Cập nhật thứ tự thuộc tính thành công' : 'Thứ tự thuộc tính không thay đổi',
        metadata: result.definitions,
    }).send(res);
}

async function deleteSpecDefinition(req, res) {
    if (isForceDelete(req)) {
        await specDefinitionService.permanentlyDelete(req.params.id);
        return new OK({
            message: 'Xóa vĩnh viễn thuộc tính thành công',
        }).send(res);
    }

    await specDefinitionService.deleteDefinition(req.params.id);
    return new OK({
        message: 'Xóa thuộc tính thành công',
    }).send(res);
}

async function restoreSpecDefinition(req, res) {
    const result = await specDefinitionService.restore(req.params.id);

    if (!result.restored) {
        return new OK({
            message: 'Thuộc tính đang hoạt động',
            metadata: result.definition,
        }).send(res);
    }

    return new OK({
        message: 'Khôi phục thuộc tính thành công',
        metadata: result.definition,
    }).send(res);
}

module.exports = {
    create,
    deleteSpecDefinition,
    getAll,
    restoreSpecDefinition,
    reorderSpecDefinitions,
    update,
    updateStatus,
};
