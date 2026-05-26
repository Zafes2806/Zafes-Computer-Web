const paymentService = require('../services/payment.service');
const paymentAttemptService = require('../services/paymentAttempt.service');
const config = require('../config/env');
const {
    sendMomoCallbackResponse,
} = require('../utils/paymentHttp');
const { grantGuestOrderAccess } = require('../utils/guestOrderAccess');
const { buildOrderPaymentUrl } = require('../utils/clientRoutes');
const clientUrl = config.app.clientUrl;

async function handleMomoCallback(req, res) {
    const callbackData = paymentService.getMomoCallbackPayload(req);
    const gatewayRequestId = callbackData.orderId || callbackData.requestId;

    if (!paymentService.verifyMomoCallbackSignature(callbackData)) {
        return sendMomoCallbackResponse(req, res, 'invalid-signature');
    }

    if (!gatewayRequestId) {
        return sendMomoCallbackResponse(req, res, 'session-expired');
    }

    if (callbackData.resultCode !== '0') {
        const result = await paymentAttemptService.markAttemptFailed({
            gatewayRequestId,
            provider: 'MOMO',
            rawCallback: callbackData,
            failureReason: callbackData.message || 'MoMo trả về trạng thái thất bại',
        });
        return sendMomoCallbackResponse(req, res, 'failed', result.order?.orderCode || '');
    }

    try {
        const result = await paymentAttemptService.markAttemptSucceeded({
            gatewayRequestId,
            provider: 'MOMO',
            rawCallback: callbackData,
            gatewayTransactionId: callbackData.transId || null,
        });
        const { order } = result;
        if (!order.userId) {
            grantGuestOrderAccess(req, res, order.orderCode);
        }
        if (result.requiresRefund) {
            return sendMomoCallbackResponse(req, res, 'requires-refund', order.orderCode);
        }
        return sendMomoCallbackResponse(req, res, 'success', order.orderCode);
    } catch (error) {
        console.error('MoMo payment confirmation error:', error);
        return sendMomoCallbackResponse(req, res, 'stock-unavailable');
    }
}

const handleMomoReturn = handleMomoCallback;
const handleMomoIpn = handleMomoCallback;

async function handleVnpayReturn(req, res) {
    let verifiedReturn;
    try {
        verifiedReturn = paymentService.verifyVnpayReturn(req.query);
    } catch (error) {
        console.error('VNPay signature verification error:', error);
        return res.redirect(`${clientUrl}/cart?paymentError=invalid-signature`);
    }

    if (!verifiedReturn.isVerified) {
        return res.redirect(`${clientUrl}/cart?paymentError=invalid-signature`);
    }

    const gatewayRequestId = verifiedReturn.vnp_TxnRef;

    if (!gatewayRequestId) {
        return res.redirect(`${clientUrl}/cart?paymentError=session-expired`);
    }

    if (!verifiedReturn.isSuccess || verifiedReturn.vnp_TransactionStatus !== '00') {
        const result = await paymentAttemptService.markAttemptFailed({
            gatewayRequestId,
            provider: 'VNPAY',
            rawCallback: { ...req.query, verifiedReturn },
            failureReason: verifiedReturn.vnp_Message || 'VNPay trả về trạng thái thất bại',
        });
        if (result.order?.orderCode) {
            return res.redirect(buildOrderPaymentUrl(clientUrl, result.order.orderCode, '?paymentError=failed'));
        }
        return res.redirect(`${clientUrl}/cart?paymentError=failed`);
    }

    try {
        const result = await paymentAttemptService.markAttemptSucceeded({
            gatewayRequestId,
            provider: 'VNPAY',
            rawCallback: { ...req.query, verifiedReturn },
            gatewayTransactionId: verifiedReturn.vnp_TransactionNo || null,
        });
        const { order } = result;
        if (!order.userId) {
            grantGuestOrderAccess(req, res, order.orderCode);
        }
        if (result.requiresRefund) {
            return res.redirect(buildOrderPaymentUrl(clientUrl, order.orderCode, '?paymentError=requires-refund'));
        }
        return res.redirect(buildOrderPaymentUrl(clientUrl, order.orderCode));
    } catch (error) {
        console.error('VNPay payment confirmation error:', error);
        return res.redirect(`${clientUrl}/cart?paymentError=stock-unavailable`);
    }
}

module.exports = {
    handleMomoIpn,
    handleMomoReturn,
    handleVnpayReturn,
};

