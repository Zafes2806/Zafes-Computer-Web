const { Op, UniqueConstraintError } = require('sequelize');

const { connect } = require('../config/index');
const modelOrder = require('../models/order.model');
const modelOrderItem = require('../models/orderItem.model');
const modelCart = require('../models/cart.model');
const modelProducts = require('../models/products.model');
const PaymentAttempt = require('../models/paymentAttempt.model');
const ProductSpec = require('../models/productSpec.model');
const {
    canTransitionOrderStatus,
    getAvailableOrderStatuses,
    getOrderStatusLabel,
    isValidOrderStatus,
    ORDER_REVIEWABLE_STATUSES,
    ORDER_RETURNABLE_STATUSES,
} = require('../constants/orderStatus');
const { BadRequestError } = require('../core/error.response');
const config = require('../config/env');
const { getDiscountedPrice } = require('../utils/pricing');
const { buildPaginationMeta } = require('../utils/pagination');
const { getProductAvailabilityBaseInclude } = require('../utils/productQuery');
const { ensureProductIsSellable } = require('../utils/productVisibility');
const {
    buildOrderItemProductSnapshot,
    getOrderItemProductDetails,
} = require('../utils/orderItemSnapshot');
const {
    createGuestOrderToken,
    getGuestOrderTokenExpiresAt,
    hashGuestOrderToken,
    isGuestOrderTokenValid,
} = require('../utils/guestOrderAccess');

const orderReturnWindowHours = config.orders.autoCompleteDelayHours;
const orderReviewWindowMs = config.reviews.reviewWindowDays * 24 * 60 * 60 * 1000;

function sanitizeShippingInfo(shippingInfo = {}) {
    return {
        fullName: shippingInfo.fullName?.trim(),
        phone: shippingInfo.phone?.trim(),
        address: shippingInfo.address?.trim(),
        email: shippingInfo.email?.trim().toLowerCase(),
    };
}

function ensureShippingInfo(shippingInfo = {}) {
    const normalizedInfo = sanitizeShippingInfo(shippingInfo);

    if (!normalizedInfo.fullName || !normalizedInfo.phone || !normalizedInfo.address || !normalizedInfo.email) {
        throw new BadRequestError('Vui lòng nhập đầy đủ thông tin giao hàng');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedInfo.email)) {
        throw new BadRequestError('Email không hợp lệ');
    }

    return normalizedInfo;
}

function normalizeGuestCheckoutItems(items = []) {
    if (!Array.isArray(items) || !items.length) {
        throw new BadRequestError('Giỏ hàng đang trống');
    }

    const mergedItems = new Map();

    for (const item of items) {
        const productId = item?.productId;
        const quantity = Number(item?.quantity);

        if (!productId || !quantity || quantity < 1) {
            throw new BadRequestError('Danh sách sản phẩm thanh toán không hợp lệ');
        }

        const currentItem = mergedItems.get(productId);
        if (currentItem) {
            currentItem.quantity += quantity;
            continue;
        }

        mergedItems.set(productId, { productId, quantity });
    }

    return [...mergedItems.values()];
}

function getOrderSnapshotProductInclude() {
    return [
        ...getProductAvailabilityBaseInclude(),
        {
            model: ProductSpec,
            as: 'specs',
            attributes: ['specKey', 'specValue'],
            required: false,
        },
    ];
}

