import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestUploadImage = async (data) => {
    const res = await request.post(API_PATHS.uploads.single, data);
    return res.data.metadata ?? res.data;
};

export const requestUploadImages = async (data) => {
    const res = await request.post(API_PATHS.uploads.multiple, data);
    return res.data.metadata ?? res.data;
};
