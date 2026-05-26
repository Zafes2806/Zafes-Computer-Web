const PAYMENT_ATTEMPT_STATUSES = Object.freeze(['pending', 'succeeded', 'failed', 'expired', 'requires_refund', 'refunded']);

const PAYMENT_ATTEMPT_STATUS_LABELS = Object.freeze({
    pending: 'Chờ thanh toán',
    succeeded: 'Thanh toán thành công',
    failed: 'Thanh toán thất bại',
    expired: 'Thanh toán hết hạn',
    requires_refund: 'Cần xử lý hoàn tiền',
    refunded: 'Đã xử lý hoàn tiền',
});

const PAYMENT_PROVIDERS = Object.freeze(['MOMO', 'VNPAY']);

function normalizePaymentProvider(provider) {
    const normalizedProvider = String(provider || '').trim().toUpperCase();
    return PAYMENT_PROVIDERS.includes(normalizedProvider) ? normalizedProvider : null;
}

function isOnlinePaymentProvider(provider) {
    return Boolean(normalizePaymentProvider(provider));
}

module.exports = {
    PAYMENT_ATTEMPT_STATUSES,
    PAYMENT_ATTEMPT_STATUS_LABELS,
    PAYMENT_PROVIDERS,
    isOnlinePaymentProvider,
    normalizePaymentProvider,
};
