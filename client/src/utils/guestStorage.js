const GUEST_CART_KEY = 'guest_cart';
const GUEST_BUILD_PC_KEY = 'guest_build_pc';

function readJson(key, fallback) {
    if (typeof window === 'undefined') {
        return fallback;
    }

    try {
        const rawValue = window.localStorage.getItem(key);
        if (!rawValue) {
            return fallback;
        }

        const parsedValue = JSON.parse(rawValue);
        return parsedValue ?? fallback;
    } catch (error) {
        console.error(`Failed to read localStorage key "${key}":`, error);
        return fallback;
    }
}

function writeJson(key, value) {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
}

function getDiscountedPrice(product = {}) {
    const basePrice = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    return Math.max(0, Math.round(basePrice - (basePrice * discount) / 100));
}

function hasInsufficientStock(product = {}, quantity) {
    if (product.stock === undefined || product.stock === null) {
        return false;
    }

    return Number(product.stock) < Number(quantity);
}

function normalizeCartProduct(product = {}) {
    return {
        ...product,
        price: getDiscountedPrice(product),
    };
}

function normalizeBuildPcProduct(product = {}) {
    return {
        ...product,
    };
}

export function getGuestCart() {
    return readJson(GUEST_CART_KEY, []);
}

export function setGuestCart(items) {
    writeJson(GUEST_CART_KEY, Array.isArray(items) ? items : []);
}

export function clearGuestCart() {
    setGuestCart([]);
}

export function addGuestCartItem(product, quantity = 1) {
    const quantityNumber = Number(quantity) || 1;
    const items = getGuestCart();
    const normalizedProduct = normalizeCartProduct(product);
    const existingItem = items.find((item) => item.product.id === normalizedProduct.id);
    const nextQuantity = Math.max(1, (existingItem?.quantity || 0) + quantityNumber);

    if (hasInsufficientStock(normalizedProduct, nextQuantity)) {
        throw new Error('Số lượng trong kho không đủ');
    }

    const nextItem = {
        id: existingItem?.id || `guest-cart-${normalizedProduct.id}`,
        quantity: nextQuantity,
        totalPrice: normalizedProduct.price * nextQuantity,
        product: normalizedProduct,
    };
    const nextItems = [
        nextItem,
        ...items.filter((item) => item.product.id !== normalizedProduct.id),
    ];

    setGuestCart(nextItems);
    return nextItems;
}

export function updateGuestCartItemQuantity(productId, quantity) {
    const quantityNumber = Number(quantity) || 0;
    if (quantityNumber < 1) {
        throw new Error('Số lượng phải lớn hơn 0');
    }

    const items = getGuestCart();
    const nextItems = items.map((item) => {
        if (item.product.id !== productId) {
            return item;
        }

        if (hasInsufficientStock(item.product, quantityNumber)) {
            throw new Error('Số lượng sản phẩm không được vượt quá số lượng có trong kho');
        }

        return {
            ...item,
            quantity: quantityNumber,
            totalPrice: item.product.price * quantityNumber,
        };
    });

    setGuestCart(nextItems);
    return nextItems;
}

export function removeGuestCartItem(cartItemId) {
    const nextItems = getGuestCart().filter((item) => item.id !== cartItemId);
    setGuestCart(nextItems);
    return nextItems;
}

export function getGuestBuildPc() {
    return readJson(GUEST_BUILD_PC_KEY, []);
}

export function setGuestBuildPc(items) {
    writeJson(GUEST_BUILD_PC_KEY, Array.isArray(items) ? items : []);
}

export function clearGuestBuildPc() {
    setGuestBuildPc([]);
}

export function addGuestBuildPcItem(product, quantity = 1) {
    const normalizedProduct = normalizeBuildPcProduct(product);
    const quantityNumber = Number(quantity) || 1;
    const componentType = normalizedProduct.componentType;

    if (!componentType) {
        throw new Error('Sản phẩm không có loại linh kiện hợp lệ');
    }

    if (hasInsufficientStock(normalizedProduct, quantityNumber)) {
        throw new Error('Số lượng trong kho không đủ');
    }

    const existingItems = getGuestBuildPc().filter((item) => item.componentType !== componentType);
    const nextItems = [
        ...existingItems,
        {
            id: `guest-build-${normalizedProduct.id}`,
            quantity: quantityNumber,
            totalPrice: getDiscountedPrice(normalizedProduct) * quantityNumber,
            product: normalizedProduct,
            componentType,
            images: normalizedProduct.images,
        },
    ];

    setGuestBuildPc(nextItems);
    return nextItems;
}

export function updateGuestBuildPcItemQuantity(productId, quantity) {
    const quantityNumber = Number(quantity) || 0;
    if (quantityNumber < 1) {
        throw new Error('Số lượng phải lớn hơn 0');
    }

    const nextItems = getGuestBuildPc().map((item) => {
        if (item.product.id !== productId) {
            return item;
        }

        if (hasInsufficientStock(item.product, quantityNumber)) {
            throw new Error('Số lượng trong kho không đủ');
        }

        return {
            ...item,
            quantity: quantityNumber,
            totalPrice: getDiscountedPrice(item.product) * quantityNumber,
        };
    });

    setGuestBuildPc(nextItems);
    return nextItems;
}

export function removeGuestBuildPcItem(productId) {
    const nextItems = getGuestBuildPc().filter((item) => item.product.id !== productId);
    setGuestBuildPc(nextItems);
    return nextItems;
}

export function moveGuestBuildPcToCart() {
    const buildPcItems = getGuestBuildPc();
    let cartItems = getGuestCart();

    buildPcItems.forEach((item) => {
        const normalizedProduct = normalizeCartProduct(item.product);
        const existingCartItem = cartItems.find((cartItem) => cartItem.product.id === normalizedProduct.id);
        const nextQuantity = (existingCartItem?.quantity || 0) + item.quantity;

        if (hasInsufficientStock(normalizedProduct, nextQuantity)) {
            throw new Error(`Sản phẩm "${normalizedProduct.name}" không đủ tồn kho`);
        }

        if (existingCartItem) {
            cartItems = [
                {
                    id: existingCartItem.id,
                    quantity: nextQuantity,
                    totalPrice: normalizedProduct.price * nextQuantity,
                    product: normalizedProduct,
                },
                ...cartItems.filter((cartItem) => cartItem.product.id !== normalizedProduct.id),
            ];
            return;
        }

        cartItems = [
            {
                id: `guest-cart-${normalizedProduct.id}`,
                quantity: item.quantity,
                totalPrice: normalizedProduct.price * item.quantity,
                product: normalizedProduct,
            },
            ...cartItems,
        ];
    });

    setGuestCart(cartItems);
    clearGuestBuildPc();
    return cartItems;
}

export function buildGuestCheckoutItems(cartItems = []) {
    return cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
    }));
}
