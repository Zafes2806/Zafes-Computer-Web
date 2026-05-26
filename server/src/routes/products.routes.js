const express = require('express');

const { authAdmin, authOptional } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
    createProductValidation,
    updateProductValidation,
    productIdParamValidation,
    updateProductStatusValidation,
    getProductsValidation,
    getProductByIdValidation,
    componentTypeValidation,
    productSearchValidation,
    productSearchByCategoryValidation,
} = require('../validators/product.validator');

const controllerProducts = require('../controllers/products.controller');
const controllerCategory = require('../controllers/category.controller');

const router = express.Router();

router.post('/', authAdmin, createProductValidation, validate, asyncHandler(controllerProducts.createProduct));
router.get('/', authOptional, getProductsValidation, validate, asyncHandler(controllerProducts.getProducts));
router.get('/groups/by-category', asyncHandler(controllerProducts.getProductsByCategories));
router.get(
    '/search/by-category',
    productSearchByCategoryValidation,
    validate,
    asyncHandler(controllerProducts.getProductSearchByCategory),
);
router.get('/search', productSearchValidation, validate, asyncHandler(controllerProducts.getProductSearch));
router.get('/promotions/hot-sale', asyncHandler(controllerProducts.getProductHotSale));
router.get('/by-component-type', componentTypeValidation, validate, asyncHandler(controllerProducts.getProductByComponentType));
router.get('/filter-options', asyncHandler(controllerCategory.getAllProductsWithFilters));
router.get('/:id', authOptional, getProductByIdValidation, validate, asyncHandler(controllerProducts.getProductById));

router.put(
    '/:id',
    authAdmin,
    updateProductValidation,
    validate,
    asyncHandler(controllerProducts.updateProduct),
);

router.patch(
    '/:id',
    authAdmin,
    updateProductStatusValidation,
    validate,
    asyncHandler(controllerProducts.updateProductStatus),
);
router.patch('/:id/restore', authAdmin, productIdParamValidation, validate, asyncHandler(controllerProducts.restoreProduct));
router.delete('/:id', authAdmin, productIdParamValidation, validate, asyncHandler(controllerProducts.deleteProduct));

module.exports = router;
