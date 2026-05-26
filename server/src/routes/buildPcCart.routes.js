const express = require('express');

const buildPcCartController = require('../controllers/buildPcCart.controller');
const cartController = require('../controllers/cart.controller');
const { authCustomer } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
    buildPcCartItemValidation,
    updateBuildPcCartItemValidation,
    buildPcProductIdValidation,
} = require('../validators/product.validator');

const router = express.Router();

router.post('/items', authCustomer, buildPcCartItemValidation, validate, asyncHandler(buildPcCartController.createItem));
router.get('/items', authCustomer, asyncHandler(buildPcCartController.getItems));
router.patch(
    '/items/by-product/:productId',
    authCustomer,
    updateBuildPcCartItemValidation,
    validate,
    asyncHandler(buildPcCartController.updateQuantity),
);
router.delete(
    '/items/by-product/:productId',
    authCustomer,
    buildPcProductIdValidation,
    validate,
    asyncHandler(buildPcCartController.deleteItem),
);
router.delete('/items', authCustomer, asyncHandler(cartController.deleteAllCartBuildPC));

module.exports = router;
