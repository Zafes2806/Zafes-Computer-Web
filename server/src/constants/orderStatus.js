const ORDER_STATUSES = Object.freeze([
    'pending_payment',
    'pending',
    'confirmed',
    'shipping',
    'delivered',
    'completed',
    'cancelled',
    'return_requested',
    'return_rejected',
    'return_in_progress',
    'returned',
    'refunded',
]);

const ORDER_STATUS_LABELS = Object.freeze({
    pending_payment: 'Chờ thanh toán',
    pending: 'Chờ xác nhận',
    confirmed: 'Chờ lấy hàng',
    shipping: 'Đang giao',
    delivered: 'Đã giao hàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    return_requested: 'Yêu cầu trả hàng/hoàn tiền',
    return_rejected: 'Từ chối trả hàng',
    return_in_progress: 'Đang trả hàng',
    returned: 'Đã nhận hàng hoàn',
    refunded: 'Đã hoàn tiền',
});

const ORDER_STATUS_TRANSITIONS = Object.freeze({
    pending_payment: Object.freeze(['cancelled']),
    pending: Object.freeze(['confirmed', 'cancelled']),
    confirmed: Object.freeze(['shipping', 'cancelled']),
    shipping: Object.freeze(['delivered']),
    delivered: Object.freeze(['return_requested', 'completed']),
    completed: Object.freeze([]),
    cancelled: Object.freeze([]),
    // Admin có thể chấp nhận (return_in_progress) hoặc từ chối (return_rejected)
    return_requested: Object.freeze(['return_in_progress', 'return_rejected']),
    // Sau khi từ chối → admin đóng đơn bằng completed (hàng vẫn ở tay khách, giao dịch kết thúc)
    return_rejected: Object.freeze(['completed']),
    return_in_progress: Object.freeze(['returned']),
    returned: Object.freeze(['refunded']),
    refunded: Object.freeze([]),
});

const ORDER_REVENUE_STATUSES = Object.freeze(['completed']);

const ORDER_REVIEWABLE_STATUSES = Object.freeze(['delivered', 'completed']);

const ORDER_RETURNABLE_STATUSES = Object.freeze(['delivered']);

function isValidOrderStatus(status) {
    return ORDER_STATUSES.includes(status);
}

function getNextOrderStatuses(status) {
    return ORDER_STATUS_TRANSITIONS[status] || [];
}

function getAvailableOrderStatuses(status) {
    if (!isValidOrderStatus(status)) {
        return [];
    }

    return [status, ...getNextOrderStatuses(status)];
}

function canTransitionOrderStatus(currentStatus, nextStatus) {
    if (!isValidOrderStatus(currentStatus) || !isValidOrderStatus(nextStatus)) {
        return false;
    }

    if (currentStatus === nextStatus) return false;

    return getNextOrderStatuses(currentStatus).includes(nextStatus);
}

function getOrderStatusLabel(status) {
    return ORDER_STATUS_LABELS[status] || status;
}

module.exports = {
    ORDER_STATUSES,
    ORDER_STATUS_LABELS,
    ORDER_REVENUE_STATUSES,
    ORDER_REVIEWABLE_STATUSES,
    ORDER_RETURNABLE_STATUSES,
    canTransitionOrderStatus,
    getAvailableOrderStatuses,
    getNextOrderStatuses,
    getOrderStatusLabel,
    isValidOrderStatus,
};
