function buildOrderPaymentPath(orderCode) {
    return `/orders/${encodeURIComponent(orderCode)}/payment`;
}

function buildOrderPaymentUrl(clientUrl, orderCode, queryString = '') {
    return `${clientUrl}${buildOrderPaymentPath(orderCode)}${queryString}`;
}

module.exports = {
    buildOrderPaymentPath,
    buildOrderPaymentUrl,
};
