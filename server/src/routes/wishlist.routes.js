const express = require('express');

const wishlistController = require('../controllers/wishlist.controller');
const { authCustomer } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { productWatchValidation } = require('../validators/product.validator');

const router = express.Router();

router.post('/', authCustomer, productWatchValidation, validate, asyncHandler(wishlistController.createProductWatch));
router.get('/', authCustomer, asyncHandler(wishlistController.getProductWatch));

module.exports = router;
