const express = require('express');

const componentTypesController = require('../controllers/componentTypes.controller');
const { authAdmin, authOptional } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
    componentTypeCodeParamValidation,
    componentTypeListValidation,
    componentTypeStatusUpdateValidation,
    createComponentTypeValidation,
    updateComponentTypeValidation,
} = require('../validators/componentType.validator');

const router = express.Router();

router.get('/', authOptional, componentTypeListValidation, validate, asyncHandler(componentTypesController.getAll));
router.post('/', authAdmin, createComponentTypeValidation, validate, asyncHandler(componentTypesController.create));
router.put('/:code', authAdmin, updateComponentTypeValidation, validate, asyncHandler(componentTypesController.update));
router.patch('/:code', authAdmin, componentTypeStatusUpdateValidation, validate, asyncHandler(componentTypesController.updateStatus));
router.delete('/:code', authAdmin, componentTypeCodeParamValidation, validate, asyncHandler(componentTypesController.deleteComponentType));
router.patch('/:code/restore', authAdmin, componentTypeCodeParamValidation, validate, asyncHandler(componentTypesController.restore));

module.exports = router;
