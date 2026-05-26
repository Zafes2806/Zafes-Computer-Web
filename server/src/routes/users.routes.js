const express = require('express');

const userController = require('../controllers/user.controller');
const { authUser, authAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
    createUserValidation,
    updateInfoValidation,
    updateUserValidation,
    userIdValidation,
    getUsersValidation,
} = require('../validators/user.validator');

const router = express.Router();

router.post('/', authAdmin, createUserValidation, validate, asyncHandler(userController.createUser));
router.put('/me', authUser, updateInfoValidation, validate, asyncHandler(userController.updateInfo));
router.get('/', authAdmin, getUsersValidation, validate, asyncHandler(userController.getUsers));
router.patch(
    '/:userId',
    authAdmin,
    updateUserValidation,
    validate,
    asyncHandler(userController.updateUser),
);
router.delete(
    '/:userId',
    authAdmin,
    userIdValidation,
    validate,
    asyncHandler(userController.deleteUser),
);
router.patch(
    '/:userId/restore',
    authAdmin,
    userIdValidation,
    validate,
    asyncHandler(userController.restoreUser),
);

module.exports = router;
