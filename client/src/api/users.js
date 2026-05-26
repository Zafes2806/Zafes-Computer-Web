import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestCreateUser = async (data) => {
    const res = await request.post(API_PATHS.users.collection, data);
    return res.data;
};

export const requestUpdateRoleUser = async (data) => {
    const { userId, ...payload } = data;
    const res = await request.patch(API_PATHS.users.byId(userId), payload);
    return res.data;
};

export const requestDeleteUser = async (id) => {
    const res = await request.delete(API_PATHS.users.byId(id));
    return res.data;
};

export const requestDeleteUserPermanently = async (id) => {
    const res = await request.delete(API_PATHS.users.permanentDelete(id));
    return res.data;
};

export const requestUpdateUserStatus = async (id, status) => {
    const res = await request.patch(API_PATHS.users.byId(id), { status });
    return res.data;
};

export const requestRestoreUser = async (id) => {
    const res = await request.patch(API_PATHS.users.restore(id));
    return res.data;
};

export const requestGetUsers = async (params = {}) => {
    const res = await request.get(API_PATHS.users.collection, { params });
    return res.data;
};

export const requestUpdateUser = async (data) => {
    const res = await request.put(API_PATHS.users.me, data);
    return res.data;
};
