const BLOG_STATUS = Object.freeze({
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
});

const BLOG_STATUSES = Object.freeze(Object.values(BLOG_STATUS));
const BLOG_LIST_STATUSES = Object.freeze([...BLOG_STATUSES, 'deleted', 'all']);
const BLOG_STATUS_TRANSITIONS = Object.freeze({
    [BLOG_STATUS.DRAFT]: Object.freeze([BLOG_STATUS.PUBLISHED, BLOG_STATUS.ARCHIVED]),
    [BLOG_STATUS.PUBLISHED]: Object.freeze([BLOG_STATUS.DRAFT, BLOG_STATUS.ARCHIVED]),
    [BLOG_STATUS.ARCHIVED]: Object.freeze([BLOG_STATUS.DRAFT]),
});

function normalizeBlogStatus(status) {
    if (typeof status !== 'string') {
        return BLOG_STATUS.DRAFT;
    }

    const normalizedStatus = status.trim().toLowerCase();
    return BLOG_STATUSES.includes(normalizedStatus) ? normalizedStatus : BLOG_STATUS.DRAFT;
}

function getNextBlogStatuses(status) {
    return BLOG_STATUS_TRANSITIONS[status] || [];
}

function getAvailableBlogStatuses(status) {
    const normalizedStatus = normalizeBlogStatus(status);
    return [normalizedStatus, ...getNextBlogStatuses(normalizedStatus)];
}

function canTransitionBlogStatus(currentStatus, nextStatus) {
    const normalizedCurrentStatus = normalizeBlogStatus(currentStatus);
    const normalizedNextStatus = normalizeBlogStatus(nextStatus);

    if (normalizedCurrentStatus === normalizedNextStatus) {
        return true;
    }

    return getNextBlogStatuses(normalizedCurrentStatus).includes(normalizedNextStatus);
}

module.exports = {
    BLOG_STATUS,
    BLOG_STATUSES,
    BLOG_LIST_STATUSES,
    BLOG_STATUS_TRANSITIONS,
    canTransitionBlogStatus,
    getAvailableBlogStatuses,
    getNextBlogStatuses,
    normalizeBlogStatus,
};
