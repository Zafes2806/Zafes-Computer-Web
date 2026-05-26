const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const config = require('../config/env');
const modelRefreshToken = require('../models/refreshToken.model');
const { BadUserRequestError } = require('../core/error.response');

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const JWT_ALGORITHM = 'HS256';
const ACCESS_TOKEN_TYPE = 'access';
const REFRESH_TOKEN_TYPE = 'refresh';

function getJwtSecret() {
    if (!config.security.jwtSecret) {
        throw new Error('JWT_SECRET chưa được cấu hình');
    }

    return config.security.jwtSecret;
}

function createTokenHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function createToken(payload) {
    return jwt.sign(
        {
            ...payload,
            type: ACCESS_TOKEN_TYPE,
        },
        getJwtSecret(),
        {
            algorithm: JWT_ALGORITHM,
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            jwtid: crypto.randomUUID(),
        },
    );
}

async function createRefreshToken(payload) {
    const refreshToken = jwt.sign(
        {
            ...payload,
            type: REFRESH_TOKEN_TYPE,
        },
        getJwtSecret(),
        {
            algorithm: JWT_ALGORITHM,
            expiresIn: REFRESH_TOKEN_EXPIRES_IN,
            jwtid: crypto.randomUUID(),
        },
    );

    await modelRefreshToken.create({
        userId: payload.id,
        tokenHash: createTokenHash(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    });

    return refreshToken;
}

async function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, getJwtSecret(), {
            algorithms: [JWT_ALGORITHM],
        });

        if (decoded.type !== ACCESS_TOKEN_TYPE) {
            throw new Error('Loại access token không hợp lệ');
        }

        return decoded;
    } catch (error) {
        throw new BadUserRequestError('Vui lòng đăng nhập lại');
    }
}

async function verifyRefreshToken(token) {
    if (!token) {
        throw new BadUserRequestError('Vui lòng đăng nhập lại');
    }

    const storedToken = await modelRefreshToken.findOne({
        where: { tokenHash: createTokenHash(token) },
    });

    if (!storedToken) {
        throw new BadUserRequestError('Vui lòng đăng nhập lại');
    }

    if (storedToken.expiresAt <= new Date()) {
        await storedToken.destroy();
        throw new BadUserRequestError('Vui lòng đăng nhập lại');
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret(), {
            algorithms: [JWT_ALGORITHM],
        });

        if (decoded.type !== REFRESH_TOKEN_TYPE || decoded.id !== storedToken.userId) {
            throw new Error('Refresh token không hợp lệ');
        }

        return { decoded, storedToken };
    } catch (error) {
        await storedToken.destroy();
        throw new BadUserRequestError('Vui lòng đăng nhập lại');
    }
}

async function revokeRefreshToken(token) {
    if (!token) {
        return;
    }

    await modelRefreshToken.destroy({
        where: { tokenHash: createTokenHash(token) },
    });
}

module.exports = {
    ACCESS_TOKEN_MAX_AGE_MS,
    REFRESH_TOKEN_MAX_AGE_MS,
    createRefreshToken,
    createToken,
    revokeRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
