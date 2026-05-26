const express = require('express');

const { authCustomer } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const controllerCart = require('../controllers/cart.controller');
const {
    addToCartValidation,
    updateCartQuantityValidation,
    deleteCartValidation,
} = require('../validators/cart.validator');

const router = express.Router();

router.post('/items', authCustomer, addToCartValidation, validate, asyncHandler(controllerCart.addToCart));

router.get('/items', authCustomer, asyncHandler(controllerCart.getCart));

router.delete(
    '/items/:cartItemId',
    authCustomer,
    deleteCartValidation,
    validate,
    asyncHandler(controllerCart.deleteCart),
);

router.post('/imports/build-pc', authCustomer, asyncHandler(controllerCart.addToCartBuildPC));

router.patch(
    '/items/:cartItemId',
    authCustomer,
    updateCartQuantityValidation,
    validate,
    asyncHandler(controllerCart.updateQuantity),
);

module.exports = router;
