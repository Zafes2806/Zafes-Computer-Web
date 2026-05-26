const COMPONENT_TYPE_STATUS = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
});

const COMPONENT_TYPE_STATUSES = Object.freeze(Object.values(COMPONENT_TYPE_STATUS));
const COMPONENT_TYPE_LIST_STATUSES = Object.freeze([...COMPONENT_TYPE_STATUSES, 'deleted', 'all']);

function normalizeComponentTypeStatus(status) {
    if (typeof status !== 'string') {
        return COMPONENT_TYPE_STATUS.ACTIVE;
    }

    const normalizedStatus = status.trim().toLowerCase();
    return COMPONENT_TYPE_STATUSES.includes(normalizedStatus) ? normalizedStatus : COMPONENT_TYPE_STATUS.ACTIVE;
}

module.exports = {
    COMPONENT_TYPE_STATUS,
    COMPONENT_TYPE_STATUSES,
    COMPONENT_TYPE_LIST_STATUSES,
    normalizeComponentTypeStatus,
};
