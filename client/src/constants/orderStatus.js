import { TAG_COLOR } from './tagPalette';

export const ORDER_STATUS_CONFIG = Object.freeze({
    pending_payment: { label: 'Chờ thanh toán', color: TAG_COLOR.warning },
    pending: { label: 'Chờ xác nhận', color: TAG_COLOR.pending },
    confirmed: { label: 'Chờ lấy hàng', color: TAG_COLOR.info },
    shipping: { label: 'Đang giao', color: TAG_COLOR.progress },
    delivered: { label: 'Đã giao hàng', color: TAG_COLOR.secondary },
    completed: { label: 'Hoàn thành', color: TAG_COLOR.success },
    cancelled: { label: 'Đã hủy', color: TAG_COLOR.danger },
    return_requested: { label: 'Yêu cầu trả hàng/hoàn tiền', color: TAG_COLOR.warning },
    return_rejected: { label: 'Từ chối trả hàng', color: TAG_COLOR.danger },
    return_in_progress: { label: 'Đang trả hàng', color: TAG_COLOR.highlight },
    returned: { label: 'Đã nhận hàng hoàn', color: TAG_COLOR.accent },
    refunded: { label: 'Đã hoàn tiền', color: TAG_COLOR.emphasis },
});

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => ({
    value,
    ...config,
}));

export const REVIEWABLE_ORDER_STATUSES = Object.freeze(['delivered', 'completed']);

export function getOrderStatusConfig(status) {
    const normalizedStatus = String(status || '').toLowerCase();
    return (
        ORDER_STATUS_CONFIG[normalizedStatus] || {
            label: status || 'Không xác định',
            color: TAG_COLOR.accent,
        }
    );
}

export function getOrderStatusLabel(status) {
    return getOrderStatusConfig(status).label;
}

export function getOrderStatusColor(status) {
    return getOrderStatusConfig(status).color;
}

export function isReviewableOrderStatus(status) {
    return REVIEWABLE_ORDER_STATUSES.includes(String(status || '').toLowerCase());
}
