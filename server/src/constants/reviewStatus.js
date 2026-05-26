const REVIEW_STATUS = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    HIDDEN: 'hidden',
});

const REVIEW_STATUSES = Object.freeze(Object.values(REVIEW_STATUS));
const REVIEW_LIST_STATUSES = Object.freeze([...REVIEW_STATUSES, 'deleted', 'all']);
const REVIEW_STATUS_TRANSITIONS = Object.freeze({
    [REVIEW_STATUS.PENDING]: Object.freeze([REVIEW_STATUS.APPROVED, REVIEW_STATUS.HIDDEN]),
    [REVIEW_STATUS.APPROVED]: Object.freeze([REVIEW_STATUS.HIDDEN]),
    [REVIEW_STATUS.HIDDEN]: Object.freeze([REVIEW_STATUS.APPROVED]),
});

function normalizeReviewStatus(status) {
    if (typeof status !== 'string') {
        return REVIEW_STATUS.PENDING;
    }

    const normalizedStatus = status.trim().toLowerCase();
    return REVIEW_STATUSES.includes(normalizedStatus) ? normalizedStatus : REVIEW_STATUS.PENDING;
}

function getNextReviewStatuses(status) {
    return REVIEW_STATUS_TRANSITIONS[status] || [];
}

function getAvailableReviewStatuses(status) {
    const normalizedStatus = normalizeReviewStatus(status);
    return [normalizedStatus, ...getNextReviewStatuses(normalizedStatus)];
}

function canTransitionReviewStatus(currentStatus, nextStatus) {
    const normalizedCurrentStatus = normalizeReviewStatus(currentStatus);
    const normalizedNextStatus = normalizeReviewStatus(nextStatus);

    if (normalizedCurrentStatus === normalizedNextStatus) {
        return true;
    }

    return getNextReviewStatuses(normalizedCurrentStatus).includes(normalizedNextStatus);
}

module.exports = {
    REVIEW_STATUS,
    REVIEW_STATUSES,
    REVIEW_LIST_STATUSES,
    REVIEW_STATUS_TRANSITIONS,
    canTransitionReviewStatus,
    getAvailableReviewStatuses,
    getNextReviewStatuses,
    normalizeReviewStatus,
};
