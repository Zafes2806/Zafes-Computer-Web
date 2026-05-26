const SPEC_DEFINITION_STATUS = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
});

const SPEC_DEFINITION_STATUSES = Object.freeze(Object.values(SPEC_DEFINITION_STATUS));
const SPEC_DEFINITION_LIST_STATUSES = Object.freeze([...SPEC_DEFINITION_STATUSES, 'deleted', 'all']);

function normalizeSpecDefinitionStatus(status) {
    if (typeof status !== 'string') {
        return SPEC_DEFINITION_STATUS.ACTIVE;
    }

    const normalizedStatus = status.trim().toLowerCase();
    return SPEC_DEFINITION_STATUSES.includes(normalizedStatus)
        ? normalizedStatus
        : SPEC_DEFINITION_STATUS.ACTIVE;
}

module.exports = {
    SPEC_DEFINITION_STATUS,
    SPEC_DEFINITION_STATUSES,
    SPEC_DEFINITION_LIST_STATUSES,
    normalizeSpecDefinitionStatus,
};
