import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestGetAdminReviews = async (params = {}) => {
    const res = await request.get(API_PATHS.admin.reviews, { params });
    return res.data;
};

export const requestDeleteAdminReview = async (id) => {
    const res = await request.delete(API_PATHS.admin.reviewById(id));
    return res.data;
};

export const requestUpdateAdminReviewStatus = async (id, status) => {
    const res = await request.patch(API_PATHS.admin.reviewById(id), { status });
    return res.data;
};

export const requestRestoreAdminReview = async (id) => {
    const res = await request.patch(API_PATHS.admin.reviewRestore(id));
    return res.data;
};

export const requestDeleteAdminReviewPermanently = async (id) => {
    const res = await request.delete(API_PATHS.admin.reviewPermanent(id));
    return res.data;
};

export const requestGetOrderAdmin = async (params = {}) => {
    const res = await request.get(API_PATHS.admin.orders, { params });
    return res.data;
};

export const requestGetChartData = async (params = {}) => {
    const res = await request.get(API_PATHS.admin.stats.charts, { params });
    return res.data;
};

export const requestUpdateOrderStatus = async (data) => {
    const { orderId, ...payload } = data;
    const res = await request.patch(API_PATHS.admin.orderStatus(orderId), payload);
    return res.data;
};

export const requestMarkPaymentRefundProcessed = async (attemptId, data = {}) => {
    const res = await request.patch(API_PATHS.admin.paymentAttemptRefundProcessed(attemptId), {
        refundProcessed: true,
        ...data,
    });
    return res.data;
};

export const requestDashboard = async (params) => {
    const res = await request.get(API_PATHS.admin.dashboard, { params });
    return res.data;
};

export const requestGetOrderStats = async (params) => {
    const res = await request.get(API_PATHS.admin.stats.orders, { params });
    return res.data;
};
