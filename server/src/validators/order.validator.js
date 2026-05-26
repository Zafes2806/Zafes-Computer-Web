const { body, param, query } = require('express-validator');
const { ORDER_STATUSES } = require('../constants/orderStatus');
const { PAYMENT_ATTEMPT_STATUSES } = require('../constants/paymentAttemptStatus');

const checkoutValidation = [
    body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống'),
    body('phone')
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage('Số điện thoại phải bắt đầu bằng số 0 và đủ 10 số'),
    body('address').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('paymentMethod').isIn(['COD', 'MOMO', 'VNPAY']).withMessage('Phương thức thanh toán không hợp lệ'),
    body('items').optional().isArray({ min: 1 }).withMessage('Danh sách sản phẩm không hợp lệ'),
    body('items.*.productId').optional().isUUID().withMessage('Sản phẩm trong đơn hàng không hợp lệ'),
    body('items.*.quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số lượng sản phẩm phải lớn hơn hoặc bằng 1')
        .toInt(),
];

const returnRequestValidation = [
    param('orderCode').trim().notEmpty().withMessage('Mã đơn hàng không hợp lệ'),
    body('reason')
        .trim()
        .notEmpty()
        .withMessage('Lý do trả hàng/hoàn tiền không được để trống')
        .isLength({ max: 500 })
        .withMessage('Lý do trả hàng/hoàn tiền không được vượt quá 500 ký tự'),
];

const orderCodeParamValidation = [
    param('orderCode').trim().notEmpty().withMessage('Mã đơn hàng không hợp lệ'),
];

const orderListValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
    query('status').optional().isIn(['all', ...ORDER_STATUSES]).withMessage('Trạng thái đơn hàng không hợp lệ'),
    query('paymentAttemptStatus')
        .optional()
        .isIn(['all', ...PAYMENT_ATTEMPT_STATUSES])
        .withMessage('Trạng thái giao dịch thanh toán không hợp lệ'),
    query('paymentMethod').optional().isIn(['COD', 'MOMO', 'VNPAY']).withMessage('Phương thức thanh toán không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
    query('orderCode').optional().isString().withMessage('Mã đơn hàng không hợp lệ'),
    query('fullName').optional().isString().withMessage('Tên khách hàng không hợp lệ'),
    query('phone').optional().isString().withMessage('Số điện thoại không hợp lệ'),
    query('startDate').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('endDate').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
];

const orderStatusUpdateValidation = [
    param('orderId').isUUID().withMessage('Mã đơn hàng nội bộ không hợp lệ'),
    body('status').isIn(ORDER_STATUSES).withMessage('Trạng thái không hợp lệ'),
    body('adminNote')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Lý do từ chối không được vượt quá 1000 ký tự'),
];

const refundProcessedValidation = [
    param('attemptId').isUUID().withMessage('Mã giao dịch thanh toán không hợp lệ'),
    body('refundProcessed')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái xử lý hoàn tiền không hợp lệ')
        .toBoolean(),
    body('refundNote')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Ghi chú hoàn tiền không được vượt quá 1000 ký tự'),
];

module.exports = {
    checkoutValidation,
    orderCodeParamValidation,
    refundProcessedValidation,
    returnRequestValidation,
    orderListValidation,
    orderStatusUpdateValidation,
};

