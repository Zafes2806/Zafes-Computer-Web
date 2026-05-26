const CryptoJS = require('crypto-js');

const config = require('../config/env');
const { OK } = require('../core/success.response');
const authService = require('../services/auth.service');

const passwordResetCookieOptions = {
    secure: config.security.authCookieSecure,
    sameSite: config.security.authCookieSameSite,
    httpOnly: false,
};

async function register(req, res) {
    const tokens = await authService.registerUser(req.body);
    authService.setAuthCookies(res, tokens);
    return new OK({ message: 'Đăng ký thành công', metadata: tokens }).send(res);
}

async function login(req, res) {
    const tokens = await authService.loginUser(req.body);
    authService.setAuthCookies(res, tokens);
    return new OK({ message: 'Đăng nhập thành công', metadata: tokens }).send(res);
}

async function loginGoogle(req, res) {
    const tokens = await authService.loginGoogle(req.body);
    authService.setAuthCookies(res, tokens);
    return new OK({ message: 'Đăng nhập bằng Google thành công', metadata: tokens }).send(res);
}

async function authUser(req, res) {
    const userInfo = await authService.getAuthUser(req.user.id);
    const auth = CryptoJS.AES.encrypt(JSON.stringify(userInfo), config.security.cryptoSecret).toString();
    return new OK({ message: 'Lấy thông tin người dùng thành công', metadata: auth }).send(res);
}

async function refreshToken(req, res) {
    try {
        const { token, refreshToken } = await authService.refreshToken(req.cookies?.refreshToken);
        authService.setAuthCookies(res, { token, refreshToken });
        return new OK({ message: 'Làm mới phiên đăng nhập thành công', metadata: { token } }).send(res);
    } catch (error) {
        authService.clearAuthCookies(res);
        throw error;
    }
}

async function logout(req, res) {
    try {
        await authService.logout(req.cookies?.refreshToken);
    } finally {
        authService.clearAuthCookies(res);
    }
    return new OK({ message: 'Đăng xuất thành công' }).send(res);
}

async function mergeSession(req, res) {
    const metadata = await authService.mergeGuestSession(req.user.id, req.body);
    return new OK({ message: 'Đồng bộ phiên mua sắm thành công', metadata }).send(res);
}

async function forgotPassword(req, res) {
    const { cookieValue, maxAge } = await authService.forgotPassword(req.body);
    res.cookie(config.security.resetPasswordCookieName, cookieValue, { ...passwordResetCookieOptions, maxAge });
    return new OK({ message: 'Gửi mã OTP thành công' }).send(res);
}

async function resetPassword(req, res) {
    await authService.resetPassword(req.cookies?.[config.security.resetPasswordCookieName], req.body);
    res.clearCookie(config.security.resetPasswordCookieName, passwordResetCookieOptions);
    return new OK({ message: 'Đặt lại mật khẩu thành công' }).send(res);
}

module.exports = {
    authUser,
    forgotPassword,
    login,
    loginGoogle,
    logout,
    mergeSession,
    refreshToken,
    register,
    resetPassword,
};
