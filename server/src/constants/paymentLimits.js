const PAYMENT_AMOUNT_LIMITS = Object.freeze({
    MOMO: Object.freeze({
        min: 1000,
        max: 50000000,
    }),
});

function formatVnd(amount) {
    return `${Number(amount).toLocaleString('vi-VN')}đ`;
}

function getPaymentAmountLimit(provider) {
    return PAYMENT_AMOUNT_LIMITS[String(provider || '').toUpperCase()] || null;
}

function getPaymentAmountLimitMessage(provider) {
    const normalizedProvider = String(provider || '').toUpperCase();
    const limit = getPaymentAmountLimit(normalizedProvider);

    if (!limit) {
        return null;
    }

    return `${normalizedProvider} chỉ hỗ trợ đơn hàng từ ${formatVnd(limit.min)} đến ${formatVnd(limit.max)}. Vui lòng chọn phương thức khác hoặc tách đơn hàng.`;
}

function isPaymentAmountWithinLimit(provider, amount) {
    const limit = getPaymentAmountLimit(provider);

    if (!limit) {
        return true;
    }

    const amountNumber = Number(amount);
    return Number.isFinite(amountNumber) && amountNumber >= limit.min && amountNumber <= limit.max;
}

module.exports = {
    PAYMENT_AMOUNT_LIMITS,
    getPaymentAmountLimit,
    getPaymentAmountLimitMessage,
    isPaymentAmountWithinLimit,
};
