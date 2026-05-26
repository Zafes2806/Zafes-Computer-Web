const { OK } = require('../core/success.response');
const userService = require('../services/user.service');
const { parsePaginationQuery } = require('../utils/pagination');
const { isForceDelete } = require('../utils/requestFlags');

async function createUser(req, res) {
    const metadata = await userService.createUser(req.body);
    return new OK({ message: 'Tạo người dùng thành công', metadata }).send(res);
}

async function updateInfo(req, res) {
    await userService.updateInfo(req.user.id, req.body);
    return new OK({ message: 'Cập nhật thông tin tài khoản thành công' }).send(res);
}

async function getUsers(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 });
    const result = await userService.getUsers(req.query, pagination);
    return new OK({
        message: 'Lấy danh sách người dùng thành công',
        metadata: result.items,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function updateUser(req, res) {
    let metadata = null;
    const messages = [];

    if (req.body.role !== undefined) {
        metadata = await userService.updateRole({
            userId: req.params.userId,
            role: req.body.role,
        });
        messages.push('quyền');
    }

    if (req.body.status !== undefined) {
        const result = await userService.updateStatus(req.user.id, req.params.userId, req.body.status);
        metadata = result.user;
        messages.push(result.changed ? 'trạng thái' : 'trạng thái không thay đổi');
    }

    const statusUnchanged = messages.includes('trạng thái không thay đổi');
    const changedFields = messages.filter((item) => item !== 'trạng thái không thay đổi');
    const message = statusUnchanged && changedFields.length === 0
        ? 'Trạng thái người dùng không thay đổi'
        : `Cập nhật ${changedFields.join(' và ')} người dùng thành công${statusUnchanged ? ', trạng thái không thay đổi' : ''}`;

    return new OK({ message, metadata }).send(res);
}

async function deleteUser(req, res) {
    if (isForceDelete(req)) {
        const metadata = await userService.permanentlyDeleteUser(req.user.id, req.params.userId);
        return new OK({ message: 'Xóa vĩnh viễn người dùng thành công', metadata }).send(res);
    }

    const result = await userService.deleteUser(req.user.id, req.params.userId);
    return new OK({
        message: result.deleted ? 'Đã chuyển người dùng vào thùng rác' : 'Người dùng đã ở trong thùng rác',
        metadata: result.user,
    }).send(res);
}

async function restoreUser(req, res) {
    const result = await userService.restoreUser(req.params.userId);
    if (!result.restored) {
        return new OK({ message: 'Người dùng đang hoạt động', metadata: result.user }).send(res);
    }
    return new OK({ message: 'Khôi phục người dùng thành công', metadata: result.user }).send(res);
}

module.exports = {
    createUser,
    deleteUser,
    getUsers,
    restoreUser,
    updateInfo,
    updateUser,
};
