const { body, param, query } = require('express-validator');
const { USER_LIST_STATUSES, USER_STATUSES } = require('../constants/userStatus');

const registerValidation = [
    body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống'),
    body('phone')
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage('Số điện thoại phải bắt đầu bằng số 0 và đủ 10 số'),
    body('address').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
    body('email').trim().isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
];

const createUserValidation = [
    body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống'),
    body('email').trim().isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('role')
        .custom((value) => {
            if (typeof value === 'boolean') {
                return true;
            }

            if (typeof value === 'string') {
                const normalizedValue = value.trim().toLowerCase();
                return normalizedValue === 'true' || normalizedValue === 'false';
            }

            return false;
        })
        .withMessage('Quyền người dùng không hợp lệ'),
    body('phone')
        .optional({ values: 'falsy' })
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage('Số điện thoại phải bắt đầu bằng số 0 và đủ 10 số'),
    body('address').optional({ values: 'falsy' }).trim(),
];

const loginValidation = [
    body('email').trim().isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
];

const googleLoginValidation = [
    body('credential').trim().notEmpty().withMessage('Google credential không được để trống'),
];

const forgotPasswordValidation = [
    body('email').trim().isEmail().withMessage('Email không hợp lệ'),
];

const resetPasswordValidation = [
    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('Mã OTP phải gồm đúng 6 ký tự'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
];

const mergeSessionValidation = [
    body('cartItems').optional().isArray().withMessage('Danh sách giỏ hàng không hợp lệ'),
    body('cartItems.*.productId').optional().isUUID().withMessage('Sản phẩm trong giỏ hàng không hợp lệ'),
    body('cartItems.*.quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số lượng giỏ hàng phải lớn hơn hoặc bằng 1')
        .toInt(),
    body('buildPcItems').optional().isArray().withMessage('Danh sách build PC không hợp lệ'),
    body('buildPcItems.*.productId').optional().isUUID().withMessage('Sản phẩm build PC không hợp lệ'),
    body('buildPcItems.*.quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số lượng build PC phải lớn hơn hoặc bằng 1')
        .toInt(),
];

const updateInfoValidation = [
    body('fullName').optional().trim().notEmpty().withMessage('Họ tên không được để trống'),
    body('address').optional().trim().notEmpty().withMessage('Địa chỉ không được để trống'),
    body('phone')
        .optional()
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage('Số điện thoại phải bắt đầu bằng số 0 và đủ 10 số'),
    body().custom((_, { req }) => {
        const { fullName, address, phone } = req.body || {};
        if (!fullName && !address && !phone) {
            throw new Error('Cần ít nhất một trường để cập nhật');
        }

        return true;
    }),
];

const userIdParamValidation = [
    param('userId').isUUID().withMessage('Mã người dùng không hợp lệ'),
];

const roleValidation = body('role')
    .optional()
    .custom((value) => {
        if (typeof value === 'boolean') {
            return true;
        }

        if (typeof value === 'string') {
            const normalizedValue = value.trim().toLowerCase();
            return normalizedValue === 'true' || normalizedValue === 'false';
        }

        return false;
    })
    .withMessage('Quyền người dùng không hợp lệ');

const updateUserValidation = [
    ...userIdParamValidation,
    roleValidation,
    body('status').optional().trim().isIn(USER_STATUSES).withMessage('Trạng thái người dùng không hợp lệ'),
    body().custom((_, { req }) => {
        if (req.body.role === undefined && req.body.status === undefined) {
            throw new Error('Cần ít nhất một trường để cập nhật');
        }

        return true;
    }),
];

const userIdValidation = [
    ...userIdParamValidation,
];

const getUsersValidation = [
    query('includeDeleted')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('includeDeleted chỉ chấp nhận true hoặc false'),
    query('status')
        .optional()
        .isIn(USER_LIST_STATUSES)
        .withMessage('Trạng thái người dùng không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
    query('role').optional().isIn(['admin', 'user']).withMessage('Bộ lọc vai trò không hợp lệ'),
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
];

module.exports = {
    createUserValidation,
    registerValidation,
    loginValidation,
    googleLoginValidation,
    forgotPasswordValidation,
    mergeSessionValidation,
    resetPasswordValidation,
    updateInfoValidation,
    updateUserValidation,
    userIdValidation,
    getUsersValidation,
};
