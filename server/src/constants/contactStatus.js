const CONTACT_STATUS = Object.freeze({
    NEW: 'new',
    CONTACTED: 'contacted',
    RESOLVED: 'resolved',
    ARCHIVED: 'archived',
});

const CONTACT_STATUSES = Object.freeze(Object.values(CONTACT_STATUS));
const CONTACT_LIST_STATUSES = Object.freeze([...CONTACT_STATUSES, 'deleted', 'all']);
const CONTACT_STATUS_TRANSITIONS = Object.freeze({
    [CONTACT_STATUS.NEW]: Object.freeze([CONTACT_STATUS.CONTACTED, CONTACT_STATUS.ARCHIVED]),
    [CONTACT_STATUS.CONTACTED]: Object.freeze([CONTACT_STATUS.RESOLVED, CONTACT_STATUS.ARCHIVED]),
    [CONTACT_STATUS.RESOLVED]: Object.freeze([CONTACT_STATUS.CONTACTED, CONTACT_STATUS.ARCHIVED]),
    [CONTACT_STATUS.ARCHIVED]: Object.freeze([CONTACT_STATUS.CONTACTED]),
});

function normalizeContactStatus(status) {
    if (typeof status !== 'string') {
        return CONTACT_STATUS.NEW;
    }

    const normalizedStatus = status.trim().toLowerCase();
    return CONTACT_STATUSES.includes(normalizedStatus) ? normalizedStatus : CONTACT_STATUS.NEW;
}

function getNextContactStatuses(status) {
    return CONTACT_STATUS_TRANSITIONS[status] || [];
}

function getAvailableContactStatuses(status) {
    const normalizedStatus = normalizeContactStatus(status);
    return [normalizedStatus, ...getNextContactStatuses(normalizedStatus)];
}

function canTransitionContactStatus(currentStatus, nextStatus) {
    const normalizedCurrentStatus = normalizeContactStatus(currentStatus);
    const normalizedNextStatus = normalizeContactStatus(nextStatus);

    if (normalizedCurrentStatus === normalizedNextStatus) {
        return true;
    }

    return getNextContactStatuses(normalizedCurrentStatus).includes(normalizedNextStatus);
}

module.exports = {
    CONTACT_STATUS,
    CONTACT_STATUSES,
    CONTACT_LIST_STATUSES,
    CONTACT_STATUS_TRANSITIONS,
    canTransitionContactStatus,
    getAvailableContactStatuses,
    getNextContactStatuses,
    normalizeContactStatus,
};
