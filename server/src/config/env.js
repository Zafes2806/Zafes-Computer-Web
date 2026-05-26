const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSY_VALUES = new Set(['0', 'false', 'no', 'off']);
const DEFAULT_CLIENT_URL = 'http://localhost:5173';

function readEnvString(name, fallback = '') {
    const rawValue = process.env[name];

    if (rawValue === undefined || rawValue === null) {
        return fallback;
    }

    const normalizedValue = String(rawValue).trim();
    return normalizedValue === '' ? fallback : normalizedValue;
}

function trimTrailingSlash(value) {
    return String(value).trim().replace(/\/+$/, '');
}

function parseInteger(name, fallback) {
    const rawValue = readEnvString(name);

    if (!rawValue) {
        return fallback;
    }

    const parsedValue = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsedValue)) {
        throw new Error(`Biến môi trường ${name} phải là số nguyên hợp lệ`);
    }

    return parsedValue;
}

function parseBoolean(name, fallback) {
    const rawValue = readEnvString(name);

    if (!rawValue) {
        return fallback;
    }

    const normalizedValue = rawValue.toLowerCase();
    if (TRUTHY_VALUES.has(normalizedValue)) {
        return true;
    }

    if (FALSY_VALUES.has(normalizedValue)) {
        return false;
    }

    throw new Error(`Biến môi trường ${name} phải là true/false`);
}

function parseSameSite(name, fallback) {
    const rawValue = readEnvString(name, fallback);
    const normalizedValue = rawValue.toLowerCase();
    const sameSiteValues = {
        strict: 'Strict',
        lax: 'Lax',
        none: 'None',
    };

    if (!sameSiteValues[normalizedValue]) {
        throw new Error(`Biến môi trường ${name} phải là Strict, Lax hoặc None`);
    }

    return sameSiteValues[normalizedValue];
}

function parseCsv(name, fallback = []) {
    const rawValue = readEnvString(name);

    if (!rawValue) {
        return fallback;
    }

    return rawValue
        .split(',')
        .map((value) => trimTrailingSlash(value))
        .filter(Boolean);
}

const missingCoreEnvVars = [];

function requireCoreEnv(name) {
    const value = readEnvString(name);

    if (!value) {
        missingCoreEnvVars.push(name);
    }

    return value;
}

const port = parseInteger('PORT', 3000);
const nodeEnv = readEnvString('NODE_ENV', 'development');
const clientOrigins = parseCsv('CLIENT_URL', [DEFAULT_CLIENT_URL]);
const primaryClientUrl = clientOrigins[0] || DEFAULT_CLIENT_URL;
const serverUrl = trimTrailingSlash(readEnvString('SERVER_URL', `http://localhost:${port}`));
const authCookieSecure = parseBoolean('AUTH_COOKIE_SECURE', nodeEnv === 'production');
const authCookieSameSite = parseSameSite('AUTH_COOKIE_SAME_SITE', authCookieSecure ? 'None' : 'Strict');
const fallbackGoogleClientId = readEnvString('CLIENT_ID');
const googleClientIds = parseCsv(
    'GOOGLE_CLIENT_IDS',
    fallbackGoogleClientId ? [trimTrailingSlash(fallbackGoogleClientId)] : [],
);

if (authCookieSameSite === 'None' && !authCookieSecure) {
    throw new Error('AUTH_COOKIE_SAME_SITE=None yêu cầu AUTH_COOKIE_SECURE=true');
}

