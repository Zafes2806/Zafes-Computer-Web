import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestCheckoutOrder = async (data) => {
    const res = await request.post(API_PATHS.orders.collection, data);
    return res.data;
};

export const requestGetOrders = async () => {
    const res = await request.get(API_PATHS.orders.collection);
    return res.data;
};

export const requestCancelOrder = async (data) => {
    const res = await request.post(API_PATHS.orders.cancel(data.orderCode), {
        guestAccessToken: data.guestAccessToken,
    });
    return res.data;
};

export const requestReturnOrder = async (data) => {
    const res = await request.post(API_PATHS.orders.returnRequest(data.orderCode), {
        reason: data.reason,
    });
    return res.data;
};

export const requestGetOrderDetail = async (orderCode, guestAccessToken) => {
    const res = await request.get(API_PATHS.orders.byId(orderCode), {
        params: guestAccessToken ? { token: guestAccessToken } : undefined,
    });
    return res.data;
};

export const requestRetryOrderPayment = async (orderCode, guestAccessToken) => {
    const res = await request.post(API_PATHS.orders.paymentAttempts(orderCode), {
        guestAccessToken,
    });
    return res.data;
};

