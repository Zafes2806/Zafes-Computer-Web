const { BadUserRequestError, ForbiddenError } = require('../core/error.response');
const { USER_STATUS } = require('../constants/userStatus');
const { verifyAccessToken } = require('../services/token.service');
const modelUser = require('../models/users.model');

function extractAccessToken(req) {
    const authorizationHeader = req.headers?.authorization;
    if (authorizationHeader?.startsWith('Bearer ')) {
        return authorizationHeader.slice(7).trim();
    }

    return req.cookies?.token;
}

async function resolveAuthenticatedUser(req) {
    const token = extractAccessToken(req);
    if (!token) {
        throw new BadUserRequestError('Vui lòng đăng nhập');
    }

    const decoded = await verifyAccessToken(token);
    const user = await modelUser.findOne({ where: { id: decoded.id }, paranoid: false });
    if (!user) {
        throw new BadUserRequestError('Tài khoản không còn khả dụng');
    }
    if (user.deletedAt) {
        throw new BadUserRequestError('Tài khoản đã bị vô hiệu hóa');
    }
    if (user.status === USER_STATUS.LOCKED) {
        throw new BadUserRequestError('Tài khoản đang bị khóa');
    }

    return user;
}

function attachRequestUser(req, user) {
    req.user = {
        id: user.id,
        isAdmin: Boolean(user.isAdmin),
    };
}

function authUser(req, res, next) {
    resolveAuthenticatedUser(req)
        .then((user) => {
            attachRequestUser(req, user);
            next();
        })
        .catch(next);
}

function authAdmin(req, res, next) {
    resolveAuthenticatedUser(req)
        .then((user) => {
            if (!user.isAdmin) {
                throw new ForbiddenError('Bạn không có quyền truy cập');
            }

            attachRequestUser(req, user);
            next();
        })
        .catch(next);
}

function authCustomer(req, res, next) {
    resolveAuthenticatedUser(req)
        .then((user) => {
            if (user.isAdmin) {
                throw new ForbiddenError('Tài khoản quản trị không được sử dụng chức năng mua hàng');
            }

            attachRequestUser(req, user);
            next();
        })
        .catch(next);
}

function authOptionalCustomer(req, res, next) {
    const token = extractAccessToken(req);
    if (!token) {
        next();
        return;
    }

    resolveAuthenticatedUser(req)
        .then((user) => {
            if (user.isAdmin) {
                throw new ForbiddenError('Tài khoản quản trị không được sử dụng chức năng mua hàng');
            }

            attachRequestUser(req, user);
            next();
        })
        .catch(next);
}

function authOptional(req, res, next) {
    const token = extractAccessToken(req);
    if (!token) {
        next();
        return;
    }

    resolveAuthenticatedUser(req)
        .then((user) => {
            attachRequestUser(req, user);
            next();
        })
        .catch(() => next());
}

module.exports = {
    authAdmin,
    authCustomer,
    authOptional,
    authOptionalCustomer,
    authUser,
};
