import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestAddToRecentlyViewed = async (data) => {
    const res = await request.post(API_PATHS.recentlyViewed.collection, data);
    return res.data;
};

export const requestGetRecentlyViewed = async () => {
    const res = await request.get(API_PATHS.recentlyViewed.collection);
    return res.data;
};
