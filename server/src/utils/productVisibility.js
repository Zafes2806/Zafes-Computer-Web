const { BadRequestError } = require('../core/error.response');
const { CATEGORY_STATUS } = require('../constants/categoryStatus');
const { PRODUCT_STATUS } = require('../constants/productStatus');

function isProductStatusActive(product) {
    return Boolean(product) && !product.deletedAt && (product.status === PRODUCT_STATUS.ACTIVE || product.status == null);
}

function isProductCategorySellable(product) {
    const category = product?.category;

    if (!category) {
        return !product?.categoryId;
    }

    return !category.deletedAt && category.status === CATEGORY_STATUS.ACTIVE;
}

function getProductAvailabilityError(product) {
    if (!product) {
        return 'Không tìm thấy sản phẩm';
    }

    if (product.deletedAt) {
        return 'Sản phẩm hiện không còn kinh doanh';
    }

    if (product.status !== PRODUCT_STATUS.ACTIVE && product.status != null) {
        return 'Sản phẩm hiện đang tạm ngưng kinh doanh';
    }

    if (product.category?.deletedAt) {
        return 'Sản phẩm hiện không còn kinh doanh vì danh mục đã bị xóa';
    }

    if (product.category && product.category.status !== CATEGORY_STATUS.ACTIVE) {
        return 'Sản phẩm hiện đang tạm ngưng kinh doanh vì danh mục đang tạm khóa';
    }

    return null;
}

function isProductActive(product) {
    return isProductStatusActive(product);
}

function isProductSellable(product) {
    return isProductStatusActive(product) && isProductCategorySellable(product);
}

function ensureProductIsActive(product, message = 'Sản phẩm hiện đang tạm ngưng kinh doanh') {
    if (!isProductActive(product)) {
        throw new BadRequestError(message);
    }
}

function ensureProductIsSellable(product, message = null) {
    const availabilityError = getProductAvailabilityError(product);

    if (availabilityError) {
        throw new BadRequestError(message || availabilityError);
    }
}

module.exports = {
    ensureProductIsActive,
    ensureProductIsSellable,
    getProductAvailabilityError,
    isProductActive,
    isProductCategorySellable,
    isProductSellable,
};
