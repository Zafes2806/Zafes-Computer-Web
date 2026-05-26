const express = require('express');

const { authAdmin, authOptional } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const controllerCategory = require('../controllers/category.controller');
const controllerProducts = require('../controllers/products.controller');
const {
    categoryIdParamValidation,
    categoryListValidation,
    categoryStatusUpdateValidation,
    createCategoryValidation,
    updateCategoryValidation,
} = require('../validators/category.validator');
const { productByCategoryValidation } = require('../validators/product.validator');

const router = express.Router();

router.post('/', authAdmin, createCategoryValidation, validate, asyncHandler(controllerCategory.createCategory));
router.get('/', authOptional, categoryListValidation, validate, asyncHandler(controllerCategory.getAllCategory));

router.patch(
    '/:id',
    authAdmin,
    categoryStatusUpdateValidation,
    validate,
    asyncHandler(controllerCategory.updateCategoryStatus),
);
router.delete('/:id', authAdmin, categoryIdParamValidation, validate, asyncHandler(controllerCategory.deleteCategory));
router.patch('/:id/restore', authAdmin, categoryIdParamValidation, validate, asyncHandler(controllerCategory.restoreCategory));

router.put('/:id', authAdmin, updateCategoryValidation, validate, asyncHandler(controllerCategory.updateCategory));

router.get('/component-filters', asyncHandler(controllerCategory.getCategoryByComponentTypes));
router.get('/:id/availability', categoryIdParamValidation, validate, asyncHandler(controllerCategory.getCategoryAvailability));
router.get(
    '/:id/products',
    productByCategoryValidation,
    validate,
    asyncHandler(controllerProducts.getProductByIdCategory),
);

module.exports = router;
