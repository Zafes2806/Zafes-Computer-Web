import { TAG_COLOR } from './tagPalette';

export const PAYMENT_TYPE_CONFIG = Object.freeze({
    COD: {
        shortLabel: 'COD',
        label: 'Thanh toán khi nhận hàng',
        color: TAG_COLOR.info,
    },
    MOMO: {
        shortLabel: 'MoMo',
        label: 'Ví MoMo',
        color: TAG_COLOR.secondary,
    },
    VNPAY: {
        shortLabel: 'VNPay',
        label: 'VNPay',
        color: TAG_COLOR.accent,
    },
});

export function getPaymentTypeConfig(type) {
    const normalizedType = String(type || '').toUpperCase();

    return (
        PAYMENT_TYPE_CONFIG[normalizedType] || {
            shortLabel: type || 'Khác',
            label: type || 'Khác',
            color: TAG_COLOR.accent,
        }
    );
}

export function getPaymentTypeLabel(type) {
    return getPaymentTypeConfig(type).label;
}

export function getPaymentTypeShortLabel(type) {
    return getPaymentTypeConfig(type).shortLabel;
}
