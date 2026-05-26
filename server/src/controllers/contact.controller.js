const { Created, OK } = require('../core/success.response');
const contactService = require('../services/contact.service');
const { parsePaginationQuery } = require('../utils/pagination');
const { isForceDelete } = require('../utils/requestFlags');

async function createContact(req, res) {
    const metadata = await contactService.createContact(req.body);
    return new Created({ message: 'Tạo liên hệ thành công', metadata }).send(res);
}

async function getContacts(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 10, maxLimit: 100 });
    const result = await contactService.getContacts(req.query, pagination);
    return new OK({
        message: 'Lấy danh sách liên hệ thành công',
        metadata: result.items,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function getContactById(req, res) {
    const metadata = await contactService.getContactById(req.params.id, {
        includeDeleted: req.query.includeDeleted !== 'false',
    });
    return new OK({ message: 'Lấy chi tiết liên hệ thành công', metadata }).send(res);
}

async function updateContact(req, res) {
    const metadata = await contactService.updateContact(req.params.id, req.body);
    return new OK({ message: 'Cập nhật liên hệ thành công', metadata }).send(res);
}

async function deleteContact(req, res) {
    if (isForceDelete(req)) {
        await contactService.permanentlyDeleteContact(req.params.id);
        return new OK({ message: 'Xóa vĩnh viễn liên hệ thành công' }).send(res);
    }

    const metadata = await contactService.deleteContact(req.params.id);
    return new OK({ message: 'Xóa liên hệ thành công', metadata }).send(res);
}

async function restoreContact(req, res) {
    const result = await contactService.restoreContact(req.params.id);
    return new OK({
        message: result.restored ? 'Khôi phục liên hệ thành công' : 'Liên hệ đang hoạt động',
        metadata: result.contact,
    }).send(res);
}

module.exports = {
    createContact,
    deleteContact,
    getContactById,
    getContacts,
    restoreContact,
    updateContact,
};