async function getCheckoutSnapshot(customerContext, shippingInfo, transaction) {
    const { userId, items } = customerContext || {};
    const hasExplicitItems = Array.isArray(items) && items.length > 0;
    let cartItems;

    if (userId && hasExplicitItems) {
        const requestedItems = normalizeGuestCheckoutItems(items);
        const requestedProductIds = requestedItems.map((item) => item.productId);
        const existingCartItems = await modelCart.findAll({
            where: {
                userId,
                productId: { [Op.in]: requestedProductIds },
            },
            order: [['createdAt', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        const cartItemMap = new Map(existingCartItems.map((item) => [item.productId, item]));
        cartItems = requestedItems.map((item) => {
            const cartItem = cartItemMap.get(item.productId);
            if (!cartItem) {
                throw new BadRequestError('Sản phẩm được chọn không còn trong giỏ hàng');
            }
            if (cartItem.quantity < item.quantity) {
                throw new BadRequestError(`Sản phẩm "${item.productId}" không đủ số lượng trong giỏ hàng`);
            }

            return item;
        });
    } else if (userId) {
        cartItems = await modelCart.findAll({
            where: { userId },
            order: [['createdAt', 'ASC']],
            transaction,
        });
    } else {
        cartItems = normalizeGuestCheckoutItems(items);
    }

    if (!cartItems.length) {
        throw new BadRequestError('Giỏ hàng đang trống');
    }

    const { fullName, phone, address, email } = ensureShippingInfo(shippingInfo);
    const productIds = [...new Set(cartItems.map((item) => item.productId))];
    const products = await modelProducts.findAll({
        where: { id: { [Op.in]: productIds } },
        include: getOrderSnapshotProductInclude(),
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const itemSnapshots = cartItems.map((cartItem) => {
        const product = productMap.get(cartItem.productId);
        ensureProductIsSellable(
            product,
            product?.name
                ? `Sản phẩm "${product.name}" hiện không thể đặt mua. Vui lòng kiểm tra lại giỏ hàng.`
                : 'Có sản phẩm trong giỏ hàng hiện không còn khả dụng để đặt mua.',
        );

        if (product.stock < cartItem.quantity) {
            throw new BadRequestError(`Sản phẩm "${product.name}" không đủ tồn kho`);
        }

        const unitPrice = getDiscountedPrice(product);
        return {
            product,
            quantity: cartItem.quantity,
            productId: product.id,
            productName: product.name,
            productImages: product.images,
            unitPrice,
            discount: product.discount || 0,
            lineTotal: unitPrice * cartItem.quantity,
            productSnapshot: buildOrderItemProductSnapshot(product, { unitPrice }),
        };
    });

    return {
        cartItems,
        itemSnapshots,
        totalPrice: itemSnapshots.reduce((total, item) => total + item.lineTotal, 0),
        fullName,
        phone,
        address,
        email,
    };
}

async function findOrderByCode(orderCode) {
    if (!orderCode) return null;
    return modelOrder.findOne({ where: { orderCode } });
}

async function getCheckoutPreview({ userId = null, items = null, shippingInfo }) {
    return connect.transaction(async (transaction) => {
        const snapshot = await getCheckoutSnapshot({ userId, items }, shippingInfo, transaction);

        return {
            totalPrice: snapshot.totalPrice,
        };
    });
}

async function createOrder({ userId = null, items = null, paymentMethod, shippingInfo, options = {} }) {
    const orderCode = options.orderCode || options.generateOrderCode?.();
    const initialStatus = options.initialStatus || 'pending';
    const guestAccessToken = userId ? null : createGuestOrderToken();

    if (!orderCode) {
        throw new BadRequestError('Không thể tạo mã đơn hàng');
    }

    try {
        const existingOrder = await findOrderByCode(orderCode);
        if (existingOrder) return existingOrder;

        return connect.transaction(async (transaction) => {
            const duplicateOrder = await modelOrder.findOne({
                where: { orderCode },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (duplicateOrder) return duplicateOrder;

            const snapshot = await getCheckoutSnapshot({ userId, items }, shippingInfo, transaction);
            const order = await modelOrder.create(
                {
                    orderCode,
                    userId,
                    fullName: snapshot.fullName,
                    phone: snapshot.phone,
                    address: snapshot.address,
                    email: snapshot.email,
                    totalPrice: snapshot.totalPrice,
                    status: initialStatus,
                    paymentMethod,
                    guestAccessTokenHash: guestAccessToken ? hashGuestOrderToken(guestAccessToken) : null,
                    guestAccessTokenExpiresAt: guestAccessToken ? getGuestOrderTokenExpiresAt() : null,
                },
                { transaction },
            );
            order.guestAccessToken = guestAccessToken;

            await modelOrderItem.bulkCreate(
                snapshot.itemSnapshots.map((item) => ({
                    orderId: order.id,
                    productId: item.productId,
                    productName: item.productName,
                    productImages: item.productImages,
                    productSnapshot: item.productSnapshot,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    quantity: item.quantity,
                    lineTotal: item.lineTotal,
                })),
                { transaction },
            );

            for (const item of snapshot.itemSnapshots) {
                await item.product.update({ stock: item.product.stock - item.quantity }, { transaction });
            }

            if (userId) {
                if (Array.isArray(items) && items.length > 0) {
                    const purchasedMap = new Map();

                    for (const item of snapshot.itemSnapshots) {
                        const currentPurchased = purchasedMap.get(item.productId);
                        if (currentPurchased) {
                            currentPurchased.quantity += item.quantity;
                            continue;
                        }

                        purchasedMap.set(item.productId, {
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        });
                    }

                    const purchasedProductIds = [...purchasedMap.keys()];
                    const cartItems = await modelCart.findAll({
                        where: {
                            userId,
                            productId: { [Op.in]: purchasedProductIds },
                        },
                        transaction,
                        lock: transaction.LOCK.UPDATE,
                    });
                    const cartItemMap = new Map(cartItems.map((item) => [item.productId, item]));

                    for (const purchasedItem of purchasedMap.values()) {
                        const cartItem = cartItemMap.get(purchasedItem.productId);
                        if (!cartItem) {
                            continue;
                        }

                        const remainingQuantity = cartItem.quantity - purchasedItem.quantity;
                        if (remainingQuantity > 0) {
                            await cartItem.update(
                                {
                                    quantity: remainingQuantity,
                                    totalPrice: purchasedItem.unitPrice * remainingQuantity,
                                },
                                { transaction },
                            );
                            continue;
                        }

                        if (remainingQuantity === 0) {
                            await cartItem.destroy({ transaction });
                            continue;
                        }

                        throw new BadRequestError('Số lượng trong giỏ hàng không đủ để hoàn tất đơn hàng');
                    }
                } else {
                    await modelCart.destroy({ where: { userId }, transaction });
                }
            }
            return order;
        });
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            const existingOrder = await findOrderByCode(orderCode);
            if (existingOrder) return existingOrder;
        }
        throw error;
    }
}

async function restoreStockForOrder(orderId, transaction) {
    const orderItems = await modelOrderItem.findAll({
        where: { orderId },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    for (const item of orderItems) {
        const product = await modelProducts.findOne({
            where: { id: item.productId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!product) continue;
        await product.update({ stock: product.stock + item.quantity }, { transaction });
    }
}

function buildOrderStatusUpdate(order, nextStatus, { returnReason, adminNote } = {}) {
    const now = new Date();
    const updatePayload = { status: nextStatus };

    if (nextStatus === 'delivered' && !order.deliveredAt) updatePayload.deliveredAt = now;
    if (nextStatus === 'completed' && !order.completedAt) updatePayload.completedAt = now;
    if (nextStatus === 'cancelled' && !order.cancelledAt) updatePayload.cancelledAt = now;
    if (nextStatus === 'return_requested') {
        updatePayload.returnReason = returnReason;
        if (!order.returnRequestedAt) updatePayload.returnRequestedAt = now;
    }
    if (nextStatus === 'return_rejected') {
        updatePayload.adminNote = adminNote;
        if (!order.returnRejectedAt) updatePayload.returnRejectedAt = now;
    }
    if (nextStatus === 'returned' && !order.returnedAt) updatePayload.returnedAt = now;
    if (nextStatus === 'refunded' && !order.refundedAt) updatePayload.refundedAt = now;
    if (order.status === 'return_requested' && nextStatus === 'delivered') {
        updatePayload.returnReason = null;
        updatePayload.returnRequestedAt = null;
    }

    return updatePayload;
}

function getDeliveredReferenceDate(order) {
    if (order.deliveredAt) return new Date(order.deliveredAt);
    if (order.status === 'delivered' && order.updatedAt) return new Date(order.updatedAt);
    return null;
}

function getReviewReferenceDate(order) {
    if (order.completedAt) return new Date(order.completedAt);
    if (order.deliveredAt) return new Date(order.deliveredAt);
    if (ORDER_REVIEWABLE_STATUSES.includes(order.status) && order.updatedAt) return new Date(order.updatedAt);
    return null;
}

function getReviewWindowExpiresAt(order) {
    const reviewReferenceDate = getReviewReferenceDate(order);
    return reviewReferenceDate ? new Date(reviewReferenceDate.getTime() + orderReviewWindowMs) : null;
}

function isReviewWindowOpen(order) {
    if (!ORDER_REVIEWABLE_STATUSES.includes(order.status)) return false;
    const reviewWindowExpiresAt = getReviewWindowExpiresAt(order);
    return Boolean(reviewWindowExpiresAt) && Date.now() <= reviewWindowExpiresAt.getTime();
}

function isReturnWindowOpen(order) {
    if (!ORDER_RETURNABLE_STATUSES.includes(order.status)) return false;
    const deliveredReferenceDate = getDeliveredReferenceDate(order);
    if (!deliveredReferenceDate) return true;
    return Date.now() - deliveredReferenceDate.getTime() < orderReturnWindowHours * 60 * 60 * 1000;
}

function getAvailableStatusesForOrder(order) {
    const availableStatuses = getAvailableOrderStatuses(order.status);
    if (order.status === 'delivered' && !isReturnWindowOpen(order)) {
        return availableStatuses.filter((status) => status !== 'return_requested');
    }
    return availableStatuses;
}

function formatOrderForUser(order) {
    return {
        id: order.id,
        orderCode: order.orderCode,
        orderDate: order.createdAt,
        totalAmount: order.totalPrice,
        status: order.status,
        email: order.email,
        canCancel: canTransitionOrderStatus(order.status, 'cancelled'),
        canComplete: canTransitionOrderStatus(order.status, 'completed'),
        canRequestReturn: isReturnWindowOpen(order),
        canReview: isReviewWindowOpen(order),
        reviewWindowExpiresAt: getReviewWindowExpiresAt(order),
        returnReason: order.returnReason,
        adminNote: order.adminNote,
        deliveredAt: order.deliveredAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
        returnRequestedAt: order.returnRequestedAt,
        returnRejectedAt: order.returnRejectedAt,
        returnedAt: order.returnedAt,
        refundedAt: order.refundedAt,
        paymentMethod: order.paymentMethod,
        products: (order.items || []).map((item) => {
            const productDetails = getOrderItemProductDetails(item, { orderDate: order.createdAt });

            return {
                id: item.id,
                quantity: productDetails.quantity,
                images: productDetails.images,
                unitPrice: productDetails.unitPrice,
                lineTotal: productDetails.lineTotal,
                detailSource: productDetails.detailSource,
                snapshotTakenAt: productDetails.snapshotTakenAt,
                product: {
                    id: productDetails.id,
                    name: productDetails.name,
                    price: productDetails.unitPrice,
                    originalPrice: productDetails.originalPrice,
                    images: productDetails.images,
                    discount: productDetails.discount,
                    componentType: productDetails.componentType,
                    categoryId: productDetails.categoryId,
                    categoryName: productDetails.categoryName,
                    description: productDetails.description,
                    specs: productDetails.specs,
                    pcConfiguration: productDetails.pcConfiguration,
                    detailSource: productDetails.detailSource,
                    snapshotTakenAt: productDetails.snapshotTakenAt,
                },
            };
        }),
    };
}

function formatOrderForAdmin(order) {
    const paymentAttempts = (order.paymentAttempts || [])
        .map((attempt) => ({
            id: attempt.id,
            provider: attempt.provider,
            amount: attempt.amount,
            status: attempt.status,
            gatewayRequestId: attempt.gatewayRequestId,
            gatewayTransactionId: attempt.gatewayTransactionId,
            failureReason: attempt.failureReason,
            refundNote: attempt.refundNote,
            refundedAt: attempt.refundedAt,
            createdAt: attempt.createdAt,
            updatedAt: attempt.updatedAt,
        }))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    return {
        id: order.id,
        orderCode: order.orderCode,
        userId: order.userId,
        fullName: order.fullName,
        phone: order.phone,
        address: order.address,
        email: order.email,
        totalPrice: order.totalPrice,
        status: order.status,
        availableStatuses: getAvailableStatusesForOrder(order),
        returnReason: order.returnReason,
        adminNote: order.adminNote,
        deliveredAt: order.deliveredAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
        returnRequestedAt: order.returnRequestedAt,
        returnRejectedAt: order.returnRejectedAt,
        returnedAt: order.returnedAt,
        refundedAt: order.refundedAt,
        paymentMethod: order.paymentMethod,
        paymentAttempts,
        hasRefundRequired: paymentAttempts.some((attempt) => attempt.status === 'requires_refund'),
        createdAt: order.createdAt,
        products: (order.items || []).map((item) => {
            const productDetails = getOrderItemProductDetails(item, { orderDate: order.createdAt });

            return {
                id: productDetails.id,
                name: productDetails.name,
                price: productDetails.unitPrice,
                unitPrice: productDetails.unitPrice,
                originalPrice: productDetails.originalPrice,
                image: productDetails.image,
                images: productDetails.images,
                componentType: productDetails.componentType,
                categoryId: productDetails.categoryId,
                categoryName: productDetails.categoryName,
                description: productDetails.description,
                specs: productDetails.specs,
                pcConfiguration: productDetails.pcConfiguration,
                discount: productDetails.discount,
                lineTotal: productDetails.lineTotal,
                detailSource: productDetails.detailSource,
                snapshotTakenAt: productDetails.snapshotTakenAt,
                color: '',
                size: '',
                quantity: productDetails.quantity,
            };
        }),
    };
}

function buildAdminOrderWhere(filters = {}) {
    const where = {};
    const search = filters.search?.trim();

    if (filters.status && filters.status !== 'all') {
        where.status = filters.status;
    }

    if (filters.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
    }

    if (filters.orderCode) {
        where.orderCode = { [Op.like]: `%${filters.orderCode.trim()}%` };
    }

    if (filters.fullName) {
        where.fullName = { [Op.like]: `%${filters.fullName.trim()}%` };
    }

    if (filters.phone) {
        where.phone = { [Op.like]: `%${filters.phone.trim()}%` };
    }

    if (search) {
        where[Op.or] = [
            { orderCode: { [Op.like]: `%${search}%` } },
            { fullName: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
        ];
    }

    if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    return where;
}

async function getUserOrders(userId, pagination) {
    const orderQuery = {
        where: { userId },
        include: [
            {
                model: modelOrderItem,
                as: 'items',
                attributes: ['id', 'productId', 'productName', 'productImages', 'productSnapshot', 'unitPrice', 'discount', 'quantity', 'lineTotal'],
            },
        ],
        order: [['createdAt', 'DESC']],
    };

    const orderResult = pagination
        ? await modelOrder.findAndCountAll({ ...orderQuery, limit: pagination.limit, offset: pagination.offset, distinct: true })
        : { rows: await modelOrder.findAll(orderQuery), count: null };

    return {
        orders: orderResult.rows.map(formatOrderForUser),
        pagination: pagination ? buildPaginationMeta(orderResult.count, pagination) : null,
    };
}

function assertOrderAccess(order, { userId, allowGuestAccess = false, guestAccessToken = null } = {}) {
    const hasGuestTokenAccess = isGuestOrderTokenValid(order, guestAccessToken);

    if (order.userId) {
        if (order.userId !== userId && !hasGuestTokenAccess) {
            throw new BadRequestError('Không tìm thấy đơn hàng');
        }
        return;
    }

    if (!allowGuestAccess && !hasGuestTokenAccess) {
        throw new BadRequestError('Không tìm thấy đơn hàng');
    }
}

async function cancelOrderWithAccess({ userId = null, orderCode, allowGuestAccess = false, guestAccessToken = null }) {
    return connect.transaction(async (transaction) => {
        const order = await modelOrder.findOne({
            where: { orderCode },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!order) throw new BadRequestError('Không tìm thấy đơn hàng');

        assertOrderAccess(order, { userId, allowGuestAccess, guestAccessToken });

        if (order.status === 'cancelled') return { alreadyCancelled: true };
        if (!canTransitionOrderStatus(order.status, 'cancelled')) {
            throw new BadRequestError(`Đơn hàng ở trạng thái "${getOrderStatusLabel(order.status)}" không thể hủy`);
        }

        await restoreStockForOrder(order.id, transaction);
        await order.update(buildOrderStatusUpdate(order, 'cancelled'), { transaction });

        return { alreadyCancelled: false };
    });
}

async function cancelUserOrder(userId, orderCode) {
    return cancelOrderWithAccess({ userId, orderCode });
}

async function requestReturnOrder(userId, orderCode, reason) {
    const order = await modelOrder.findOne({ where: { userId, orderCode } });
    if (!order) throw new BadRequestError('Không tìm thấy đơn hàng');
    const returnReason = reason?.trim();
    if (!returnReason) throw new BadRequestError('Vui lòng nhập lý do trả hàng/hoàn tiền');
    if (!canTransitionOrderStatus(order.status, 'return_requested')) {
        throw new BadRequestError(`Đơn hàng ở trạng thái "${getOrderStatusLabel(order.status)}" không thể yêu cầu trả hàng/hoàn tiền`);
    }
    if (!isReturnWindowOpen(order)) throw new BadRequestError('Đơn hàng đã hết thời hạn yêu cầu trả hàng/hoàn tiền');
    await order.update(buildOrderStatusUpdate(order, 'return_requested', { returnReason }));
}

async function completeUserOrder(userId, orderCode) {
    return connect.transaction(async (transaction) => {
        const order = await modelOrder.findOne({
            where: { userId, orderCode },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!order) throw new BadRequestError('Không tìm thấy đơn hàng');
        if (order.status === 'completed') return { changed: false, alreadyCompleted: true };
        if (!canTransitionOrderStatus(order.status, 'completed')) {
            throw new BadRequestError(`Đơn hàng ở trạng thái "${getOrderStatusLabel(order.status)}" không thể xác nhận đã nhận hàng`);
        }

        await order.update(buildOrderStatusUpdate(order, 'completed'), { transaction });
        return { changed: true, alreadyCompleted: false };
    });
}

async function markPaymentSucceeded(orderCode, options = {}) {
    if (!orderCode) throw new BadRequestError('Không tìm thấy đơn hàng thanh toán');

    const run = async (transaction) => {
        const order = await modelOrder.findOne({
            where: { orderCode },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!order) throw new BadRequestError('Không tìm thấy đơn hàng thanh toán');

        if (order.status === 'pending_payment') {
            await order.update({ status: 'pending' }, { transaction });
            order.status = 'pending';
            return order;
        }

        if (order.status === 'cancelled') {
            throw new BadRequestError('Đơn hàng không còn khả dụng để xác nhận thanh toán');
        }

        return order;
    };

    return options.transaction ? run(options.transaction) : connect.transaction(run);
}

async function cancelPendingPaymentOrder(orderCode, options = {}) {
    if (!orderCode) return { changed: false, order: null };

    const run = async (transaction) => {
        const order = await modelOrder.findOne({
            where: { orderCode },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!order) return { changed: false, order: null };

        if (order.status !== 'pending_payment') {
            return { changed: false, order };
        }

        await restoreStockForOrder(order.id, transaction);
        await order.update(buildOrderStatusUpdate(order, 'cancelled'), { transaction });
        order.status = 'cancelled';

        return { changed: true, order };
    };

    return options.transaction ? run(options.transaction) : connect.transaction(run);
}

async function getOrderDetail(userId, orderCode) {
    return getOrderDetailWithAccess({ userId, orderCode });
}

async function getOrderDetailWithAccess({ userId, orderCode, allowGuestAccess = false, guestAccessToken = null }) {
    if (!userId && !allowGuestAccess && !guestAccessToken) {
        throw new BadRequestError('Không tìm thấy đơn hàng');
    }

    const order = await modelOrder.findOne({
        where: { orderCode },
        include: [
            {
                model: modelOrderItem,
                as: 'items',
                attributes: ['productId', 'productName', 'productImages', 'productSnapshot', 'unitPrice', 'discount', 'quantity', 'lineTotal'],
            },
        ],
    });
    if (!order) throw new BadRequestError('Không tìm thấy đơn hàng');
    assertOrderAccess(order, { userId, allowGuestAccess, guestAccessToken });

    return {
        fullName: order.fullName,
        phone: order.phone,
        address: order.address,
        email: order.email,
        paymentMethod: order.paymentMethod,
        totalPrice: order.totalPrice,
        status: order.status,
        returnReason: order.returnReason,
        adminNote: order.adminNote,
        deliveredAt: order.deliveredAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
        returnRequestedAt: order.returnRequestedAt,
        returnRejectedAt: order.returnRejectedAt,
        returnedAt: order.returnedAt,
        refundedAt: order.refundedAt,
        createdAt: order.createdAt,
        products: order.items.map((item) => {
            const productDetails = getOrderItemProductDetails(item, { orderDate: order.createdAt });

            return {
                productId: productDetails.id,
                name: productDetails.name,
                price: productDetails.unitPrice,
                unitPrice: productDetails.unitPrice,
                originalPrice: productDetails.originalPrice,
                discount: productDetails.discount,
                quantity: productDetails.quantity,
                images: productDetails.images,
                lineTotal: productDetails.lineTotal,
                componentType: productDetails.componentType,
                categoryId: productDetails.categoryId,
                categoryName: productDetails.categoryName,
                description: productDetails.description,
                specs: productDetails.specs,
                pcConfiguration: productDetails.pcConfiguration,
                detailSource: productDetails.detailSource,
                snapshotTakenAt: productDetails.snapshotTakenAt,
            };
        }),
    };
}

async function getAdminOrders(pagination, filters = {}) {
    const paymentAttemptStatus = filters.paymentAttemptStatus && filters.paymentAttemptStatus !== 'all'
        ? filters.paymentAttemptStatus
        : null;

    const orderQuery = {
        where: buildAdminOrderWhere(filters),
        include: [
            {
                model: modelOrderItem,
                as: 'items',
                attributes: ['productId', 'productName', 'productImages', 'productSnapshot', 'unitPrice', 'discount', 'quantity', 'lineTotal'],
                include: [
                    {
                        model: modelProducts,
                        as: 'product',
                        attributes: ['componentType'],
                        required: false,
                        paranoid: false,
                    },
                ],
            },
            {
                model: PaymentAttempt,
                as: 'paymentAttempts',
                attributes: [
                    'id',
                    'provider',
                    'amount',
                    'status',
                    'gatewayRequestId',
                    'gatewayTransactionId',
                    'failureReason',
                    'refundNote',
                    'refundedAt',
                    'createdAt',
                    'updatedAt',
                ],
                where: paymentAttemptStatus ? { status: paymentAttemptStatus } : undefined,
                required: Boolean(paymentAttemptStatus),
                separate: !paymentAttemptStatus,
                order: [['createdAt', 'DESC']],
            },
        ],
        order: [['createdAt', 'DESC']],
    };
    const orderResult = pagination
        ? await modelOrder.findAndCountAll({ ...orderQuery, limit: pagination.limit, offset: pagination.offset, distinct: true })
        : { rows: await modelOrder.findAll(orderQuery), count: null };

    return {
        orders: orderResult.rows.map(formatOrderForAdmin),
        pagination: pagination ? buildPaginationMeta(orderResult.count, pagination) : null,
    };
}

async function updateStatus(orderId, status, { adminNote } = {}) {
    if (!isValidOrderStatus(status)) throw new BadRequestError('Trạng thái không hợp lệ');

    const order = await modelOrder.findOne({ where: { id: orderId } });
    if (!order) throw new BadRequestError('Không tìm thấy đơn hàng');
    if (!canTransitionOrderStatus(order.status, status)) {
        throw new BadRequestError(`Không thể chuyển trạng thái từ "${getOrderStatusLabel(order.status)}" sang "${getOrderStatusLabel(status)}"`);
    }
    if (status === 'return_requested' && !isReturnWindowOpen(order)) {
        throw new BadRequestError('Đơn hàng đã hết thời hạn yêu cầu trả hàng/hoàn tiền');
    }

    // Bắt buộc phải có lý do khi admin từ chối yêu cầu trả hàng
    if (status === 'return_rejected') {
        const normalizedNote = adminNote?.trim();
        if (!normalizedNote) {
            throw new BadRequestError('Vui lòng nhập lý do từ chối yêu cầu trả hàng/hoàn tiền');
        }
    }

    if (order.status === status) return { changed: false };

    await connect.transaction(async (transaction) => {
        // Hoàn kho khi hủy hoặc chấp nhận trả hàng — KHÔNG hoàn kho khi từ chối
        if (status === 'cancelled' || status === 'returned') {
            await restoreStockForOrder(order.id, transaction);
        }
        await order.update(buildOrderStatusUpdate(order, status, { adminNote: adminNote?.trim() }), { transaction });
    });

    return { changed: true };
}

module.exports = {
    cancelOrderWithAccess,
    cancelUserOrder,
    cancelPendingPaymentOrder,
    completeUserOrder,
    createOrder,
    ensureShippingInfo,
    findOrderByCode,
    getAdminOrders,
    getCheckoutPreview,
    getOrderDetail,
    getOrderDetailWithAccess,
    getUserOrders,
    markPaymentSucceeded,
    requestReturnOrder,
    sanitizeShippingInfo,
    updateStatus,
};

