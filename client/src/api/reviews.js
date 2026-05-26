import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestGetMyReviews = async () => {
    const res = await request.get(API_PATHS.reviews.collection);
    return res.data;
};

export const requestCreateReview = async (data) => {
    const res = await request.post(API_PATHS.reviews.collection, data);
    return res.data;
};

export const requestUpdateReview = async (id, data) => {
    const res = await request.patch(API_PATHS.reviews.byId(id), data);
    return res.data;
};
