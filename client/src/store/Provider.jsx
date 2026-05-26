import Context from './Context';
import CryptoJS from 'crypto-js';

import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import {
    requestAddToCart,
    requestAuth,
    requestDeleteCart,
    requestGetCart,
    requestGetCategoryPublic,
    requestMergeGuestSession,
    requestUpdateQuantityCart,
} from '../api';
import {
    addGuestCartItem,
    clearGuestBuildPc,
    clearGuestCart,
    getGuestBuildPc,
    getGuestCart,
    removeGuestCartItem,
    updateGuestCartItemQuantity,
} from '../utils/guestStorage';
import { setPendingCartSelection } from '../utils/cartSelection';
import {
    clearBrowserAuthState,
    markBrowserAuthState,
} from '../utils/authSession';

function normalizeCartProduct(product = {}) {
    const basePrice = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const price = Math.max(0, Math.round(basePrice - (basePrice * discount) / 100));

    return {
        ...product,
        price,
    };
}

function upsertCartItem(items = [], product = {}, quantity = 1, { moveToTop = false, cartItem = null } = {}) {
    const quantityNumber = Number(quantity) || 1;
    const normalizedProduct = normalizeCartProduct(product);
    const existingIndex = items.findIndex((item) => item.product.id === normalizedProduct.id);
    const existingItem = existingIndex >= 0 ? items[existingIndex] : null;
    const nextQuantity = Math.max(1, Number(cartItem?.quantity) || (existingItem?.quantity || 0) + quantityNumber);
    const nextProduct = {
        ...(existingItem?.product || {}),
        ...normalizedProduct,
        price: normalizedProduct.price || existingItem?.product?.price || 0,
    };
    const nextItem = {
        id: cartItem?.id || existingItem?.id || `cart-${normalizedProduct.id}`,
        quantity: nextQuantity,
        totalPrice: Number(cartItem?.totalPrice) || nextProduct.price * nextQuantity,
        product: nextProduct,
    };

    if (existingIndex >= 0) {
        const nextItems = [...items];
        nextItems[existingIndex] = nextItem;
        if (moveToTop) {
            return [
                nextItem,
                ...nextItems.filter((item, index) => index !== existingIndex),
            ];
        }
        return nextItems;
    }

    return moveToTop ? [nextItem, ...items] : [...items, nextItem];
}

function replaceCartItemQuantity(items = [], item = {}, quantity = 1) {
    const quantityNumber = Number(quantity) || 1;
    const existingIndex = items.findIndex((cartItem) => cartItem.id === item.id);

    if (existingIndex < 0) {
        return items;
    }

    const existingItem = items[existingIndex];
    const price = Number(existingItem.product?.price) || 0;
    const nextItems = [...items];
    nextItems[existingIndex] = {
        ...existingItem,
        quantity: quantityNumber,
        totalPrice: price * quantityNumber,
    };

    return nextItems;
}

