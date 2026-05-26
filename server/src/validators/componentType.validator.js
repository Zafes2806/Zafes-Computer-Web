const { body, param, query } = require('express-validator');

const {
    COMPONENT_TYPE_LIST_STATUSES,
    COMPONENT_TYPE_STATUSES,
} = require('../constants/componentTypeStatus');
const { normalizeComponentType } = require('../constants/componentTypes');

const componentTypeCodeParamValidation = [
    param('code')
        .customSanitizer((value) => normalizeComponentType(value))
        .matches(/^[a-z0-9_-]{2,50}$/)
        .withMessage('Mã loại linh kiện không hợp lệ'),
];

const componentTypePayloadValidation = [
    body('name').optional().trim().notEmpty().withMessage('Tên loại linh kiện không được để trống'),
    body('isBuildPcAllowed').optional().isBoolean().withMessage('isBuildPcAllowed không hợp lệ').toBoolean(),
    body('status').optional().trim().isIn(COMPONENT_TYPE_STATUSES).withMessage('Trạng thái loại linh kiện không hợp lệ'),
];

const createComponentTypeValidation = [
    body('code')
        .customSanitizer((value) => normalizeComponentType(value))
        .matches(/^[a-z0-9_-]{2,50}$/)
        .withMessage('Mã loại linh kiện không hợp lệ'),
    body('name').trim().notEmpty().withMessage('Tên loại linh kiện không được để trống'),
    ...componentTypePayloadValidation,
];

const updateComponentTypeValidation = [
    ...componentTypeCodeParamValidation,
    ...componentTypePayloadValidation,
];

const componentTypeStatusUpdateValidation = [
    ...componentTypeCodeParamValidation,
    body('status').trim().isIn(COMPONENT_TYPE_STATUSES).withMessage('Trạng thái loại linh kiện không hợp lệ'),
];

const componentTypeListValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
    query('status').optional().isIn(COMPONENT_TYPE_LIST_STATUSES).withMessage('Trạng thái loại linh kiện không hợp lệ'),
    query('includeDeleted').optional().isIn(['true', 'false']).withMessage('includeDeleted không hợp lệ'),
    query('buildPcOnly').optional().isIn(['true', 'false']).withMessage('buildPcOnly không hợp lệ'),
    query('productOnly').optional().isIn(['true', 'false']).withMessage('productOnly không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
];

module.exports = {
    componentTypeCodeParamValidation,
    componentTypeListValidation,
    componentTypeStatusUpdateValidation,
    createComponentTypeValidation,
    updateComponentTypeValidation,
};
