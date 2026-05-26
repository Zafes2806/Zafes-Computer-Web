const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const modelUser = require('../models/users.model');
const modelRefreshToken = require('../models/refreshToken.model');
const modelOrder = require('../models/order.model');
const modelCart = require('../models/cart.model');
const modelBuildPcCart = require('../models/buildPcCart.model');
const modelUserWatchProduct = require('../models/userWatchProduct.model');
const modelProductReview = require('../models/productReview.model');
const { BadUserRequestError, BadRequestError } = require('../core/error.response');
const { buildPaginationMeta } = require('../utils/pagination');
const { USER_STATUS, normalizeUserStatus } = require('../constants/userStatus');
const { connect } = require('../config/index');

function parseAdminRole(role) {
    if (typeof role === 'boolean') return role;
    if (typeof role === 'string') return role.trim().toLowerCase() === 'true';
    return false;
}

function buildUserListWhere(query = {}) {
    const includeDeleted = query.includeDeleted === true || query.includeDeleted === 'true';
    const status = query.status || USER_STATUS.ACTIVE;
    const search = query.search?.trim();
    const whereClause = {};

    if (search) {
        whereClause[Op.or] = [
            { fullName: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
        ];
    }

    if (status === 'deleted') {
        whereClause.deletedAt = { [Op.ne]: null };
    } else if (status === 'all') {
        if (!includeDeleted) {
            whereClause.deletedAt = null;
        }
    } else {
        whereClause.deletedAt = null;
        whereClause.status = normalizeUserStatus(status);
    }

    if (query.role === 'admin') {
        whereClause.isAdmin = true;
    } else if (query.role === 'user') {
        whereClause.isAdmin = false;
    }

    return {
        includeDeleted,
        whereClause,
    };
}

async function getUsers(query = {}, pagination = null) {
    const { includeDeleted, whereClause } = buildUserListWhere(query);
    const options = {
        where: whereClause,
        paranoid: !(includeDeleted || query.status === 'deleted'),
        order: [['createdAt', 'DESC']],
    };

    if (!pagination) {
        return {
            items: await modelUser.findAll(options),
            pagination: null,
        };
    }

    const { count, rows } = await modelUser.findAndCountAll({
        ...options,
        limit: pagination.limit,
        offset: pagination.offset,
    });

    return {
        items: rows,
        pagination: buildPaginationMeta(count, pagination),
    };
}

async function updateInfo(userId, payload) {
    const user = await modelUser.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestError('Không tìm thấy tài khoản');
    await user.update({ fullName: payload.fullName, address: payload.address, phone: payload.phone });
}

async function createUser(payload) {
    const email = payload.email?.trim().toLowerCase();
    const fullName = payload.fullName?.trim();
    const phone = payload.phone?.trim() || null;
    const address = payload.address?.trim() || null;
    const password = payload.password;

    const existingUser = await modelUser.findOne({ where: { email }, paranoid: false });
    if (existingUser) {
        if (existingUser.deletedAt) throw new BadRequestError('Email đã tồn tại trong thùng rác. Hãy khôi phục tài khoản cũ.');
        throw new BadRequestError('Email đã tồn tại');
    }

    return modelUser.create({
        fullName,
        email,
        phone,
        address,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
        authProvider: 'email',
        isAdmin: parseAdminRole(payload.role),
        status: USER_STATUS.ACTIVE,
    });
}

async function updateRole({ userId, role }) {
    const user = await modelUser.findOne({ where: { id: userId } });
    if (!user) throw new BadUserRequestError('Người dùng không tồn tại');
    user.isAdmin = parseAdminRole(role);
    await user.save();
    return user;
}

async function updateStatus(currentUserId, userId, status) {
    const user = await modelUser.findByPk(userId, { paranoid: false });
    if (!user) throw new BadRequestError('Người dùng không tồn tại');
    if (user.deletedAt) throw new BadRequestError('Người dùng đang ở trong thùng rác. Hãy khôi phục trước khi đổi trạng thái.');
    if (currentUserId === userId) throw new BadRequestError('Không thể tự thay đổi trạng thái khóa của chính bạn');

    const nextStatus = normalizeUserStatus(status);
    if (user.status === nextStatus) {
        return { changed: false, user };
    }

    await user.update({ status: nextStatus });
    return { changed: true, user };
}

async function deleteUser(currentUserId, userId) {
    if (currentUserId === userId) throw new BadRequestError('Không thể tự xóa tài khoản của chính bạn');
    const user = await modelUser.findByPk(userId, { paranoid: false });
    if (!user) throw new BadRequestError('Người dùng không tồn tại');
    if (user.deletedAt) {
        return { deleted: false, user };
    }

    await connect.transaction(async (transaction) => {
        if (user.status !== USER_STATUS.LOCKED) {
            await user.update({ status: USER_STATUS.LOCKED }, { transaction });
        }

        await user.destroy({ transaction });
    });
    return { deleted: true, user };
}

async function permanentlyDeleteUser(currentUserId, userId) {
    if (currentUserId === userId) throw new BadRequestError('Không thể tự xóa tài khoản của chính bạn');
    const user = await modelUser.findByPk(userId, { paranoid: false });
    if (!user) throw new BadRequestError('Người dùng không tồn tại');
    if (!user.deletedAt) {
        throw new BadRequestError('Chỉ có thể xóa vĩnh viễn người dùng đang ở trong thùng rác');
    }

    const orderCount = await modelOrder.count({
        where: { userId },
    });

    if (orderCount > 0) {
        throw new BadRequestError('Không thể xóa người dùng đã phát sinh đơn hàng. Hãy dùng trạng thái tạm khóa.');
    }

    await connect.transaction(async (transaction) => {
        await Promise.all([
            modelRefreshToken.destroy({ where: { userId }, force: true, transaction }),
            modelCart.destroy({ where: { userId }, force: true, transaction }),
            modelBuildPcCart.destroy({ where: { userId }, force: true, transaction }),
            modelUserWatchProduct.destroy({ where: { userId }, force: true, transaction }),
            modelProductReview.destroy({ where: { userId }, force: true, transaction }),
        ]);

        await user.destroy({ force: true, transaction });
    });

    return user;
}

async function restoreUser(userId) {
    const user = await modelUser.findByPk(userId, { paranoid: false });
    if (!user) throw new BadRequestError('Người dùng không tồn tại');
    if (!user.deletedAt) return { restored: false, user };
    await user.restore();
    await user.update({ status: USER_STATUS.LOCKED });
    return { restored: true, user };
}

module.exports = {
    createUser,
    deleteUser,
    getUsers,
    permanentlyDeleteUser,
    parseAdminRole,
    restoreUser,
    updateInfo,
    updateRole,
    updateStatus,
};

