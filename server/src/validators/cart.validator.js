const { body, param } = require('express-validator');

const addToCartValidation = [
    body('productId').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
    body('quantity')
        .notEmpty()
        .withMessage('Số lượng không được để trống')
        .bail()
        .isInt({ min: 1 })
        .withMessage('Số lượng phải là số nguyên lớn hơn 0')
        .toInt(),
];

const updateCartQuantityValidation = [
    param('cartItemId').isUUID().withMessage('Mã sản phẩm trong giỏ hàng không hợp lệ'),
    body('quantity')
        .notEmpty()
        .withMessage('Số lượng không được để trống')
        .bail()
        .isInt({ min: 1 })
        .withMessage('Số lượng phải là số nguyên lớn hơn 0')
        .toInt(),
];

const deleteCartValidation = [
    param('cartItemId').isUUID().withMessage('Mã giỏ hàng không hợp lệ'),
];

module.exports = {
    addToCartValidation,
    updateCartQuantityValidation,
    deleteCartValidation,
};
