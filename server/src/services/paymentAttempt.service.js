const { Op } = require('sequelize');

const { connect } = require('../config/index');
const config = require('../config/env');
const modelOrder = require('../models/order.model');
const PaymentAttempt = require('../models/paymentAttempt.model');
const orderService = require('./order.service');
const paymentGatewayService = require('./payment.service');
const { BadRequestError } = require('../core/error.response');
const {
    normalizePaymentProvider,
} = require('../constants/paymentAttemptStatus');

function assertPaymentProvider(provider) {
    const normalizedProvider = normalizePaymentProvider(provider);
    if (!normalizedProvider) {
        throw new BadRequestError('Nhà cung cấp thanh toán không hợp lệ');
    }
    return normalizedProvider;
}

function buildGatewayRequest({ order, provider, gatewayRequestId, customerReference, shippingInfo }) {
    const baseRequest = {
        orderCode: order.orderCode,
        gatewayRequestId,
        customerReference,
        totalPrice: order.totalPrice,
    };

    if (provider === 'MOMO') {
        return {
            ...baseRequest,
            shippingInfo,
        };
    }

    return baseRequest;
}

function getGatewayFailurePayload(error) {
    return error?.response?.data
        ? {
              status: error.response.status,
              data: error.response.data,
          }
        : {
              message: error?.message || String(error),
          };
}

function isAttemptWithinPaymentWindow(attempt, timeoutMs = config.orders.paymentLinkReuseMs) {
    const timeoutNumber = Number(timeoutMs);
    if (!Number.isFinite(timeoutNumber) || timeoutNumber <= 0) {
        return true;
    }

    const referenceDate = attempt.updatedAt || attempt.createdAt;
    return Date.now() - new Date(referenceDate).getTime() < timeoutNumber;
}

async function findPendingAttempt(orderCode, provider, transaction) {
    return PaymentAttempt.findOne({
        where: {
            orderCode,
            provider,
            status: 'pending',
        },
        order: [['updatedAt', 'DESC']],
        transaction,
        lock: transaction?.LOCK?.UPDATE,
    });
}

function buildGatewayRequestForAttempt({ order, provider, attempt, customerReference, shippingInfo }) {
    const gatewayRequestId = `${order.orderCode}-${attempt.id.replace(/-/g, '').slice(0, 12)}`;
    return buildGatewayRequest({
        order,
        provider,
        gatewayRequestId,
        customerReference,
        shippingInfo,
    });
}

