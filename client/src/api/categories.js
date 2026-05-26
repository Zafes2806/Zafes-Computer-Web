import { publicRequest, request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestGetCategory = async (params = {}) => {
    const res = await request.get(API_PATHS.categories.collection, { params });
    return res.data;
};

export const requestGetCategoryPublic = async (params = {}) => {
    const res = await publicRequest.get(API_PATHS.categories.collection, { params });
    return res.data;
};

export const requestGetCategoryByComponentTypes = async (params = {}) => {
    const res = await publicRequest.get(API_PATHS.categories.componentFilters, { params });
    return res.data.metadata;
};

export const requestGetCategoryByComponentTypesPublic = async (params = {}) => {
    const res = await publicRequest.get(API_PATHS.categories.componentFilters, { params });
    return res.data.metadata;
};

export const requestGetCategoryAvailabilityPublic = async (id) => {
    const res = await publicRequest.get(API_PATHS.categories.availability(id));
    return res.data;
};

export const requestDeleteCategory = async (id) => {
    const res = await request.delete(API_PATHS.categories.byId(id));
    return res.data;
};

export const requestUpdateCategoryStatus = async (id, status) => {
    const res = await request.patch(API_PATHS.categories.byId(id), { status });
    return res.data;
};

export const requestRestoreCategory = async (id) => {
    const res = await request.patch(API_PATHS.categories.restore(id));
    return res.data;
};

export const requestDeleteCategoryPermanently = async (id) => {
    const res = await request.delete(API_PATHS.categories.permanentDelete(id));
    return res.data;
};

export const requestUpdateCategory = async (data) => {
    const { id, ...payload } = data;
    const res = await request.put(API_PATHS.categories.byId(id), payload);
    return res.data;
};

export const requestCreateCategory = async (data) => {
    const res = await request.post(API_PATHS.categories.collection, data);
    return res.data;
};

export const requestGetProductCategory = async (params) => {
    const { id, ...queryParams } = params;
    const res = await publicRequest.get(API_PATHS.categories.products(id), {
        params: queryParams,
    });
    return res.data;
};

export const requestGetProductCategoryPublic = async (params) => {
    const { id, ...queryParams } = params;
    const res = await publicRequest.get(API_PATHS.categories.products(id), {
        params: queryParams,
    });
    return res.data;
};
