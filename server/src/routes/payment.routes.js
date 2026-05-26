const express = require('express');

const paymentController = require('../controllers/payment.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/momo/return', asyncHandler(paymentController.handleMomoReturn));
router.post('/momo/ipn', asyncHandler(paymentController.handleMomoIpn));
router.get('/vnpay/return', asyncHandler(paymentController.handleVnpayReturn));

module.exports = router;
