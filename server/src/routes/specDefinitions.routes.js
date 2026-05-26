const express = require('express');

const { authAdmin, authOptional } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const specDefinitionsController = require('../controllers/specDefinitions.controller');
const {
    createSpecDefinitionValidation,
    specDefinitionIdParamValidation,
    specDefinitionListValidation,
    specDefinitionReorderValidation,
    specDefinitionStatusUpdateValidation,
    updateSpecDefinitionValidation,
} = require('../validators/specDefinition.validator');

const router = express.Router();

router.get('/', authOptional, specDefinitionListValidation, validate, asyncHandler(specDefinitionsController.getAll));
router.post('/', authAdmin, createSpecDefinitionValidation, validate, asyncHandler(specDefinitionsController.create));
router.patch('/reorder', authAdmin, specDefinitionReorderValidation, validate, asyncHandler(specDefinitionsController.reorderSpecDefinitions));
router.put('/:id', authAdmin, updateSpecDefinitionValidation, validate, asyncHandler(specDefinitionsController.update));
router.patch('/:id', authAdmin, specDefinitionStatusUpdateValidation, validate, asyncHandler(specDefinitionsController.updateStatus));
router.delete('/:id', authAdmin, specDefinitionIdParamValidation, validate, asyncHandler(specDefinitionsController.deleteSpecDefinition));
router.patch('/:id/restore', authAdmin, specDefinitionIdParamValidation, validate, asyncHandler(specDefinitionsController.restoreSpecDefinition));

module.exports = router;
