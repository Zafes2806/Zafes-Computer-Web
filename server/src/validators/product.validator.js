const { body, param, query } = require('express-validator');

const {
    normalizeComponentType,
} = require('../constants/componentTypes');
const { PRODUCT_LIST_STATUSES, PRODUCT_STATUSES } = require('../constants/productStatus');
const { createComponentTypeValidator } = require('./componentTypeExists.validator');
const PRODUCT_SORT_OPTIONS = ['newest', 'price-asc', 'price-desc', 'discount'];
const PC_CONFIGURATION_REQUIRED_FIELDS = ['cpu', 'motherboard', 'ram', 'storage', 'gpu', 'power', 'computerCase', 'cooler'];
const validateActiveProductComponentType = createComponentTypeValidator({
    requireActive: true,
    requireProductType: true,
});

const validateProductIds = (value) => {
    if (!value) {
        return true;
    }

    const productIds = String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    if (productIds.length === 0) {
        return true;
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const hasInvalidId = productIds.some((productId) => !uuidPattern.test(productId));

    if (hasInvalidId) {
        throw new Error('Danh sách mã sản phẩm không hợp lệ');
    }

    return true;
};

const validateSpecFilters = (value) => {
    if (value === undefined || value === null || value === '') {
        return true;
    }

    if (typeof value !== 'string') {
        throw new Error('Bộ lọc thông số không hợp lệ');
    }

    try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error();
        }
    } catch (error) {
        throw new Error('Bộ lọc thông số không hợp lệ');
    }

    return true;
};

const isPcProductRequest = (req) => normalizeComponentType(req.body.componentType) === 'pc';

const baseProductListValidation = [
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
    query('minPrice').optional().isInt({ min: 0 }).withMessage('Giá tối thiểu phải là số không âm').toInt(),
    query('maxPrice').optional().isInt({ min: 0 }).withMessage('Giá tối đa phải là số không âm').toInt(),
    query('sort').optional().isIn(PRODUCT_SORT_OPTIONS).withMessage('Kiểu sắp xếp không hợp lệ'),
    query('productIds').optional().custom(validateProductIds),
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1').toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn mỗi trang phải từ 1 đến 100')
        .toInt(),
];

const baseProductValidation = [
    body('name').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
    body('price').notEmpty().withMessage('Giá sản phẩm không được để trống').bail().isInt({ min: 0 }).withMessage('Giá phải là số nguyên không âm'),
    body('description').trim().notEmpty().withMessage('Mô tả sản phẩm không được để trống'),
    body('images').trim().notEmpty().withMessage('Hình ảnh sản phẩm không được để trống'),
    body('category').notEmpty().withMessage('Danh mục không được để trống').bail().isUUID().withMessage('Danh mục không hợp lệ'),
    body('stock').notEmpty().withMessage('Tồn kho không được để trống').bail().isInt({ min: 0 }).withMessage('Tồn kho phải là số nguyên không âm'),
    body('discount')
        .optional({ nullable: true })
        .isInt({ min: 0, max: 100 })
        .withMessage('Giảm giá phải nằm trong khoảng 0-100'),
    body('componentType')
        .customSanitizer((value) => normalizeComponentType(value))
        .custom(validateActiveProductComponentType),
    body('status')
        .optional()
        .trim()
        .isIn(PRODUCT_STATUSES)
        .withMessage('Trạng thái sản phẩm không hợp lệ'),
    body('pcConfiguration')
        .custom((value, { req }) => {
            if (!isPcProductRequest(req)) {
                return true;
            }

            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                throw new Error('Cấu hình PC không hợp lệ');
            }

            return true;
        }),
    ...PC_CONFIGURATION_REQUIRED_FIELDS.map((field) =>
        body(`pcConfiguration.${field}`)
            .if((value, { req }) => isPcProductRequest(req))
            .trim()
            .notEmpty()
            .withMessage(`Trường pcConfiguration.${field} không được để trống`),
    ),
    body('specs').optional().isArray().withMessage('Thông số kỹ thuật phải là mảng'),
    body('specs.*.specKey').optional().trim().notEmpty().withMessage('Tên thuộc tính không hợp lệ'),
    body('specs.*.specValue').optional().trim().notEmpty().withMessage('Giá trị thuộc tính không hợp lệ'),
];

const createProductValidation = [...baseProductValidation];

const updateProductValidation = [
    param('id').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
    ...baseProductValidation,
];

const productIdParamValidation = [
    param('id').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
];

const updateProductStatusValidation = [
    ...productIdParamValidation,
    body('status')
        .trim()
        .isIn(PRODUCT_STATUSES)
        .withMessage('Trạng thái sản phẩm không hợp lệ'),
];

const getProductsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải lớn hơn hoặc bằng 1'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Giới hạn mỗi trang phải từ 1 đến 500'),
    query('includeDeleted').optional().isBoolean().withMessage('Trạng thái includeDeleted không hợp lệ').toBoolean(),
    query('status').optional().trim().isIn(PRODUCT_LIST_STATUSES).withMessage('Bộ lọc trạng thái sản phẩm không hợp lệ'),
    query('search').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
    query('categoryId').optional().isUUID().withMessage('Mã danh mục không hợp lệ'),
    query('componentType')
        .optional()
        .customSanitizer((value) => normalizeComponentType(value))
        .custom(validateActiveProductComponentType),
    query('stockStatus')
        .optional()
        .isIn(['in_stock', 'low_stock', 'out_of_stock'])
        .withMessage('Bộ lọc tồn kho không hợp lệ'),
];

const getProductByIdValidation = [
    param('id').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
    query('includeDeleted')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái includeDeleted không hợp lệ')
        .toBoolean(),
];

const buildPcCartItemValidation = [
    body('productId').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
    body('quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số lượng phải là số nguyên lớn hơn 0')
        .toInt(),
];

const updateBuildPcCartItemValidation = [
    param('productId').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
    body('quantity')
        .notEmpty()
        .withMessage('Số lượng không được để trống')
        .bail()
        .isInt({ min: 1 })
        .withMessage('Số lượng phải là số nguyên lớn hơn 0')
        .toInt(),
];

const productWatchValidation = [
    body('productId').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
];

const buildPcProductIdValidation = [
    param('productId').isUUID().withMessage('Mã sản phẩm không hợp lệ'),
];

const componentTypeValidation = [
    query('componentType')
        .customSanitizer((value) => normalizeComponentType(value))
        .custom(validateActiveProductComponentType),
];

const productSearchValidation = [...baseProductListValidation];

const productByCategoryValidation = [
    param('id').isUUID().withMessage('Mã danh mục không hợp lệ'),
    ...baseProductListValidation,
];

const productSearchByCategoryValidation = [
    query('category')
        .optional()
        .custom((value) => value === 'all' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
        .withMessage('Danh mục không hợp lệ'),
    query('componentType')
        .optional()
        .customSanitizer((value) => normalizeComponentType(value))
        .custom(validateActiveProductComponentType),
    query('specFilters').optional().custom(validateSpecFilters),
    ...baseProductListValidation,
];

module.exports = {
    createProductValidation,
    updateProductValidation,
    productIdParamValidation,
    updateProductStatusValidation,
    getProductsValidation,
    getProductByIdValidation,
    buildPcCartItemValidation,
    updateBuildPcCartItemValidation,
    productWatchValidation,
    buildPcProductIdValidation,
    componentTypeValidation,
    productSearchValidation,
    productByCategoryValidation,
    productSearchByCategoryValidation,
};
