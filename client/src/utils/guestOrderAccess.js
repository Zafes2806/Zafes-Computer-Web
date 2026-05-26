const GUEST_ORDER_ACCESS_KEY_PREFIX = 'guest_order_access:';

function getStorageKey(orderCode) {
    return `${GUEST_ORDER_ACCESS_KEY_PREFIX}${String(orderCode || '').trim()}`;
}

export function rememberGuestOrderAccess(orderCode, token) {
    if (typeof window === 'undefined') {
        return;
    }

    const normalizedOrderCode = String(orderCode || '').trim();
    const normalizedToken = String(token || '').trim();
    if (!normalizedOrderCode || !normalizedToken) {
        return;
    }

    window.sessionStorage.setItem(getStorageKey(normalizedOrderCode), normalizedToken);
}

export function getGuestOrderAccessToken(orderCode) {
    if (typeof window === 'undefined') {
        return '';
    }

    const normalizedOrderCode = String(orderCode || '').trim();
    if (!normalizedOrderCode) {
        return '';
    }

    return window.sessionStorage.getItem(getStorageKey(normalizedOrderCode)) || '';
}
