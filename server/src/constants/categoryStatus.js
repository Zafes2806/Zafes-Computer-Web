const CATEGORY_STATUS = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
});

const CATEGORY_STATUSES = Object.freeze(Object.values(CATEGORY_STATUS));
const CATEGORY_LIST_STATUSES = Object.freeze([...CATEGORY_STATUSES, 'deleted', 'all']);

function normalizeCategoryStatus(status) {
    if (typeof status !== 'string') {
        return CATEGORY_STATUS.ACTIVE;
    }

    const normalizedStatus = status.trim().toLowerCase();
    return CATEGORY_STATUSES.includes(normalizedStatus) ? normalizedStatus : CATEGORY_STATUS.ACTIVE;
}

module.exports = {
    CATEGORY_STATUS,
    CATEGORY_STATUSES,
    CATEGORY_LIST_STATUSES,
    normalizeCategoryStatus,
};
