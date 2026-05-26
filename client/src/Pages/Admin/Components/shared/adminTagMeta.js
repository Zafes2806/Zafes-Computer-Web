import { BLOG_STATUS_META, CONTACT_STATUS_META, REVIEW_STATUS_META } from '../../../../constants/adminStatusFlows';
import { ORDER_STATUS_CONFIG } from '../../../../constants/orderStatus';
import { TAG_COLOR } from '../../../../constants/tagPalette';

export const LIFECYCLE_STATUS_META = Object.freeze({
    active: { label: 'Đang hoạt động', color: TAG_COLOR.success },
    inactive: { label: 'Tạm khóa', color: TAG_COLOR.warning },
    deleted: { label: 'Thùng rác', color: TAG_COLOR.danger },
});

export const USER_STATUS_META = Object.freeze({
    active: { label: 'Đang hoạt động', color: TAG_COLOR.success },
    locked: { label: 'Tạm khóa', color: TAG_COLOR.warning },
    deleted: { label: 'Thùng rác', color: TAG_COLOR.danger },
});

export const ROLE_TAG_META = Object.freeze({
    admin: { label: 'Admin', color: TAG_COLOR.info },
    user: { label: 'User', color: TAG_COLOR.secondary },
});

export const AUTH_METHOD_TAG_META = Object.freeze({
    google: { label: 'Google', variant: 'category' },
    email: { label: 'Email', variant: 'info' },
});

export const PAYMENT_ATTEMPT_STATUS_META = Object.freeze({
    pending: { label: 'Chờ thanh toán', color: TAG_COLOR.pending },
    succeeded: { label: 'Đã thanh toán', color: TAG_COLOR.success },
    failed: { label: 'Thất bại', color: TAG_COLOR.warning },
    expired: { label: 'Hết hạn', color: TAG_COLOR.danger },
    requires_refund: { label: 'Cần hoàn tiền', color: TAG_COLOR.emphasis },
    refunded: { label: 'Đã hoàn tiền', color: TAG_COLOR.success },
});

export const ADMIN_STATUS_META_BY_DOMAIN = Object.freeze({
    lifecycle: LIFECYCLE_STATUS_META,
    product: LIFECYCLE_STATUS_META,
    category: LIFECYCLE_STATUS_META,
    componentType: LIFECYCLE_STATUS_META,
    spec: LIFECYCLE_STATUS_META,
    user: USER_STATUS_META,
    contact: CONTACT_STATUS_META,
    blog: BLOG_STATUS_META,
    review: REVIEW_STATUS_META,
    order: ORDER_STATUS_CONFIG,
    paymentAttempt: PAYMENT_ATTEMPT_STATUS_META,
});

const DEFAULT_STATUS_META = Object.freeze({
    label: 'Không xác định',
    color: TAG_COLOR.accent,
});

function resolveStatusInput(valueOrEntity, deletedAt) {
    if (valueOrEntity && typeof valueOrEntity === 'object') {
        return {
            status: valueOrEntity.status,
            deletedAt: valueOrEntity.deletedAt,
        };
    }

    return {
        status: valueOrEntity,
        deletedAt,
    };
}

export function getAdminStatusMeta({ domain = 'lifecycle', status, deletedAt, fallbackLabel } = {}) {
    const metaMap = ADMIN_STATUS_META_BY_DOMAIN[domain] || {};

    if (deletedAt && metaMap.deleted) {
        return metaMap.deleted;
    }

    const normalizedStatus = String(status || '').toLowerCase();
    const resolvedMeta = normalizedStatus ? metaMap[normalizedStatus] : null;

    if (resolvedMeta) {
        return resolvedMeta;
    }

    if (fallbackLabel || status) {
        return {
            label: fallbackLabel || status,
            color: TAG_COLOR.accent,
        };
    }

    return DEFAULT_STATUS_META;
}

function createDomainStatusMetaResolver(domain) {
    return (valueOrEntity, deletedAt) =>
        getAdminStatusMeta({
            domain,
            ...resolveStatusInput(valueOrEntity, deletedAt),
        });
}

export const getLifecycleStatusMeta = createDomainStatusMetaResolver('lifecycle');
export const getProductStatusMeta = createDomainStatusMetaResolver('product');
export const getCategoryStatusMeta = createDomainStatusMetaResolver('category');
export const getSpecStatusMeta = createDomainStatusMetaResolver('spec');
export const getUserStatusMeta = createDomainStatusMetaResolver('user');
export const getContactStatusMeta = createDomainStatusMetaResolver('contact');
export const getBlogStatusMeta = createDomainStatusMetaResolver('blog');
export const getReviewStatusMeta = createDomainStatusMetaResolver('review');
export const getOrderStatusMeta = createDomainStatusMetaResolver('order');

export function getAdminRoleMeta(roleOrUser) {
    if (roleOrUser && typeof roleOrUser === 'object') {
        return roleOrUser.isAdmin ? ROLE_TAG_META.admin : ROLE_TAG_META.user;
    }

    if (typeof roleOrUser === 'boolean') {
        return roleOrUser ? ROLE_TAG_META.admin : ROLE_TAG_META.user;
    }

    const normalizedRole = String(roleOrUser || 'user').toLowerCase();
    return ROLE_TAG_META[normalizedRole] || ROLE_TAG_META.user;
}

export function getAdminAuthMethodMeta(authProvider) {
    const normalizedAuthProvider = String(authProvider || 'email').toLowerCase();
    return AUTH_METHOD_TAG_META[normalizedAuthProvider] || AUTH_METHOD_TAG_META.email;
}

