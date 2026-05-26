import { publicRequest, request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestGetComponentTypes = async (params = {}) => {
    const res = await request.get(API_PATHS.componentTypes.collection, { params });
    return res.data;
};

export const requestGetComponentTypesPublic = async (params = {}) => {
    const res = await publicRequest.get(API_PATHS.componentTypes.collection, { params });
    return res.data;
};

export const requestCreateComponentType = async (data) => {
    const res = await request.post(API_PATHS.componentTypes.collection, data);
    return res.data;
};

export const requestUpdateComponentType = async (data) => {
    const { code, ...payload } = data;
    const res = await request.put(API_PATHS.componentTypes.byCode(code), payload);
    return res.data;
};

export const requestUpdateComponentTypeStatus = async (code, status) => {
    const res = await request.patch(API_PATHS.componentTypes.byCode(code), { status });
    return res.data;
};

export const requestDeleteComponentType = async (code) => {
    const res = await request.delete(API_PATHS.componentTypes.byCode(code));
    return res.data;
};

export const requestRestoreComponentType = async (code) => {
    const res = await request.patch(API_PATHS.componentTypes.restore(code));
    return res.data;
};

export const requestDeleteComponentTypePermanently = async (code) => {
    const res = await request.delete(API_PATHS.componentTypes.permanentDelete(code));
    return res.data;
};
