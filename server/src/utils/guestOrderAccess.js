const crypto = require('crypto');
const config = require('../config/env');

const guestOrderAccessCookieName = 'guestOrderAccess';
const guestOrderAccessCookieMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
const guestOrderAccessTokenMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

function isMatchingSignature(expectedSignature, receivedSignature) {
    if (!expectedSignature || !receivedSignature) {
        return false;
    }

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function createSignature(payload) {
    return crypto.createHmac('sha256', config.security.checkoutCookieSecret).update(payload).digest('hex');
}

function createGuestOrderToken() {
    return crypto.randomBytes(32).toString('base64url');
}

function hashGuestOrderToken(token) {
    return crypto
        .createHmac('sha256', config.security.checkoutCookieSecret)
        .update(String(token || '').trim())
        .digest('hex');
}

function getGuestOrderTokenExpiresAt() {
    return new Date(Date.now() + guestOrderAccessTokenMaxAgeMs);
}

function isGuestOrderTokenValid(order, token) {
    const rawToken = String(token || '').trim();
    if (!order?.guestAccessTokenHash || !rawToken) {
        return false;
    }

    if (order.guestAccessTokenExpiresAt && new Date(order.guestAccessTokenExpiresAt).getTime() < Date.now()) {
        return false;
    }

    return isMatchingSignature(order.guestAccessTokenHash, hashGuestOrderToken(rawToken));
}

function serializeGuestOrderAccess(orderIds = []) {
    const payload = Buffer.from(JSON.stringify(orderIds)).toString('base64url');
    const signature = createSignature(payload);
    return `${payload}.${signature}`;
}

function deserializeGuestOrderAccess(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
        return [];
    }

    const separatorIndex = rawValue.lastIndexOf('.');
    if (separatorIndex === -1) {
        return [];
    }

    const payload = rawValue.slice(0, separatorIndex);
    const receivedSignature = rawValue.slice(separatorIndex + 1);
    const expectedSignature = createSignature(payload);

    if (!payload || !receivedSignature || !isMatchingSignature(expectedSignature, receivedSignature)) {
        return [];
    }

    try {
        const parsedValue = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return Array.isArray(parsedValue) ? parsedValue.filter(Boolean) : [];
    } catch (error) {
        return [];
    }
}

function getGuestOrderAccessCookieOptions() {
    return {
        httpOnly: true,
        secure: config.app.isProduction,
        sameSite: config.security.guestOrderAccessCookieSameSite,
        maxAge: guestOrderAccessCookieMaxAgeMs,
    };
}

function getGuestAccessibleOrderIds(req) {
    return deserializeGuestOrderAccess(req.cookies?.[guestOrderAccessCookieName]);
}

function grantGuestOrderAccess(req, res, orderCode) {
    const existingOrderIds = getGuestAccessibleOrderIds(req);
    const nextOrderIds = [...new Set([orderCode, ...existingOrderIds])].slice(0, 10);

    res.cookie(
        guestOrderAccessCookieName,
        serializeGuestOrderAccess(nextOrderIds),
        getGuestOrderAccessCookieOptions(),
    );
}

module.exports = {
    createGuestOrderToken,
    getGuestAccessibleOrderIds,
    getGuestOrderTokenExpiresAt,
    grantGuestOrderAccess,
    hashGuestOrderToken,
    isGuestOrderTokenValid,
};
