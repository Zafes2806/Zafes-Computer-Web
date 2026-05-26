const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');

const config = require('../config/env');
const modelUser = require('../models/users.model');
const { USER_STATUS } = require('../constants/userStatus');
const modelOtp = require('../models/otp.model');
const {
    ACCESS_TOKEN_MAX_AGE_MS,
    REFRESH_TOKEN_MAX_AGE_MS,
    createRefreshToken,
    createToken,
    revokeRefreshToken,
    verifyRefreshToken,
} = require('./token.service');
const cartService = require('./cart.service');
const buildPcCartService = require('./buildPcCart.service');
const { connect } = require('../config/index');
const sendMailForgotPassword = require('../utils/sendMailForgotPassword');
const { BadUserRequestError, BadRequestError } = require('../core/error.response');

const cookieBaseOptions = {
    secure: config.security.authCookieSecure,
    sameSite: config.security.authCookieSameSite,
};

const googleClientIds = config.auth.googleClientIds;
const googleAuthClient = googleClientIds.length ? new OAuth2Client() : null;

function isUserDeleted(user) {
    return Boolean(user?.deletedAt);
}

function isUserLocked(user) {
    return user?.status === USER_STATUS.LOCKED;
}

function ensureUserCanAuthenticate(user, deletedMessage = 'Tài khoản đã bị vô hiệu hóa') {
    if (isUserDeleted(user)) {
        throw new BadUserRequestError(deletedMessage);
    }

    if (isUserLocked(user)) {
        throw new BadUserRequestError('Tài khoản đang bị khóa');
    }
}

function buildAccessTokenPayload(user) {
    return { id: user.id, isAdmin: user.isAdmin };
}

async function issueAuthTokens(user) {
    const token = await createToken(buildAccessTokenPayload(user));
    const refreshToken = await createRefreshToken({ id: user.id });
    return { token, refreshToken };
}

function setAuthCookies(res, { token, refreshToken }) {
    res.cookie('token', token, { ...cookieBaseOptions, httpOnly: true, maxAge: ACCESS_TOKEN_MAX_AGE_MS });
    res.cookie('logged', 1, { ...cookieBaseOptions, httpOnly: false, maxAge: REFRESH_TOKEN_MAX_AGE_MS });
    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, { ...cookieBaseOptions, httpOnly: true, maxAge: REFRESH_TOKEN_MAX_AGE_MS });
    }
}

function clearAuthCookies(res) {
    res.clearCookie('token', { ...cookieBaseOptions, httpOnly: true });
    res.clearCookie('refreshToken', { ...cookieBaseOptions, httpOnly: true });
    res.clearCookie('logged', { ...cookieBaseOptions, httpOnly: false });
}

async function verifyGoogleCredential(credential) {
    if (!credential) throw new BadRequestError('Thiếu thông tin xác thực Google');
    if (!googleAuthClient || googleClientIds.length === 0) {
        throw new Error('Google OAuth chưa được cấu hình');
    }

    let ticket;
    try {
        ticket = await googleAuthClient.verifyIdToken({ idToken: credential, audience: googleClientIds });
    } catch (error) {
        throw new BadRequestError('Thông tin xác thực Google không hợp lệ');
    }

    const payload = ticket.getPayload();
    if (!payload?.email) throw new BadRequestError('Không thể xác định email từ Google');
    if (!payload.email_verified) throw new BadRequestError('Email Google chưa được xác minh');
    return payload;
}

