const PRODUCT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

const PRODUCT_STATUSES = Object.values(PRODUCT_STATUS);
const PRODUCT_LIST_STATUSES = [...PRODUCT_STATUSES, 'deleted', 'all'];

function normalizeProductStatus(status) {
    if (typeof status !== 'string') {
        return PRODUCT_STATUS.ACTIVE;
    }

    const normalizedStatus = status.trim().toLowerCase();
    return PRODUCT_STATUSES.includes(normalizedStatus) ? normalizedStatus : PRODUCT_STATUS.ACTIVE;
}

function isVisibleProductStatus(status) {
    return normalizeProductStatus(status) === PRODUCT_STATUS.ACTIVE;
}

module.exports = {
    PRODUCT_STATUS,
    PRODUCT_STATUSES,
    PRODUCT_LIST_STATUSES,
    normalizeProductStatus,
    isVisibleProductStatus,
};
