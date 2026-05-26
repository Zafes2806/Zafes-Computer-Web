import { publicRequest, request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestGetSpecDefinitions = async (params = {}) => {
    const res = await request.get(API_PATHS.specDefinitions.collection, { params });
    return res.data;
};

export const requestGetSpecDefinitionsPublic = async (params = {}) => {
    const res = await publicRequest.get(API_PATHS.specDefinitions.collection, { params });
    return res.data;
};

export const requestCreateSpecDefinition = async (data) => {
    const res = await request.post(API_PATHS.specDefinitions.collection, data);
    return res.data;
};

export const requestUpdateSpecDefinition = async (data) => {
    const { id, ...payload } = data;
    const res = await request.put(API_PATHS.specDefinitions.byId(id), payload);
    return res.data;
};

export const requestReorderSpecDefinition = async (data) => {
    const res = await request.patch(API_PATHS.specDefinitions.reorder, data);
    return res.data;
};

export const requestDeleteSpecDefinition = async (id) => {
    const res = await request.delete(API_PATHS.specDefinitions.byId(id));
    return res.data;
};

export const requestUpdateSpecDefinitionStatus = async (id, status) => {
    const res = await request.patch(API_PATHS.specDefinitions.byId(id), { status });
    return res.data;
};

export const requestRestoreSpecDefinition = async (id) => {
    const res = await request.patch(API_PATHS.specDefinitions.restore(id));
    return res.data;
};

export const requestDeleteSpecDefinitionPermanently = async (id) => {
    const res = await request.delete(API_PATHS.specDefinitions.permanentDelete(id));
    return res.data;
};
