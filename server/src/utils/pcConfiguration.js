const PC_CONFIGURATION_FIELDS = ['cpu', 'motherboard', 'ram', 'storage', 'gpu', 'power', 'computerCase', 'cooler'];
const PC_CONFIGURATION_ATTRIBUTES = [...PC_CONFIGURATION_FIELDS];

function getPcConfigurationPayload(source = {}) {
    return PC_CONFIGURATION_FIELDS.reduce((payload, field) => {
        const value = source[field];

        if (typeof value === 'string') {
            payload[field] = value.trim() || null;
            return payload;
        }

        payload[field] = value ?? null;
        return payload;
    }, {});
}

function hasPcConfigurationValue(payload = {}) {
    return PC_CONFIGURATION_FIELDS.some((field) => {
        const value = payload[field];
        return value !== null && value !== undefined && value !== '';
    });
}

function getPlainPcConfiguration(pcConfiguration) {
    if (!pcConfiguration) {
        return null;
    }

    const plainPcConfiguration =
        typeof pcConfiguration.toJSON === 'function' ? pcConfiguration.toJSON() : { ...pcConfiguration };

    return getPcConfigurationPayload(plainPcConfiguration);
}

function getPlainProductWithPcConfiguration(product) {
    if (!product) {
        return product;
    }

    const plainProduct = typeof product.toJSON === 'function' ? product.toJSON() : { ...product };

    return {
        ...plainProduct,
        pcConfiguration: getPlainPcConfiguration(plainProduct.pcConfiguration),
    };
}

function getPlainProductsWithPcConfiguration(products = []) {
    return products.map((product) => getPlainProductWithPcConfiguration(product));
}

function buildPcConfigurationInclude(modelPcConfiguration, options = {}) {
    return {
        model: modelPcConfiguration,
        as: 'pcConfiguration',
        attributes: options.attributes || PC_CONFIGURATION_ATTRIBUTES,
        ...(options.required !== undefined ? { required: options.required } : {}),
    };
}

module.exports = {
    PC_CONFIGURATION_FIELDS,
    PC_CONFIGURATION_ATTRIBUTES,
    getPcConfigurationPayload,
    hasPcConfigurationValue,
    getPlainPcConfiguration,
    getPlainProductWithPcConfiguration,
    getPlainProductsWithPcConfiguration,
    buildPcConfigurationInclude,
};
