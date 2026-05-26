const USER_STATUS = Object.freeze({
    ACTIVE: 'active',
    LOCKED: 'locked',
});

const USER_STATUSES = Object.freeze(Object.values(USER_STATUS));
const USER_LIST_STATUSES = Object.freeze([...USER_STATUSES, 'deleted', 'all']);

function normalizeUserStatus(status) {
    if (typeof status !== 'string') {
        return USER_STATUS.ACTIVE;
    }

    const normalizedStatus = status.trim().toLowerCase();
    return USER_STATUSES.includes(normalizedStatus) ? normalizedStatus : USER_STATUS.ACTIVE;
}

module.exports = {
    USER_STATUS,
    USER_STATUSES,
    USER_LIST_STATUSES,
    normalizeUserStatus,
};
