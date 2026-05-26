import { request } from './interceptor';
import { API_PATHS } from '../constants/api';
import { clearBrowserAuthState, markBrowserAuthState } from '../utils/authSession';

function persistAuthMetadata(res) {
    const accessToken = res?.data?.metadata?.token;
    if (accessToken) {
        markBrowserAuthState(accessToken);
    }
    return res.data;
}

export const requestResetPassword = async (data) => {
    const res = await request.post(API_PATHS.auth.resetPassword, data);
    return res.data;
};

export const requestForgotPassword = async (data) => {
    const res = await request.post(API_PATHS.auth.forgotPassword, data);
    return res.data;
};

export const requestLoginGoogle = async (credential) => {
    const res = await request.post(API_PATHS.auth.google, { credential });
    return persistAuthMetadata(res);
};

export const requestLogin = async (data) => {
    const res = await request.post(API_PATHS.auth.login, data);
    return persistAuthMetadata(res);
};

export const requestRegister = async (data) => {
    const res = await request.post(API_PATHS.auth.register, data);
    return persistAuthMetadata(res);
};

export const requestAuth = async () => {
    const res = await request.get(API_PATHS.auth.me);
    return res.data;
};

export const requestLogout = async () => {
    const res = await request.post(API_PATHS.auth.logout);
    clearBrowserAuthState();
    return res.data;
};

export const requestMergeGuestSession = async (data) => {
    const res = await request.post(API_PATHS.auth.mergeSession, data);
    return res.data;
};