async function registerUser(payload) {
    const { fullName, phone, address, password } = payload;
    const email = payload.email?.trim().toLowerCase();
    if (!fullName || !phone || !address || !email || !password) {
        throw new BadUserRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    const findUser = await modelUser.findOne({ where: { email }, paranoid: false });
    if (findUser) {
        if (isUserDeleted(findUser)) throw new BadUserRequestError('Tài khoản này đã bị vô hiệu hóa');
        if (isUserLocked(findUser)) throw new BadUserRequestError('Tài khoản này đang bị khóa');
        throw new BadUserRequestError('Email đã tồn tại');
    }

    const dataUser = await modelUser.create({
        fullName,
        phone,
        address,
        email,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
        authProvider: 'email',
    });
    await dataUser.save();
    return issueAuthTokens(dataUser);
}

async function loginUser(payload) {
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password;
    if (!email || !password) throw new BadUserRequestError('Vui lòng nhập đầy đủ thông tin');

    const findUser = await modelUser.findOne({ where: { email }, paranoid: false });
    if (!findUser) throw new BadUserRequestError('Tài khoản hoặc mật khẩu không chính xác');
    ensureUserCanAuthenticate(findUser);
    if (findUser.authProvider === 'google') throw new BadUserRequestError('Tài khoản đăng nhập bằng Google');
    if (!bcrypt.compareSync(password, findUser.password)) {
        throw new BadUserRequestError('Tài khoản hoặc mật khẩu không chính xác');
    }

    return issueAuthTokens(findUser);
}

async function loginGoogle(payload) {
    const dataToken = await verifyGoogleCredential(payload.credential);
    const email = dataToken.email.trim().toLowerCase();
    const user = await modelUser.findOne({ where: { email }, paranoid: false });

    if (user) {
        ensureUserCanAuthenticate(user);
        return issueAuthTokens(user);
    }

    const newUser = await modelUser.create({
        fullName: dataToken.name || email,
        email,
        authProvider: 'google',
    });
    await newUser.save();
    return issueAuthTokens(newUser);
}

async function getAuthUser(userId) {
    const findUser = await modelUser.findOne({ where: { id: userId }, paranoid: false });
    if (!findUser) throw new BadRequestError('Tài khoản không tồn tại');
    ensureUserCanAuthenticate(findUser);

    return {
        id: findUser.id,
        fullName: findUser.fullName,
        email: findUser.email,
        isAdmin: findUser.isAdmin,
        address: findUser.address,
        phone: findUser.phone,
    };
}

async function refreshToken(rawRefreshToken) {
    if (!rawRefreshToken) throw new BadUserRequestError('Vui lòng đăng nhập lại');

    const { decoded, storedToken } = await verifyRefreshToken(rawRefreshToken);
    const user = await modelUser.findOne({ where: { id: decoded.id }, paranoid: false });
    if (!user) {
        await storedToken.destroy();
        throw new BadUserRequestError('Tài khoản không còn khả dụng');
    }
    ensureUserCanAuthenticate(user);

    await storedToken.destroy();
    return {
        token: await createToken(buildAccessTokenPayload(user)),
        refreshToken: await createRefreshToken({ id: user.id }),
    };
}

async function logout(refreshToken) {
    await revokeRefreshToken(refreshToken);
}

async function mergeGuestSession(userId, payload = {}) {
    if (!userId) {
        throw new BadRequestError('Không thể đồng bộ phiên mua sắm');
    }

    const cartItems = Array.isArray(payload.cartItems) ? payload.cartItems : [];
    const buildPcItems = Array.isArray(payload.buildPcItems) ? payload.buildPcItems : [];

    if (!cartItems.length && !buildPcItems.length) {
        return {
            cartMergedCount: 0,
            buildPcMergedCount: 0,
        };
    }

    return connect.transaction(async (transaction) => {
        const cartResult = await cartService.mergeGuestCart(userId, cartItems, transaction);
        const buildPcResult = await buildPcCartService.mergeGuestBuildPcCart(userId, buildPcItems, transaction);

        return {
            cartMergedCount: cartResult.mergedCount,
            buildPcMergedCount: buildPcResult.mergedCount,
        };
    });
}

async function forgotPassword(payload) {
    const email = payload.email?.trim().toLowerCase();
    if (!email) throw new BadUserRequestError('Vui lòng nhập email');

    const user = await modelUser.findOne({ where: { email }, paranoid: false });
    if (!user) throw new BadUserRequestError('Email không tồn tại');
    ensureUserCanAuthenticate(user);

    const token = jwt.sign(
        { id: user.id, email: user.email },
        config.security.jwtSecret,
        { expiresIn: config.auth.passwordResetTokenExpiresIn },
    );
    const otp = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    await modelOtp.create({
        email: user.email,
        otp: await bcrypt.hash(otp, 10),
    });

    try {
        await sendMailForgotPassword(email, otp);
    } catch (error) {
        console.error('forgotPassword email delivery failed', {
            email,
            errorMessage: error?.message || String(error),
        });
        throw new BadUserRequestError('Không thể gửi email đặt lại mật khẩu.');
    }

    return { cookieValue: token, maxAge: config.auth.passwordResetTokenMaxAgeMs };
}

async function resetPassword(token, payload) {
    if (!token) throw new BadUserRequestError('Vui lòng gửi yêu cầu quên mật khẩu');

    const decode = jwt.verify(token, config.security.jwtSecret);
    const findOTP = await modelOtp.findOne({ where: { email: decode.email }, order: [['createdAt', 'DESC']] });
    if (!findOTP) throw new BadUserRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
    if (!(await bcrypt.compare(payload.otp, findOTP.otp))) {
        throw new BadUserRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
    }

    const findUser = await modelUser.findOne({ where: { email: decode.email }, paranoid: false });
    if (!findUser) throw new BadUserRequestError('Người dùng không tồn tại');
    ensureUserCanAuthenticate(findUser);

    findUser.password = await bcrypt.hash(payload.newPassword, 10);
    await findUser.save();
    await modelOtp.destroy({ where: { email: decode.email } });
}

module.exports = {
    buildAccessTokenPayload,
    clearAuthCookies,
    forgotPassword,
    getAuthUser,
    loginGoogle,
    loginUser,
    mergeGuestSession,
    logout,
    refreshToken,
    registerUser,
    resetPassword,
    setAuthCookies,
};
