const { OK } = require('../core/success.response');
const orderService = require('../services/order.service');
const checkoutService = require('../services/checkout.service');
const paymentAttemptService = require('../services/paymentAttempt.service');
const { parsePaginationQuery } = require('../utils/pagination');
const { getGuestAccessibleOrderIds, grantGuestOrderAccess } = require('../utils/guestOrderAccess');

async function checkout(req, res) {
    const userId = req.user?.id || null;
    const result = await checkoutService.checkout(userId, req.body);

    if (result.type === 'cod') {
        if (!userId) {
            grantGuestOrderAccess(req, res, result.order.orderCode);
        }
        return new OK({ message: 'Đặt hàng thành công', metadata: result.metadata }).send(res);
    }

    if (!userId) {
        grantGuestOrderAccess(req, res, result.order.orderCode);
    }
    if (result.type === 'pending_payment') {
        return new OK({ message: 'Đơn hàng đang chờ thanh toán', metadata: result.metadata }).send(res);
    }

    return new OK({ message: 'Tạo liên kết thanh toán thành công', metadata: result.metadata }).send(res);
}

async function createPaymentRetry(req, res) {
    const orderCode = req.params.orderCode || req.body.orderCode;
    const guestAccessToken = req.body.guestAccessToken || req.query.token;
    const userId = req.user?.id || null;
    const result = await checkoutService.createPaymentRetry({
        userId,
        orderCode,
        allowGuestAccess: getGuestAccessibleOrderIds(req).includes(orderCode),
        guestAccessToken,
    });

    if (!userId) {
        grantGuestOrderAccess(req, res, result.order.orderCode);
    }

    return new OK({ message: 'Tạo lại liên kết thanh toán thành công', metadata: result.metadata }).send(res);
}

async function getUserOrders(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 10, maxLimit: 100 });
    const result = await orderService.getUserOrders(req.user.id, pagination);

    return new OK({
        message: 'Lấy danh sách đơn hàng thành công',
        metadata: result.orders,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function cancelUserOrder(req, res) {
    const orderCode = req.params.orderCode || req.body.orderCode;
    const result = await orderService.cancelOrderWithAccess({
        userId: req.user?.id || null,
        orderCode,
        allowGuestAccess: getGuestAccessibleOrderIds(req).includes(orderCode),
        guestAccessToken: req.body.guestAccessToken || req.query.token,
    });

    if (result.alreadyCancelled) {
        return new OK({ message: 'Đơn hàng đã được hủy trước đó' }).send(res);
    }

    return new OK({ message: 'Hủy đơn hàng thành công' }).send(res);
}

async function requestReturnOrder(req, res) {
    const orderCode = req.params.orderCode || req.body.orderCode;
    await orderService.requestReturnOrder(req.user.id, orderCode, req.body.reason);
    return new OK({ message: 'Gửi yêu cầu trả hàng/hoàn tiền thành công' }).send(res);
}

async function getOrderDetail(req, res) {
    const orderCode = req.params.orderCode || req.query.orderCode;
    const metadata = await orderService.getOrderDetailWithAccess({
        userId: req.user?.id || null,
        orderCode,
        allowGuestAccess: getGuestAccessibleOrderIds(req).includes(orderCode),
        guestAccessToken: req.query.token,
    });

    return new OK({
        message: 'Lấy chi tiết đơn hàng thành công',
        metadata,
    }).send(res);
}

async function getAdminOrders(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 });
    const result = await orderService.getAdminOrders(pagination, req.query);

    return new OK({
        message: 'Lấy danh sách đơn hàng thành công',
        metadata: result.orders,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function updateStatus(req, res) {
    const result = await orderService.updateStatus(
        req.params.orderId,
        req.body.status,
        { adminNote: req.body.adminNote },
    );

    if (!result.changed) {
        return new OK({ message: 'Trạng thái đơn hàng không thay đổi' }).send(res);
    }

    return new OK({ message: 'Cập nhật trạng thái đơn hàng thành công' }).send(res);
}

async function markRefundProcessed(req, res) {
    const result = await paymentAttemptService.markRefundProcessed({
        attemptId: req.params.attemptId,
        refundNote: req.body.refundNote,
    });

    if (!result.changed) {
        return new OK({ message: 'Giao dịch đã được đánh dấu hoàn tiền trước đó' }).send(res);
    }

    return new OK({ message: 'Đã ghi nhận xử lý hoàn tiền' }).send(res);
}

module.exports = {
    cancelUserOrder,
    checkout,
    createPaymentRetry,
    getAdminOrders,
    getOrderDetail,
    getUserOrders,
    markRefundProcessed,
    requestReturnOrder,
    updateStatus,
};