function removeCartItemLocally(items = [], cartItemId) {
    return items.filter((item) => item.id !== cartItemId);
}

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState(null);
    const dataUserRef = useRef(null);
    const [dataCart, setDataCart] = useState([]);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [category, setCategory] = useState([]);
    const didBootstrapSessionRef = useRef(false);
    const didFetchCategoryRef = useRef(false);

    const setSessionUser = useCallback((user) => {
        dataUserRef.current = user;
        setDataUser(user);
    }, []);

    const resetToGuestSession = useCallback(() => {
        clearBrowserAuthState();
        setSessionUser(null);
        setDataCart(getGuestCart());
    }, [setSessionUser]);

    const fetchAuth = useCallback(async ({ silent = false } = {}) => {
        setIsAuthLoading(true);
        try {
            const res = await requestAuth();
            const bytes = CryptoJS.AES.decrypt(res.metadata, import.meta.env.VITE_SECRET_CRYPTO);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) {
                console.error('Failed to decrypt data');
                resetToGuestSession();
                return null;
            }
            const user = JSON.parse(originalText);
            markBrowserAuthState();
            setSessionUser(user);
            return user;
        } catch (error) {
            resetToGuestSession();
            if (!silent) {
                console.error('Auth error:', error);
            }
            return null;
        } finally {
            setIsAuthLoading(false);
        }
    }, [resetToGuestSession, setSessionUser]);

    const fetchCategory = useCallback(async () => {
        try {
            const res = await requestGetCategoryPublic();
            setCategory(Array.isArray(res.metadata) ? res.metadata : []);
        } catch (error) {
            console.error('Category error:', error);
            setCategory([]);
        }
    }, []);

    const fetchCart = useCallback(async (userOverride) => {
        const currentUser = userOverride ?? dataUserRef.current;

        if (!currentUser?.id) {
            const guestCart = getGuestCart();
            setDataCart(guestCart);
            return guestCart;
        }

        try {
            const res = await requestGetCart();
            setDataCart(res.metadata);
            return res.metadata;
        } catch (error) {
            console.error('Cart error:', error);
            setDataCart([]);
            return [];
        }
    }, []);

    const clearSession = useCallback(() => {
        resetToGuestSession();
        setIsAuthLoading(false);
    }, [resetToGuestSession]);

    const syncGuestSession = useCallback(async (user) => {
        if (!user?.id || user.isAdmin) {
            return {
                cartMergedCount: 0,
                buildPcMergedCount: 0,
            };
        }

        const cartItems = getGuestCart().map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
        }));
        const buildPcItems = getGuestBuildPc().map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
        }));

        if (!cartItems.length && !buildPcItems.length) {
            return {
                cartMergedCount: 0,
                buildPcMergedCount: 0,
            };
        }

        const res = await requestMergeGuestSession({
            cartItems,
            buildPcItems,
        });

        clearGuestCart();
        clearGuestBuildPc();

        const mergeResult = res.metadata || {
            cartMergedCount: 0,
            buildPcMergedCount: 0,
        };

        // Hiển thị cảnh báo nếu có sản phẩm bị điều chỉnh số lượng do tồn kho không đủ
        const adjustedItems = Array.isArray(mergeResult.adjustedItems) ? mergeResult.adjustedItems : [];
        for (const adj of adjustedItems) {
            if (adj.actualQuantity === 0) {
                message.warning(
                    `"${adj.productName}" đã hết hàng nên không được thêm vào giỏ hàng.`,
                    6,
                );
            } else {
                message.warning(
                    `"${adj.productName}" chỉ còn ${adj.actualQuantity} sản phẩm trong kho, số lượng đã được điều chỉnh từ ${adj.requestedQuantity} xuống ${adj.actualQuantity}.`,
                    6,
                );
            }
        }

        return mergeResult;
    }, []);

    const addProductToCart = useCallback(async (product, quantity = 1) => {
        if (dataUser?.id) {
            const res = await requestAddToCart({ productId: product.id, quantity });
            const cartItem = res?.metadata || null;
            let nextCart = [];
            setDataCart((currentCart) => {
                nextCart = upsertCartItem(currentCart, product, quantity, { moveToTop: true, cartItem });
                return nextCart;
            });
            return nextCart;
        }

        const guestCart = addGuestCartItem(product, quantity);
        setDataCart(guestCart);
        return guestCart;
    }, [dataUser]);

    const reorderProductsToCart = useCallback(async (items = []) => {
        const normalizedItems = Array.isArray(items)
            ? items.map((item) => ({
                productId: item?.productId ?? item?.product?.id,
                product: item?.product || item,
            })).filter((item) => item.productId)
            : [];

        if (!normalizedItems.length) {
            return dataCart;
        }

        const selectionProductIds = [];
        let nextCart = dataCart;

        for (const item of normalizedItems) {
            selectionProductIds.push(item.productId);

            if (dataUser?.id) {
                const res = await requestAddToCart({ productId: item.productId, quantity: 1 });
                const cartItem = res?.metadata || null;
                nextCart = upsertCartItem(nextCart, {
                    ...item.product,
                    id: item.productId,
                }, 1, { moveToTop: true, cartItem });
                continue;
            }

            addGuestCartItem({
                ...item.product,
                id: item.productId,
            }, 1);
        }

        setPendingCartSelection(selectionProductIds);
        if (dataUser?.id) {
            setDataCart(nextCart);
            return nextCart;
        }

        const guestCart = getGuestCart();
        setDataCart(guestCart);
        return guestCart;
    }, [dataCart, dataUser]);

    const updateCartItemQuantity = useCallback(async (item, quantity) => {
        if (dataUser?.id) {
            await requestUpdateQuantityCart({
                cartItemId: item.id,
                quantity,
            });
            let nextCart = [];
            setDataCart((currentCart) => {
                nextCart = replaceCartItemQuantity(currentCart, item, quantity);
                return nextCart;
            });
            return nextCart;
        }

        const guestCart = updateGuestCartItemQuantity(item.product.id, quantity);
        setDataCart(guestCart);
        return guestCart;
    }, [dataUser]);

    const removeCartItem = useCallback(async (cartItemId) => {
        if (dataUser?.id) {
            await requestDeleteCart({ cartItemId });
            let nextCart = [];
            setDataCart((currentCart) => {
                nextCart = removeCartItemLocally(currentCart, cartItemId);
                return nextCart;
            });
            return nextCart;
        }

        const guestCart = removeGuestCartItem(cartItemId);
        setDataCart(guestCart);
        return guestCart;
    }, [dataUser]);

    const clearGuestCheckoutState = useCallback(() => {
        clearGuestCart();
        clearGuestBuildPc();
        if (!dataUser?.id) {
            setDataCart([]);
        }
    }, [dataUser?.id]);

    useEffect(() => {
        if (didBootstrapSessionRef.current) {
            return;
        }

        didBootstrapSessionRef.current = true;

        const bootstrapSession = async () => {
            const user = await fetchAuth({ silent: true });
            if (user && !user.isAdmin) {
                await syncGuestSession(user);
                await fetchCart(user);
            } else if (user?.isAdmin) {
                setDataCart([]);
            }
        };

        bootstrapSession();
    }, [fetchAuth, fetchCart, syncGuestSession]);

    useEffect(() => {
        if (didFetchCategoryRef.current) {
            return;
        }

        didFetchCategoryRef.current = true;
        fetchCategory();
    }, [fetchCategory]);

    useEffect(() => {
        const handlePageShow = (event) => {
            if (!event.persisted) {
                return;
            }

            fetchCart();
        };

        window.addEventListener('pageshow', handlePageShow);

        return () => {
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [fetchCart]);

    return (
        <Context.Provider
            value={{
                category,
                fetchCategory,
                dataUser,
                fetchAuth,
                isAuthLoading,
                isAuthenticated: Boolean(dataUser?.id),
                dataCart,
                fetchCart,
                addProductToCart,
                reorderProductsToCart,
                updateCartItemQuantity,
                removeCartItem,
                clearGuestCheckoutState,
                syncGuestSession,
                clearSession,
            }}
        >
            {children}
        </Context.Provider>
    );
}
