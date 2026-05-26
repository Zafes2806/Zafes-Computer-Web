const express = require('express');

const reviewController = require('../controllers/review.controller');
const { authCustomer } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
    reviewCreateValidation,
    reviewUpdateValidation,
} = require('../validators/review.validator');

const router = express.Router();

router.post(
    '/',
    authCustomer,
    reviewCreateValidation,
    validate,
    asyncHandler(reviewController.createReview),
);

router.patch(
    '/:id',
    authCustomer,
    reviewUpdateValidation,
    validate,
    asyncHandler(reviewController.updateMyReview),
);

router.get('/', authCustomer, asyncHandler(reviewController.getMyReviews));

module.exports = router;
