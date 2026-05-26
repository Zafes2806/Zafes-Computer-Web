import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestUpdateQuantityCart = async (data) => {
    const { cartItemId, ...payload } = data;
    const res = await request.patch(API_PATHS.cart.itemById(cartItemId), payload);
    return res.data;
};

export const requestAddToCart = async (data) => {
    const res = await request.post(API_PATHS.cart.items, data);
    return res.data;
};

export const requestDeleteCart = async (data) => {
    const res = await request.delete(API_PATHS.cart.itemById(data.cartItemId));
    return res.data;
};

export const requestGetCart = async () => {
    const res = await request.get(API_PATHS.cart.items);
    return res.data;
};
