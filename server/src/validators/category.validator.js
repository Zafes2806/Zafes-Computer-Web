const { body, param, query } = require('express-validator');
const {
    CATEGORY_LIST_STATUSES,
    CATEGORY_STATUSES,
} = require('../constants/categoryStatus');

const categoryPayloadValidation = [
    body('name').trim().notEmpty().withMessage('Tên danh mục không được để trống'),
    body('image').trim().notEmpty().withMessage('Hình ảnh danh mục không được để trống'),
];

const createCategoryValidation = [
    ...categoryPayloadValidation,
    body('status').optional().trim().isIn(CATEGORY_STATUSES).withMessage('Trạng thái danh mục không hợp lệ'),
];

const updateCategoryValidation = [
    param('id').isUUID().withMessage('Mã danh mục không hợp lệ'),
    ...categoryPayloadValidation,
];

const categoryIdParamValidation = [
    param('id').isUUID().withMessage('Mã danh mục không hợp lệ'),
];

const categoryStatusUpdateValidation = [
    ...categoryIdParamValidation,
    body('status').trim().isIn(CATEGORY_STATUSES).withMessage('Trạng thái danh mục không hợp lệ'),
];

const categoryListValidation = [
    query('includeDeleted').optional().isIn(['true', 'false']).withMessage('includeDeleted không hợp lệ'),
    query('status').optional().isIn(CATEGORY_LIST_STATUSES).withMessage('Trạng thái danh mục không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
];

module.exports = {
    categoryIdParamValidation,
    categoryListValidation,
    categoryStatusUpdateValidation,
    createCategoryValidation,
    updateCategoryValidation,
};
