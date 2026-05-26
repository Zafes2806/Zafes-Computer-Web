const { body, param, query } = require('express-validator');
const { BLOG_LIST_STATUSES, BLOG_STATUSES } = require('../constants/blogStatus');

const blogPayloadValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề bài viết không được để trống')
        .isLength({ max: 255 })
        .withMessage('Tiêu đề bài viết không được vượt quá 255 ký tự'),
    body('content').trim().notEmpty().withMessage('Nội dung bài viết không được để trống'),
    body('image').trim().notEmpty().withMessage('Hình ảnh bài viết không được để trống'),
];

const createBlogValidation = [
    ...blogPayloadValidation,
    body('status').optional().trim().isIn(BLOG_STATUSES).withMessage('Trạng thái bài viết không hợp lệ'),
];

const updateBlogValidation = [
    param('id').isUUID().withMessage('Mã bài viết không hợp lệ'),
    ...blogPayloadValidation,
];

const blogIdParamValidation = [
    param('id').isUUID().withMessage('Mã bài viết không hợp lệ'),
];

const blogStatusUpdateValidation = [
    ...blogIdParamValidation,
    body('status').trim().isIn(BLOG_STATUSES).withMessage('Trạng thái bài viết không hợp lệ'),
];

const blogListValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
    query('status').optional().isIn(BLOG_LIST_STATUSES).withMessage('Trạng thái bài viết không hợp lệ'),
    query('includeDeleted').optional().isIn(['true', 'false']).withMessage('includeDeleted không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
];

module.exports = {
    blogIdParamValidation,
    blogListValidation,
    blogStatusUpdateValidation,
    createBlogValidation,
    updateBlogValidation,
};