const config = {
    app: {
        env: nodeEnv,
        isProduction: nodeEnv === 'production',
        port,
        clientOrigins,
        clientUrl: primaryClientUrl,
        serverUrl,
    },
    database: {
        name: requireCoreEnv('DB_NAME'),
        user: requireCoreEnv('DB_USER'),
        password: readEnvString('DB_PASSWORD', ''),
        host: readEnvString('DB_HOST', 'localhost'),
        port: parseInteger('MYSQL_PORT', 3306),
    },
    security: {
        jwtSecret: requireCoreEnv('JWT_SECRET'),
        cryptoSecret: requireCoreEnv('SECRET_CRYPTO'),
        checkoutCookieSecret: readEnvString('CHECKOUT_COOKIE_SECRET'),
        authCookieSameSite,
        authCookieSecure,
        resetPasswordCookieName: 'tokenResetPassword',
        guestOrderAccessCookieSameSite: 'Lax',
        rateLimitWindowMs: parseInteger('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
        rateLimitMax: parseInteger('RATE_LIMIT_MAX', 300),
        rateLimitReadMax: parseInteger('RATE_LIMIT_READ_MAX', 3000),
    },
    auth: {
        googleClientIds,
        passwordResetTokenExpiresIn: '15m',
        passwordResetTokenMaxAgeMs: 5 * 60 * 1000,
    },
    email: {
        userEmail: readEnvString('USER_EMAIL'),
        clientId: fallbackGoogleClientId,
        clientSecret: readEnvString('CLIENT_SECRET'),
        redirectUri: readEnvString('REDIRECT_URI', 'https://developers.google.com/oauthplayground'),
        refreshToken: readEnvString('REFRESH_TOKEN'),
    },
    payments: {
        momo: {
            partnerCode: readEnvString('MOMO_PARTNER_CODE', 'MOMO'),
            accessKey: readEnvString('MOMO_ACCESS_KEY'),
            secretKey: readEnvString('MOMO_SECRET_KEY'),
            endpoint: readEnvString('MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create'),
        },
        vnpay: {
            tmnCode: readEnvString('VNPAY_TMN_CODE'),
            secureSecret: readEnvString('VNPAY_SECURE_SECRET'),
            host: readEnvString('VNPAY_HOST', 'https://sandbox.vnpayment.vn'),
            testMode: parseBoolean('VNPAY_TEST_MODE', true),
        },
    },
    chatbot: {
        apiKey: readEnvString('GOOGLE_AI_KEY'),
        modelName: readEnvString('GOOGLE_AI_MODEL', 'gemini-2.5-flash'),
    },
    orders: {
        autoCompleteDelayHours: parseInteger('ORDER_AUTO_COMPLETE_DELAY_HOURS', 24 * 15),
        autoCompleteIntervalMs: parseInteger('ORDER_AUTO_COMPLETE_INTERVAL_MS', 10 * 60 * 1000),
        pendingPaymentTimeoutMs: parseInteger('ORDER_PENDING_PAYMENT_TIMEOUT_MS', 24 * 60 * 60 * 1000),
        paymentLinkReuseMs: parseInteger('ORDER_PAYMENT_LINK_REUSE_MS', 2 * 60 * 60 * 1000),
    },
    reviews: {
        reviewWindowDays: parseInteger('REVIEW_WINDOW_DAYS', 15),
        editWindowDays: parseInteger('REVIEW_EDIT_WINDOW_DAYS', 10),
    },
};

config.security.checkoutCookieSecret = config.security.checkoutCookieSecret || config.security.jwtSecret;
config.auth.isGoogleLoginConfigured = config.auth.googleClientIds.length > 0;
config.email.isConfigured = Boolean(
    config.email.userEmail &&
    config.email.clientId &&
    config.email.clientSecret &&
    config.email.redirectUri &&
    config.email.refreshToken,
);
config.payments.momo.isConfigured = Boolean(
    config.payments.momo.partnerCode &&
    config.payments.momo.accessKey &&
    config.payments.momo.secretKey &&
    config.payments.momo.endpoint,
);
config.payments.vnpay.isConfigured = Boolean(
    config.payments.vnpay.tmnCode &&
    config.payments.vnpay.secureSecret &&
    config.payments.vnpay.host,
);
config.chatbot.isConfigured = Boolean(config.chatbot.apiKey);

if (missingCoreEnvVars.length > 0) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${missingCoreEnvVars.join(', ')}`);
}

module.exports = Object.freeze(config);
