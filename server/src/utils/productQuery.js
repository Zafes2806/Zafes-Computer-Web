const modelCategory = require('../models/category.model');
const modelPcConfiguration = require('../models/pcConfiguration.model');
const { CATEGORY_STATUS } = require('../constants/categoryStatus');
const { buildPcConfigurationInclude } = require('./pcConfiguration');

const PRODUCT_AVAILABILITY_CATEGORY_ATTRIBUTES = ['id', 'name', 'status', 'deletedAt'];

function getProductBaseInclude() {
    return [buildPcConfigurationInclude(modelPcConfiguration)];
}

function getProductAvailabilityCategoryInclude({
    required = false,
    paranoid = false,
    attributes = PRODUCT_AVAILABILITY_CATEGORY_ATTRIBUTES,
} = {}) {
    return {
        model: modelCategory,
        attributes,
        required,
        paranoid,
    };
}

function getSellableCategoryInclude({ required = true, attributes = [] } = {}) {
    return {
        ...getProductAvailabilityCategoryInclude({
            required,
            attributes,
            paranoid: true,
        }),
        where: {
            status: CATEGORY_STATUS.ACTIVE,
        },
    };
}

function getPublicProductBaseInclude({ requiredCategory = true, categoryAttributes = [] } = {}) {
    return [
        ...getProductBaseInclude(),
        getSellableCategoryInclude({
            required: requiredCategory,
            attributes: categoryAttributes,
        }),
    ];
}

function getProductAvailabilityBaseInclude({ requiredCategory = false, categoryAttributes } = {}) {
    return [
        ...getProductBaseInclude(),
        getProductAvailabilityCategoryInclude({
            required: requiredCategory,
            attributes: categoryAttributes,
            paranoid: false,
        }),
    ];
}

module.exports = {
    getProductBaseInclude,
    getProductAvailabilityBaseInclude,
    getProductAvailabilityCategoryInclude,
    getPublicProductBaseInclude,
    getSellableCategoryInclude,
};
