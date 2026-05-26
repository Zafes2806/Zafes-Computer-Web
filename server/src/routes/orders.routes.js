const express = require('express');

const { authCustomer, authOptional, authOptionalCustomer } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const ordersController = require('../controllers/orders.controller');
const validate = require('../middleware/validate');
const {
    checkoutValidation,
    orderCodeParamValidation,
    returnRequestValidation,
    orderListValidation,
} = require('../validators/order.validator');

const router = express.Router();

router.post('/', authOptionalCustomer, checkoutValidation, validate, asyncHandler(ordersController.checkout));
router.get('/', authCustomer, orderListValidation, validate, asyncHandler(ordersController.getUserOrders));
router.get('/:orderCode', authOptional, orderCodeParamValidation, validate, asyncHandler(ordersController.getOrderDetail));
router.post('/:orderCode/payments', authOptional, orderCodeParamValidation, validate, asyncHandler(ordersController.createPaymentRetry));
router.post('/:orderCode/cancellations', authOptional, orderCodeParamValidation, validate, asyncHandler(ordersController.cancelUserOrder));
router.post(
    '/:orderCode/return-requests',
    authCustomer,
    returnRequestValidation,
    validate,
    asyncHandler(ordersController.requestReturnOrder),
);

module.exports = router;

