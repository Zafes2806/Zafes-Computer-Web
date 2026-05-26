import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestDeleteAllCartBuildPC = async () => {
    const res = await request.delete(API_PATHS.buildPc.items);
    return res.data;
};

export const requestGetBuildPcItems = async () => {
    const res = await request.get(API_PATHS.buildPc.items);
    return res.data;
};

export const requestAddToCartBuildPc = async (data) => {
    const res = await request.post(API_PATHS.buildPc.items, data);
    return res.data;
};

export const requestDeleteCartBuildPc = async (data) => {
    const res = await request.delete(API_PATHS.buildPc.itemByProductId(data.productId));
    return res.data;
};

export const requestUpdateQuantityCartBuildPc = async (data) => {
    const { productId, ...payload } = data;
    const res = await request.patch(API_PATHS.buildPc.itemByProductId(productId), payload);
    return res.data;
};

export const requestAddToCartBuildPcToCart = async (data) => {
    const res = await request.post(API_PATHS.cart.importFromBuildPc, data);
    return res.data;
};
