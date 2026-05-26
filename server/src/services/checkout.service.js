const { BadRequestError } = require('../core/error.response');
const orderService = require('./order.service');
const paymentAttemptService = require('./paymentAttempt.service');
const paymentGatewayService = require('./payment.service');
const { normalizePaymentProvider } = require('../constants/paymentAttemptStatus');
const {
    getPaymentAmountLimitMessage,
    isPaymentAmountWithinLimit,
} = require('../constants/paymentLimits');
const config = require('../config/env');
const sendOrderEmail = require('../utils/sendOrderEmail');
const { isGuestOrderTokenValid } = require('../utils/guestOrderAccess');
const { buildOrderPaymentPath } = require('../utils/clientRoutes');

function getCheckoutItems(userId, payload) {
    if (Array.isArray(payload.items) && payload.items.length > 0) {
        return payload.items;
    }

    return userId ? null : payload.items;
}

function buildCustomerReference(userId, orderCode) {
    return userId || `guest:${orderCode}`;
}

function buildOrderCustomerReference(order) {
    return order.userId ? buildCustomerReference(order.userId, order.orderCode) : buildCustomerReference(null, order.orderCode);
}

function buildOrderAccessUrl(order) {
    const orderPath = buildOrderPaymentPath(order.orderCode);
    const token = order.guestAccessToken;
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${config.app.clientUrl}${orderPath}${query}`;
}

function buildGuestAccessMetadata(order) {
    return order.guestAccessToken ? { guestAccessToken: order.guestAccessToken } : {};
}

async function sendCheckoutEmailSafely(order) {
    if (!order.email) {
        return false;
    }

    try {
        const detail = await orderService.getOrderDetailWithAccess({
            userId: order.userId || null,
            orderCode: order.orderCode,
            allowGuestAccess: true,
            guestAccessToken: order.guestAccessToken || null,
        });

        await sendOrderEmail({
            to: order.email,
            accessUrl: buildOrderAccessUrl(order),
            order: {
                ...detail,
                orderCode: order.orderCode,
            },
        });
        return true;
    } catch (error) {
        console.error('[orders] Failed to send checkout email:', error.message || error);
        return false;
    }
}

async function assertOrderCanUseOnlinePayment(order, provider, { cancelIfInvalid = false } = {}) {
    if (isPaymentAmountWithinLimit(provider, order.totalPrice)) {
        return;
    }

    if (cancelIfInvalid && order.status === 'pending_payment') {
        await orderService.cancelPendingPaymentOrder(order.orderCode);
    }

    throw new BadRequestError(getPaymentAmountLimitMessage(provider) || 'Số tiền thanh toán không hợp lệ');
}

function assertAmountCanUseOnlinePayment(amount, provider) {
    if (isPaymentAmountWithinLimit(provider, amount)) {
        return;
    }

    throw new BadRequestError(getPaymentAmountLimitMessage(provider) || 'Số tiền thanh toán không hợp lệ');
}

function getGatewayAmountLimitErrorMessage(error, provider) {
    const responseData = error?.response?.data;

    if (responseData?.resultCode === 22) {
        return getPaymentAmountLimitMessage(provider) || responseData.message || 'Số tiền thanh toán không hợp lệ';
    }

    return null;
}

async function checkout(userId, payload) {
    const paymentMethod = String(payload.paymentMethod || '').trim().toUpperCase();
    const shippingInfo = orderService.ensureShippingInfo(payload);
    const items = getCheckoutItems(userId, payload);

    if (paymentMethod === 'COD') {
        const order = await orderService.createOrder({
            userId,
            items,
            paymentMethod,
            shippingInfo,
            options: {
                generateOrderCode: paymentGatewayService.generateOrderCode,
            },
        });
        const emailSent = await sendCheckoutEmailSafely(order);

        return {
            type: 'cod',
            order,
            metadata: {
                orderCode: order.orderCode,
                paymentMethod,
                emailSent,
                ...buildGuestAccessMetadata(order),
            },
        };
    }

    const provider = normalizePaymentProvider(paymentMethod);
    if (!provider) {
        throw new BadRequestError('Phương thức thanh toán không hợp lệ');
    }

    const preview = await orderService.getCheckoutPreview({
        userId,
        items,
        shippingInfo,
    });
    assertAmountCanUseOnlinePayment(preview.totalPrice, provider);

    const order = await orderService.createOrder({
        userId,
        items,
        paymentMethod,
        shippingInfo,
        options: {
            generateOrderCode: paymentGatewayService.generateOrderCode,
            initialStatus: 'pending_payment',
        },
    });

    await assertOrderCanUseOnlinePayment(order, provider, { cancelIfInvalid: true });

    let payment = null;
    try {
        payment = await paymentAttemptService.createPaymentLink({
            order,
            provider,
            customerReference: buildOrderCustomerReference(order),
            shippingInfo,
        });
    } catch (error) {
        const amountLimitMessage = getGatewayAmountLimitErrorMessage(error, provider);

        if (amountLimitMessage || error instanceof BadRequestError) {
            await orderService.cancelPendingPaymentOrder(order.orderCode);
            throw new BadRequestError(amountLimitMessage || error.message);
        }

        const emailSent = await sendCheckoutEmailSafely(order);
        return {
            type: 'pending_payment',
            order,
            metadata: {
                orderCode: order.orderCode,
                paymentMethod,
                provider,
                paymentUrl: null,
                paymentLinkError: error?.message || 'Không thể tạo liên kết thanh toán',
                emailSent,
                ...buildGuestAccessMetadata(order),
            },
        };
    }

    const emailSent = await sendCheckoutEmailSafely(order);

    return {
        type: 'redirect',
        order,
        metadata: {
            orderCode: order.orderCode,
            paymentMethod,
            provider,
            paymentUrl: payment.paymentUrl,
            emailSent,
            ...buildGuestAccessMetadata(order),
        },
    };
}

function ensureOrderAccess(order, { userId, allowGuestAccess, guestAccessToken = null }) {
    const hasGuestTokenAccess = isGuestOrderTokenValid(order, guestAccessToken);

    if (order.userId && order.userId !== userId && !hasGuestTokenAccess) {
        throw new BadRequestError('Không tìm thấy đơn hàng');
    }

    if (!order.userId && !allowGuestAccess && !hasGuestTokenAccess) {
        throw new BadRequestError('Không tìm thấy đơn hàng');
    }
}

async function createPaymentRetry({ userId = null, orderCode, allowGuestAccess = false, guestAccessToken = null }) {
    const order = await orderService.findOrderByCode(orderCode);
    if (!order) {
        throw new BadRequestError('Không tìm thấy đơn hàng');
    }

    ensureOrderAccess(order, { userId, allowGuestAccess, guestAccessToken });

    if (order.status !== 'pending_payment') {
        throw new BadRequestError('Đơn hàng không còn ở trạng thái chờ thanh toán');
    }

    const provider = normalizePaymentProvider(order.paymentMethod);
    if (!provider) {
        throw new BadRequestError('Đơn hàng không dùng phương thức thanh toán online');
    }

    await assertOrderCanUseOnlinePayment(order, provider, { cancelIfInvalid: true });

    const payment = await paymentAttemptService.createPaymentLink({
        order,
        provider,
        customerReference: buildOrderCustomerReference(order),
        shippingInfo: {
            fullName: order.fullName,
            phone: order.phone,
            address: order.address,
            email: order.email,
        },
    });

    return {
        order,
        metadata: {
            orderCode: order.orderCode,
            paymentMethod: order.paymentMethod,
            provider,
            paymentUrl: payment.paymentUrl,
        },
    };
}

module.exports = {
    checkout,
    createPaymentRetry,
};
