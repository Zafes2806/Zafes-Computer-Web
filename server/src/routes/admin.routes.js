const express = require('express');

const dashboardController = require('../controllers/dashboard.controller');
const ordersController = require('../controllers/orders.controller');
const reviewController = require('../controllers/review.controller');
const { authAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
    orderListValidation,
    refundProcessedValidation,
    orderStatusUpdateValidation,
} = require('../validators/order.validator');
const {
    reviewListValidation,
    reviewIdValidation,
    reviewStatusUpdateValidation,
} = require('../validators/review.validator');

const router = express.Router();

router.get('/dashboard', authAdmin, asyncHandler(dashboardController.getDashboardStats));
router.get('/stats/orders', authAdmin, asyncHandler(dashboardController.getOrderStats));
router.get('/stats/charts', authAdmin, asyncHandler(dashboardController.getChartData));

router.get('/orders', authAdmin, orderListValidation, validate, asyncHandler(ordersController.getAdminOrders));
router.patch(
    '/orders/:orderId',
    authAdmin,
    orderStatusUpdateValidation,
    validate,
    asyncHandler(ordersController.updateStatus),
);
router.patch(
    '/payment-attempts/:attemptId/refund',
    authAdmin,
    refundProcessedValidation,
    validate,
    asyncHandler(ordersController.markRefundProcessed),
);

router.get(
    '/reviews',
    authAdmin,
    reviewListValidation,
    validate,
    asyncHandler(reviewController.getAdminReviews),
);
router.delete(
    '/reviews/:id',
    authAdmin,
    reviewIdValidation,
    validate,
    asyncHandler(reviewController.deleteAdminReview),
);
router.patch(
    '/reviews/:id',
    authAdmin,
    reviewStatusUpdateValidation,
    validate,
    asyncHandler(reviewController.updateAdminReviewStatus),
);
router.patch(
    '/reviews/:id/restore',
    authAdmin,
    reviewIdValidation,
    validate,
    asyncHandler(reviewController.restoreAdminReview),
);

module.exports = router;
