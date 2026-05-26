const { Op } = require('sequelize');

const { connect } = require('../config/index');
const modelContact = require('../models/contact.model');
const {
    CONTACT_STATUS,
    canTransitionContactStatus,
    getAvailableContactStatuses,
    normalizeContactStatus,
} = require('../constants/contactStatus');
const { BadRequestError } = require('../core/error.response');
const { buildPaginationMeta } = require('../utils/pagination');

function getContactPayload(body = {}) {
    return {
        fullName: body.fullName?.trim(),
        phone: body.phone?.trim(),
        purchaseIntent: (body.purchaseIntent ?? body.option1)?.trim(),
        purpose: (body.purpose ?? body.option2)?.trim(),
        budget: (body.budget ?? body.option3)?.trim(),
        deliveryOption: (body.deliveryOption ?? body.option4)?.trim(),
    };
}

function validateContactPayload(payload) {
    if (
        !payload.fullName
        || !payload.phone
        || !payload.purchaseIntent
        || !payload.purpose
        || !payload.budget
        || !payload.deliveryOption
    ) {
        throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }
}

function buildContactListWhere(query = {}) {
    const includeDeleted = query.includeDeleted === true || query.includeDeleted === 'true';
    const status = query.status || CONTACT_STATUS.NEW;
    const search = query.search?.trim();
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;
    const where = {};

    if (search) {
        where[Op.or] = [
            { fullName: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { purchaseIntent: { [Op.like]: `%${search}%` } },
        ];
    }

    if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    if (status === 'deleted') {
        where.deletedAt = { [Op.ne]: null };
    } else if (status === 'all') {
        if (!includeDeleted) {
            where.deletedAt = null;
        }
    } else {
        where.deletedAt = null;
        where.status = normalizeContactStatus(status);
    }

    return {
        includeDeleted,
        where,
    };
}

function buildHandledAtValue(contact, nextStatus) {
    if (nextStatus === CONTACT_STATUS.NEW) {
        return null;
    }

    return contact.handledAt || new Date();
}

function formatContactForAdmin(contact) {
    const rawContact = typeof contact?.toJSON === 'function' ? contact.toJSON() : contact;
    const normalizedStatus = normalizeContactStatus(rawContact?.status);

    return {
        ...rawContact,
        status: normalizedStatus,
        availableStatuses: rawContact?.deletedAt ? [] : getAvailableContactStatuses(normalizedStatus),
    };
}

async function createContact(body) {
    const payload = getContactPayload(body);
    validateContactPayload(payload);
    return modelContact.create({
        ...payload,
        status: CONTACT_STATUS.NEW,
    });
}

async function getContacts(query = {}, pagination = null) {
    const { includeDeleted, where } = buildContactListWhere(query);
    const queryOptions = {
        where,
        paranoid: !(includeDeleted || query.status === 'deleted'),
        order: [['createdAt', 'DESC']],
    };

    if (!pagination) {
        return {
            items: (await modelContact.findAll(queryOptions)).map(formatContactForAdmin),
            pagination: null,
        };
    }

    const { count, rows } = await modelContact.findAndCountAll({
        ...queryOptions,
        limit: pagination.limit,
        offset: pagination.offset,
    });

    return {
        items: rows.map(formatContactForAdmin),
        pagination: buildPaginationMeta(count, pagination),
    };
}

async function getContactById(id, { includeDeleted = true } = {}) {
    const contact = await modelContact.findOne({
        where: { id },
        paranoid: !includeDeleted,
    });
    if (!contact) {
        throw new BadRequestError('Liên hệ không tồn tại');
    }
    return formatContactForAdmin(contact);
}

async function updateContact(id, payload) {
    const contact = await modelContact.findByPk(id);
    if (!contact) {
        throw new BadRequestError('Liên hệ không tồn tại');
    }

    const updateData = {};
    if (payload.status !== undefined) {
        const nextStatus = normalizeContactStatus(payload.status);
        if (!canTransitionContactStatus(contact.status, nextStatus)) {
            throw new BadRequestError('Không thể chuyển trạng thái liên hệ theo luồng hiện tại');
        }
        updateData.status = nextStatus;
        updateData.handledAt = buildHandledAtValue(contact, nextStatus);
    }
    if (payload.adminNote !== undefined) {
        updateData.adminNote = payload.adminNote?.trim() || null;
    }

    await contact.update(updateData);
    return formatContactForAdmin(contact);
}

async function deleteContact(id) {
    const contact = await modelContact.findByPk(id);
    if (!contact) {
        throw new BadRequestError('Liên hệ không tồn tại');
    }

    await connect.transaction(async (transaction) => {
        if (contact.status !== CONTACT_STATUS.ARCHIVED) {
            await contact.update({ status: CONTACT_STATUS.ARCHIVED }, { transaction });
        }

        await contact.destroy({ transaction });
    });
    return formatContactForAdmin(contact);
}

async function restoreContact(id) {
    const contact = await modelContact.findByPk(id, { paranoid: false });
    if (!contact) {
        throw new BadRequestError('Liên hệ không tồn tại');
    }
    if (!contact.deletedAt) {
        return { restored: false, contact: formatContactForAdmin(contact) };
    }

    await contact.restore();
    await contact.update({ status: CONTACT_STATUS.ARCHIVED });
    return { restored: true, contact: formatContactForAdmin(contact) };
}

async function permanentlyDeleteContact(id) {
    const contact = await modelContact.findByPk(id, { paranoid: false });
    if (!contact) {
        throw new BadRequestError('Liên hệ không tồn tại');
    }
    if (!contact.deletedAt) {
        throw new BadRequestError('Chỉ có thể xóa vĩnh viễn liên hệ đang ở trong thùng rác');
    }

    await contact.destroy({ force: true });
}

module.exports = {
    createContact,
    deleteContact,
    getContactById,
    getContactPayload,
    getContacts,
    permanentlyDeleteContact,
    restoreContact,
    updateContact,
};
