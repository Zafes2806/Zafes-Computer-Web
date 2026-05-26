const { body, param, query } = require('express-validator');
const { REVIEW_LIST_STATUSES, REVIEW_STATUSES } = require('../constants/reviewStatus');

const reviewCreateValidation = [
    body('productId').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
    body('orderCode').trim().notEmpty().withMessage('Mã đơn hàng không được để trống'),
    body('rating')
        .notEmpty()
        .withMessage('Vui lòng chọn số sao đánh giá')
        .bail()
        .isInt({ min: 1, max: 5 })
        .withMessage('Số sao đánh giá phải từ 1 đến 5')
        .toInt(),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung đánh giá không được để trống')
        .bail()
        .isLength({ max: 1000 })
        .withMessage('Nội dung đánh giá không được vượt quá 1000 ký tự'),
];

const reviewIdValidation = [param('id').isUUID().withMessage('Mã đánh giá không hợp lệ')];

const reviewUpdateValidation = [
    ...reviewIdValidation,
    body('rating')
        .notEmpty()
        .withMessage('Vui lòng chọn số sao đánh giá')
        .bail()
        .isInt({ min: 1, max: 5 })
        .withMessage('Số sao đánh giá phải từ 1 đến 5')
        .toInt(),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung đánh giá không được để trống')
        .bail()
        .isLength({ max: 1000 })
        .withMessage('Nội dung đánh giá không được vượt quá 1000 ký tự'),
];

const reviewListValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
    query('status').optional().isIn(REVIEW_LIST_STATUSES).withMessage('Trạng thái đánh giá không hợp lệ'),
    query('includeDeleted').optional().isIn(['true', 'false']).withMessage('includeDeleted không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
    query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Số sao không hợp lệ').toInt(),
    query('startDate').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('endDate').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
];

const reviewStatusUpdateValidation = [
    ...reviewIdValidation,
    body('status').trim().isIn(REVIEW_STATUSES).withMessage('Trạng thái đánh giá không hợp lệ'),
];

module.exports = {
    reviewCreateValidation,
    reviewIdValidation,
    reviewListValidation,
    reviewStatusUpdateValidation,
    reviewUpdateValidation,
};
