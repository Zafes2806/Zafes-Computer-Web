const axios = require('axios');
const crypto = require('crypto');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const config = require('../config/env');

const clientUrl = config.app.clientUrl;
const serverUrl = config.app.serverUrl;
const { momo, vnpay } = config.payments;
const { buildOrderPaymentUrl } = require('../utils/clientRoutes');

const vnpayClient = vnpay.isConfigured
    ? new VNPay({
        tmnCode: vnpay.tmnCode,
        secureSecret: vnpay.secureSecret,
        vnpayHost: vnpay.host,
        testMode: vnpay.testMode,
        hashAlgorithm: 'SHA512',
        loggerFn: ignoreLogger,
    })
    : null;

function generateOrderCode() {
    const now = new Date();
    const timestamp = now.getTime();
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `PAY${timestamp}${randomSuffix}`;
}

function isMatchingSignature(expectedSignature, receivedSignature) {
    if (!expectedSignature || !receivedSignature) {
        return false;
    }

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function buildMomoCallbackSignaturePayload(callbackData) {
    return [
        `accessKey=${momo.accessKey || ''}`,
        `amount=${callbackData.amount}`,
        `extraData=${callbackData.extraData}`,
        `message=${callbackData.message}`,
        `orderId=${callbackData.orderId}`,
        `orderInfo=${callbackData.orderInfo}`,
        `orderType=${callbackData.orderType}`,
        `partnerCode=${callbackData.partnerCode}`,
        `payType=${callbackData.payType}`,
        `requestId=${callbackData.requestId}`,
        `responseTime=${callbackData.responseTime}`,
        `resultCode=${callbackData.resultCode}`,
        `transId=${callbackData.transId}`,
    ].join('&');
}

function getMomoCallbackPayload(req) {
    const source = req.method === 'POST' ? req.body || {} : req.query || {};

    return {
        amount: String(source.amount || ''),
        extraData: typeof source.extraData === 'string' ? source.extraData : '',
        message: String(source.message || ''),
        orderId: String(source.orderId || ''),
        orderInfo: String(source.orderInfo || ''),
        orderType: String(source.orderType || ''),
        partnerCode: String(source.partnerCode || ''),
        payType: String(source.payType || ''),
        requestId: String(source.requestId || ''),
        responseTime: String(source.responseTime || ''),
        resultCode: String(source.resultCode || ''),
        signature: String(source.signature || ''),
        transId: String(source.transId || ''),
    };
}

function verifyMomoCallbackSignature(callbackData) {
    if (!momo.secretKey) {
        throw new Error('MOMO_SECRET_KEY chưa được cấu hình');
    }

    const rawSignature = buildMomoCallbackSignaturePayload(callbackData);
    const expectedSignature = crypto.createHmac('sha256', momo.secretKey).update(rawSignature).digest('hex');

    return isMatchingSignature(expectedSignature, callbackData.signature);
}

function buildMomoCallbackResponse({ method, outcome, orderCode = '' }) {
    if (method === 'POST') {
        if (outcome === 'success') return { type: 'empty', statusCode: 204 };
        if (outcome === 'invalid-signature') {
            return { type: 'json', statusCode: 400, body: { message: 'Chữ ký MoMo không hợp lệ' } };
        }
        if (outcome === 'session-expired') {
            return { type: 'json', statusCode: 400, body: { message: 'Phiên thanh toán đã hết hạn' } };
        }
        if (outcome === 'failed') {
            return { type: 'json', statusCode: 400, body: { message: 'Thanh toán MoMo thất bại' } };
        }
        if (outcome === 'requires-refund') {
            return {
                type: 'json',
                statusCode: 409,
                body: {
                    message: 'Thanh toán đã ghi nhận sau khi đơn hàng không còn khả dụng. Vui lòng liên hệ hỗ trợ để hoàn tiền.',
                },
            };
        }

        return {
            type: 'json',
            statusCode: 409,
            body: { message: 'Không thể tạo đơn hàng từ giao dịch đã thanh toán' },
        };
    }

    if (outcome === 'success') return { type: 'redirect', location: buildOrderPaymentUrl(clientUrl, orderCode) };
    if (outcome === 'invalid-signature') {
        return { type: 'redirect', location: `${clientUrl}/cart?paymentError=invalid-signature` };
    }
    if (outcome === 'session-expired') {
        return { type: 'redirect', location: `${clientUrl}/cart?paymentError=session-expired` };
    }
    if (outcome === 'failed' && orderCode) {
        return { type: 'redirect', location: buildOrderPaymentUrl(clientUrl, orderCode, '?paymentError=failed') };
    }
    if (outcome === 'failed') return { type: 'redirect', location: `${clientUrl}/cart?paymentError=failed` };
    if (outcome === 'requires-refund' && orderCode) {
        return { type: 'redirect', location: buildOrderPaymentUrl(clientUrl, orderCode, '?paymentError=requires-refund') };
    }
    if (outcome === 'requires-refund') {
        return { type: 'redirect', location: `${clientUrl}/cart?paymentError=requires-refund` };
    }
    return { type: 'redirect', location: `${clientUrl}/cart?paymentError=stock-unavailable` };
}

async function createMomoPayment({ orderCode, gatewayRequestId = orderCode, customerReference, totalPrice, shippingInfo }) {
    if (!momo.isConfigured) {
        throw new Error('Cấu hình thanh toán MoMo chưa đầy đủ');
    }
    if (!orderCode) {
        throw new Error('Thiếu mã đơn hàng để tạo thanh toán MoMo');
    }

    const partnerCode = momo.partnerCode;
    const accessKey = momo.accessKey;
    const secretkey = momo.secretKey;
    const requestId = gatewayRequestId;
    const momoOrderId = gatewayRequestId;
    const orderInfo = `${customerReference}`;
    const redirectUrl = `${serverUrl}/api/payments/momo/return`;
    const ipnUrl = `${serverUrl}/api/payments/momo/ipn`;
    const extraData = Buffer.from(JSON.stringify({ orderCode, gatewayRequestId, customerReference, ...shippingInfo })).toString('base64url');

    const rawSignature =
        'accessKey=' + accessKey +
        '&amount=' + totalPrice +
        '&extraData=' + extraData +
        '&ipnUrl=' + ipnUrl +
        '&orderId=' + momoOrderId +
        '&orderInfo=' + orderInfo +
        '&partnerCode=' + partnerCode +
        '&redirectUrl=' + redirectUrl +
        '&requestId=' + requestId +
        '&requestType=captureWallet';

    const signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');

    const response = await axios.post(
        momo.endpoint,
        JSON.stringify({
            partnerCode,
            accessKey,
            requestId,
            amount: totalPrice,
            orderId: momoOrderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType: 'captureWallet',
            signature,
            lang: 'en',
        }),
        { headers: { 'Content-Type': 'application/json' } },
    );

    return response.data;
}

async function createVnpayPayment({ orderCode, gatewayRequestId = orderCode, customerReference, totalPrice }) {
    if (!vnpayClient) {
        throw new Error('Cấu hình thanh toán VNPay chưa đầy đủ');
    }
    if (!orderCode) {
        throw new Error('Thiếu mã đơn hàng để tạo thanh toán VNPay');
    }

    const expiresAt = new Date(Date.now() + config.orders.pendingPaymentTimeoutMs);

    return vnpayClient.buildPaymentUrl({
        vnp_Amount: totalPrice,
        vnp_IpAddr: '127.0.0.1',
        vnp_TxnRef: gatewayRequestId,
        vnp_OrderInfo: `${customerReference}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: `${serverUrl}/api/payments/vnpay/return`,
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ExpireDate: dateFormat(expiresAt),
    });
}

function verifyVnpayReturn(query) {
    if (!vnpayClient) {
        throw new Error('Cấu hình thanh toán VNPay chưa đầy đủ');
    }

    return vnpayClient.verifyReturnUrl(query);
}

module.exports = {
    buildMomoCallbackResponse,
    createMomoPayment,
    createVnpayPayment,
    generateOrderCode,
    getMomoCallbackPayload,
    verifyMomoCallbackSignature,
    verifyVnpayReturn,
};
