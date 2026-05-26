const { body, param, query } = require('express-validator');
const { normalizeComponentType } = require('../constants/componentTypes');
const { createComponentTypeValidator } = require('./componentTypeExists.validator');
const {
    SPEC_DEFINITION_LIST_STATUSES,
    SPEC_DEFINITION_STATUSES,
} = require('../constants/specDefinitionStatus');

const validateSpecComponentType = createComponentTypeValidator({
    allowPc: false,
    requireActive: true,
    requireProductType: true,
});

const definitionPayloadValidation = [
    body('componentType')
        .optional()
        .customSanitizer((value) => normalizeComponentType(value))
        .custom(validateSpecComponentType),
    body('specKey').optional().trim().notEmpty().withMessage('Mã thuộc tính không được để trống'),
    body('label').optional().trim().notEmpty().withMessage('Tên hiển thị không được để trống'),
    body('options').optional().isArray().withMessage('Danh sách giá trị phải là mảng'),
];

const createSpecDefinitionValidation = [
    body('componentType')
        .customSanitizer((value) => normalizeComponentType(value))
        .custom(validateSpecComponentType),
    body('specKey').trim().notEmpty().withMessage('Mã thuộc tính không được để trống'),
    body('label').trim().notEmpty().withMessage('Tên hiển thị không được để trống'),
    body('options').optional().isArray().withMessage('Danh sách giá trị phải là mảng'),
];

const updateSpecDefinitionValidation = [
    param('id').isInt({ min: 1 }).withMessage('Mã thuộc tính không hợp lệ').toInt(),
    ...definitionPayloadValidation,
];

const specDefinitionIdParamValidation = [
    param('id').isInt({ min: 1 }).withMessage('Mã thuộc tính không hợp lệ').toInt(),
];

const specDefinitionStatusUpdateValidation = [
    ...specDefinitionIdParamValidation,
    body('status').trim().isIn(SPEC_DEFINITION_STATUSES).withMessage('Trạng thái thuộc tính không hợp lệ'),
];

const specDefinitionReorderValidation = [
    body('sourceId').isInt({ min: 1 }).withMessage('Thuộc tính nguồn không hợp lệ').toInt(),
    body('targetId').isInt({ min: 1 }).withMessage('Thuộc tính đích không hợp lệ').toInt(),
    body('status')
        .optional()
        .trim()
        .isIn([...SPEC_DEFINITION_STATUSES, 'all'])
        .withMessage('Trạng thái sắp xếp thuộc tính không hợp lệ'),
];

const specDefinitionListValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
    query('componentType')
        .optional()
        .customSanitizer((value) => normalizeComponentType(value))
        .custom(validateSpecComponentType),
    query('status').optional().isIn(SPEC_DEFINITION_LIST_STATUSES).withMessage('Trạng thái thuộc tính không hợp lệ'),
    query('includeDeleted').optional().isIn(['true', 'false']).withMessage('includeDeleted không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
];

module.exports = {
    createSpecDefinitionValidation,
    specDefinitionIdParamValidation,
    specDefinitionListValidation,
    specDefinitionReorderValidation,
    specDefinitionStatusUpdateValidation,
    updateSpecDefinitionValidation,
};
