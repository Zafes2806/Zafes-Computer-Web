const PENDING_CART_SELECTION_KEY = 'pending_cart_selection_product_ids';

function normalizeProductIds(productIds = []) {
    return [...new Set(
        productIds
            .map((productId) => String(productId || '').trim())
            .filter(Boolean),
    )];
}

export function setPendingCartSelection(productIds = []) {
    if (typeof window === 'undefined') {
        return;
    }

    const normalizedProductIds = normalizeProductIds(productIds);
    window.sessionStorage.setItem(PENDING_CART_SELECTION_KEY, JSON.stringify(normalizedProductIds));
}

export function consumePendingCartSelection() {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const rawValue = window.sessionStorage.getItem(PENDING_CART_SELECTION_KEY);
        window.sessionStorage.removeItem(PENDING_CART_SELECTION_KEY);

        if (!rawValue) {
            return [];
        }

        const parsedValue = JSON.parse(rawValue);
        return Array.isArray(parsedValue) ? normalizeProductIds(parsedValue) : [];
    } catch (error) {
        console.error('Failed to consume pending cart selection:', error);
        window.sessionStorage.removeItem(PENDING_CART_SELECTION_KEY);
        return [];
    }
}