async function createPendingAttempt({ order, provider, customerReference, shippingInfo, transaction }) {
    const lockedOrder = await modelOrder.findOne({
        where: { id: order.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (!lockedOrder) {
        throw new BadRequestError('Không tìm thấy đơn hàng thanh toán');
    }

    if (lockedOrder.status !== 'pending_payment') {
        throw new BadRequestError('Đơn hàng không còn ở trạng thái chờ thanh toán');
    }

    const pendingAttempt = await findPendingAttempt(lockedOrder.orderCode, provider, transaction);

    if (pendingAttempt) {
        if (!isAttemptWithinPaymentWindow(pendingAttempt)) {
            await markAttemptExpiredOnly(pendingAttempt, {
                reason: 'Phiên thanh toán quá thời hạn trước khi tạo lại liên kết',
                transaction,
            });
        } else if (pendingAttempt.paymentUrl) {
            return {
                attempt: pendingAttempt,
                gatewayRequest: pendingAttempt.rawRequest,
                paymentUrl: pendingAttempt.paymentUrl,
                reused: true,
            };
        } else {
            throw new BadRequestError('Liên kết thanh toán đang được tạo. Vui lòng thử lại sau vài giây.');
        }
    }

    const attempt = await PaymentAttempt.create(
        {
            orderId: lockedOrder.id,
            orderCode: lockedOrder.orderCode,
            provider,
            amount: lockedOrder.totalPrice,
            status: 'pending',
        },
        { transaction },
    );

    const gatewayRequest = buildGatewayRequestForAttempt({
        order: lockedOrder,
        provider,
        attempt,
        customerReference,
        shippingInfo,
    });

    await attempt.update(
        {
            gatewayRequestId: gatewayRequest.gatewayRequestId,
            rawRequest: gatewayRequest,
        },
        { transaction },
    );

    return { attempt, gatewayRequest, paymentUrl: null, reused: false };
}

async function createPaymentLink({ order, provider, customerReference, shippingInfo }) {
    const normalizedProvider = assertPaymentProvider(provider);
    const pendingPayment = await connect.transaction((transaction) => createPendingAttempt({
        order,
        provider: normalizedProvider,
        customerReference,
        shippingInfo,
        transaction,
    }));

    if (pendingPayment.reused) {
        return {
            attempt: pendingPayment.attempt,
            orderCode: order.orderCode,
            provider: normalizedProvider,
            paymentUrl: pendingPayment.paymentUrl,
            reused: true,
        };
    }

    if (pendingPayment.expired) {
        throw new BadRequestError('Phiên thanh toán đã hết hạn. Vui lòng tạo đơn hàng mới.');
    }

    const { attempt, gatewayRequest } = pendingPayment;

    try {
        const gatewayResponse =
            normalizedProvider === 'MOMO'
                ? await paymentGatewayService.createMomoPayment(gatewayRequest)
                : await paymentGatewayService.createVnpayPayment(gatewayRequest);
        const paymentUrl = normalizedProvider === 'MOMO' ? gatewayResponse?.payUrl : gatewayResponse;

        if (!paymentUrl) {
            throw new Error('Cổng thanh toán không trả về liên kết thanh toán');
        }

        await attempt.update({
            paymentUrl,
            rawResponse: normalizedProvider === 'MOMO' ? gatewayResponse : { paymentUrl: gatewayResponse },
        });
        await modelOrder.update({ updatedAt: new Date() }, { where: { id: order.id } });

        return {
            attempt,
            orderCode: order.orderCode,
            provider: normalizedProvider,
            paymentUrl,
        };
    } catch (error) {
        await attempt.update({
            status: 'failed',
            failureReason: error?.message || 'Không thể tạo liên kết thanh toán',
            rawResponse: getGatewayFailurePayload(error),
        });
        await modelOrder.update({ updatedAt: new Date() }, { where: { id: order.id } });
        throw error;
    }
}

async function findAttemptForCallback({ orderCode, provider, gatewayRequestId, transaction }) {
    const normalizedProvider = assertPaymentProvider(provider);

    if (gatewayRequestId) {
        const attempt = await PaymentAttempt.findOne({
            where: {
                provider: normalizedProvider,
                gatewayRequestId,
            },
            transaction,
            lock: transaction?.LOCK?.UPDATE,
        });

        if (attempt) return attempt;
    }

    if (!orderCode) return null;

    return PaymentAttempt.findOne({
        where: {
            orderCode,
            provider: normalizedProvider,
        },
        order: [['createdAt', 'DESC']],
        transaction,
        lock: transaction?.LOCK?.UPDATE,
    });
}

function assertCallbackAmount(attempt, rawCallback) {
    const rawAmount = rawCallback?.amount ?? rawCallback?.vnp_Amount;
    const callbackAmount = rawCallback?.vnp_Amount && rawCallback?.amount === undefined
        ? Number(rawAmount) / 100
        : Number(rawAmount);
    if (Number.isFinite(callbackAmount) && callbackAmount !== Number(attempt.amount)) {
        throw new BadRequestError('Số tiền thanh toán không khớp với đơn hàng');
    }
}

function findNewerPendingAttempt(attempt, transaction) {
    return PaymentAttempt.findOne({
        where: {
            orderCode: attempt.orderCode,
            provider: attempt.provider,
            status: 'pending',
            createdAt: { [Op.gt]: attempt.createdAt },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });
}

async function markAttemptRequiresRefund(attempt, { rawCallback = {}, gatewayTransactionId = null, reason, transaction }) {
    await attempt.update(
        {
            status: 'requires_refund',
            gatewayTransactionId,
            rawCallback,
            failureReason: reason || 'Gateway xác nhận thanh toán sau khi đơn hàng không còn chờ thanh toán',
        },
        { transaction },
    );
}

async function markAttemptExpiredOnly(attempt, { reason = 'Thanh toán quá thời hạn', transaction }) {
    if (!attempt || attempt.status !== 'pending') {
        return { changed: false };
    }

    await attempt.update(
        {
            status: 'expired',
            failureReason: reason,
        },
        { transaction },
    );

    return { changed: true };
}

async function expireSiblingPendingAttempts(attempt, transaction) {
    await PaymentAttempt.update(
        {
            status: 'expired',
            failureReason: 'Đã có giao dịch thanh toán thành công cho đơn hàng này',
        },
        {
            where: {
                orderCode: attempt.orderCode,
                id: { [Op.ne]: attempt.id },
                status: 'pending',
            },
            transaction,
        },
    );
}

async function expireAttemptInTransaction(attempt, { reason = 'Thanh toán quá thời hạn', transaction }) {
    if (!attempt || attempt.status !== 'pending') {
        return { changed: false, order: null };
    }

    await markAttemptExpiredOnly(attempt, { reason, transaction });

    const newerPendingAttempt = await findNewerPendingAttempt(attempt, transaction);

    if (newerPendingAttempt) {
        return { changed: false, order: null };
    }

    return orderService.cancelPendingPaymentOrder(attempt.orderCode, { transaction });
}

async function markAttemptSucceeded({ orderCode, provider, gatewayRequestId = null, rawCallback = {}, gatewayTransactionId = null }) {
    if (!orderCode && !gatewayRequestId) {
        throw new BadRequestError('Không tìm thấy mã đơn hàng thanh toán');
    }

    return connect.transaction(async (transaction) => {
        const attempt = await findAttemptForCallback({
            orderCode,
            provider,
            gatewayRequestId,
            transaction,
        });
        if (!attempt) {
            throw new BadRequestError('Không tìm thấy giao dịch thanh toán');
        }

        assertCallbackAmount(attempt, rawCallback);

        const order = await modelOrder.findOne({
            where: { orderCode: attempt.orderCode },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!order) {
            throw new BadRequestError('Không tìm thấy đơn hàng thanh toán');
        }

        if (attempt.status === 'succeeded') {
            if (order.status === 'pending_payment') {
                return {
                    order: await orderService.markPaymentSucceeded(attempt.orderCode, { transaction }),
                    requiresRefund: false,
                };
            }

            return {
                order,
                requiresRefund: order.status === 'cancelled',
            };
        }

        if (attempt.status === 'requires_refund') {
            return { order, requiresRefund: true };
        }

        if (attempt.status === 'refunded') {
            return { order, requiresRefund: false };
        }

        if (order.status !== 'pending_payment' || attempt.status === 'expired') {
            await markAttemptRequiresRefund(attempt, {
                rawCallback,
                gatewayTransactionId,
                transaction,
            });
            return { order, requiresRefund: true };
        }

        if (attempt.status !== 'pending' && attempt.status !== 'failed') {
            await markAttemptRequiresRefund(attempt, {
                rawCallback,
                gatewayTransactionId,
                reason: 'Gateway xác nhận thanh toán cho giao dịch không còn khả dụng',
                transaction,
            });
            return { order, requiresRefund: true };
        }

        await attempt.update(
            {
                status: 'succeeded',
                gatewayTransactionId,
                rawCallback,
                failureReason: null,
            },
            { transaction },
        );
        await expireSiblingPendingAttempts(attempt, transaction);

        return {
            order: await orderService.markPaymentSucceeded(attempt.orderCode, { transaction }),
            requiresRefund: false,
        };
    });
}

async function markAttemptFailed({ orderCode, provider, gatewayRequestId = null, rawCallback = {}, failureReason = null }) {
    if (!orderCode && !gatewayRequestId) {
        return { changed: false, order: null };
    }

    return connect.transaction(async (transaction) => {
        const attempt = await findAttemptForCallback({
            orderCode,
            provider,
            gatewayRequestId,
            transaction,
        });
        if (!attempt) {
            return { changed: false, order: null };
        }

        let order = await modelOrder.findOne({
            where: { orderCode: attempt.orderCode },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (attempt.status === 'succeeded' || attempt.status === 'requires_refund') {
            return { changed: false, order };
        }

        let changed = false;
        if (attempt.status === 'pending') {
            changed = true;
            await attempt.update(
                {
                    status: 'failed',
                    rawCallback,
                    failureReason: failureReason || 'Cổng thanh toán trả về trạng thái thất bại',
                },
                { transaction },
            );

            const newerPendingAttempt = await findNewerPendingAttempt(attempt, transaction);
            if (!newerPendingAttempt) {
                const cancelResult = await orderService.cancelPendingPaymentOrder(attempt.orderCode, { transaction });
                order = cancelResult.order || order;
            } else {
                await modelOrder.update(
                    { updatedAt: new Date() },
                    {
                        where: {
                            orderCode: attempt.orderCode,
                            status: 'pending_payment',
                        },
                        transaction,
                    },
                );
            }
        }

        order = order || await modelOrder.findOne({
            where: { orderCode: attempt.orderCode },
            transaction,
        });
        return { changed, order };
    });
}

async function markRefundProcessed({ attemptId, refundNote = null }) {
    if (!attemptId) {
        throw new BadRequestError('Không tìm thấy giao dịch cần hoàn tiền');
    }

    return connect.transaction(async (transaction) => {
        const attempt = await PaymentAttempt.findOne({
            where: { id: attemptId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!attempt) {
            throw new BadRequestError('Không tìm thấy giao dịch cần hoàn tiền');
        }

        if (attempt.status === 'refunded') {
            return { changed: false, attempt };
        }

        if (attempt.status !== 'requires_refund') {
            throw new BadRequestError('Chỉ có thể xác nhận hoàn tiền cho giao dịch đang cần xử lý hoàn tiền');
        }

        await attempt.update(
            {
                status: 'refunded',
                refundNote: refundNote?.trim() || null,
                refundedAt: new Date(),
            },
            { transaction },
        );

        return { changed: true, attempt };
    });
}

async function expireAttempt({ attemptId, reason = 'Thanh toán quá thời hạn' }) {
    return connect.transaction(async (transaction) => {
        const attempt = await PaymentAttempt.findOne({
            where: { id: attemptId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        return expireAttemptInTransaction(attempt, { reason, transaction });
    });
}

async function expirePendingAttempts(timeoutMs = config.orders.pendingPaymentTimeoutMs) {
    const timeoutNumber = Number(timeoutMs);
    if (!Number.isFinite(timeoutNumber) || timeoutNumber <= 0) {
        return 0;
    }

    const cutoffDate = new Date(Date.now() - timeoutNumber);
    const attempts = await PaymentAttempt.findAll({
        where: {
            status: 'pending',
            updatedAt: { [Op.lte]: cutoffDate },
        },
        attributes: ['id'],
        order: [['updatedAt', 'ASC']],
    });

    let expiredCount = 0;
    for (const attempt of attempts) {
        const result = await expireAttempt({
            attemptId: attempt.id,
        });
        if (result.changed) expiredCount += 1;
    }

    return expiredCount;
}

async function hasPendingAttempt(orderCode, transaction) {
    const pendingAttempt = await PaymentAttempt.findOne({
        where: {
            orderCode,
            status: 'pending',
        },
        attributes: ['id'],
        transaction,
        lock: transaction?.LOCK?.UPDATE,
    });

    return Boolean(pendingAttempt);
}

async function expireStalePendingPaymentOrder(orderCode) {
    return connect.transaction(async (transaction) => {
        if (await hasPendingAttempt(orderCode, transaction)) {
            return { changed: false, order: null };
        }

        return orderService.cancelPendingPaymentOrder(orderCode, { transaction });
    });
}

async function expireStalePendingPaymentOrders(timeoutMs = config.orders.pendingPaymentTimeoutMs) {
    const timeoutNumber = Number(timeoutMs);
    if (!Number.isFinite(timeoutNumber) || timeoutNumber <= 0) {
        return 0;
    }

    const cutoffDate = new Date(Date.now() - timeoutNumber);
    const orders = await modelOrder.findAll({
        where: {
            status: 'pending_payment',
            updatedAt: { [Op.lte]: cutoffDate },
        },
        attributes: ['orderCode'],
        order: [['updatedAt', 'ASC']],
    });

    let expiredCount = 0;
    for (const order of orders) {
        const result = await expireStalePendingPaymentOrder(order.orderCode);
        if (result.changed) expiredCount += 1;
    }

    return expiredCount;
}

module.exports = {
    createPaymentLink,
    expirePendingAttempts,
    expireStalePendingPaymentOrders,
    markAttemptFailed,
    markRefundProcessed,
    markAttemptSucceeded,
};
