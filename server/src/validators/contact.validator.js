const { body, param, query } = require('express-validator');
const { CONTACT_LIST_STATUSES, CONTACT_STATUSES } = require('../constants/contactStatus');

const validateContactSelections = (_, { req }) => {
    const purchaseIntent = req.body.purchaseIntent ?? req.body.option1;
    const purpose = req.body.purpose ?? req.body.option2;
    const budget = req.body.budget ?? req.body.option3;
    const deliveryOption = req.body.deliveryOption ?? req.body.option4;

    if (!purchaseIntent || !purpose || !budget || !deliveryOption) {
        throw new Error('Vui lòng nhập đầy đủ thông tin');
    }

    return true;
};

const createContactValidation = [
    body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống'),
    body('phone')
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage('Số điện thoại phải bắt đầu bằng số 0 và đủ 10 số'),
    body().custom(validateContactSelections),
];

const updateContactValidation = [
    param('id').isUUID().withMessage('Mã liên hệ không hợp lệ'),
    body('status').optional().trim().isIn(CONTACT_STATUSES).withMessage('Trạng thái liên hệ không hợp lệ'),
    body('adminNote').optional({ nullable: true }).isString().withMessage('Ghi chú xử lý không hợp lệ'),
    body().custom((_, { req }) => {
        if (req.body.status === undefined && req.body.adminNote === undefined) {
            throw new Error('Cần ít nhất một trường để cập nhật');
        }

        return true;
    }),
];

const getContactsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
    query('status').optional().isIn(CONTACT_LIST_STATUSES).withMessage('Trạng thái liên hệ không hợp lệ'),
    query('includeDeleted').optional().isIn(['true', 'false']).withMessage('includeDeleted không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
    query('startDate').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('endDate').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
];

const contactIdParamValidation = [
    param('id').isUUID().withMessage('Mã liên hệ không hợp lệ'),
];

module.exports = {
    contactIdParamValidation,
    createContactValidation,
    getContactsValidation,
    updateContactValidation,
};
