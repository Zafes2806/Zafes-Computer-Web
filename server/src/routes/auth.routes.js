const express = require('express');

const authController = require('../controllers/auth.controller');
const { authUser } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
    registerValidation,
    loginValidation,
    googleLoginValidation,
    forgotPasswordValidation,
    mergeSessionValidation,
    resetPasswordValidation,
} = require('../validators/user.validator');

const router = express.Router();

router.post('/register', registerValidation, validate, asyncHandler(authController.register));
router.post('/login', loginValidation, validate, asyncHandler(authController.login));
router.post('/google', googleLoginValidation, validate, asyncHandler(authController.loginGoogle));
router.post('/forgot-password', forgotPasswordValidation, validate, asyncHandler(authController.forgotPassword));
router.post('/reset-password', resetPasswordValidation, validate, asyncHandler(authController.resetPassword));
router.get('/me', authUser, asyncHandler(authController.authUser));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/logout', authUser, asyncHandler(authController.logout));
router.post('/merge-session', authUser, mergeSessionValidation, validate, asyncHandler(authController.mergeSession));

module.exports = router;
