import { PaymentTypeTag } from '../../../../Components/AppTag/AppTag';
import { PAYMENT_TYPE_CONFIG } from '../../../../constants/paymentTypes';
import { AdminRoleTag, AdminStatusOptionTag } from './AdminTag';
import { ADMIN_STATUS_META_BY_DOMAIN, getAdminRoleMeta } from './adminTagMeta';

const ADMIN_FILTER_ALL_LABEL = Object.freeze({
    status: 'Tất cả trạng thái',
    role: 'Tất cả vai trò',
    payment: 'Tất cả thanh toán',
    paymentAttempt: 'Tất cả giao dịch',
});

const ADMIN_SYSTEM_STATUS_VALUES = Object.freeze({
    deleted: 'deleted',
});

const ADMIN_STATUS_OPTION_DISPLAY = Object.freeze({
    text: 'text',
    tag: 'tag',
});

const ADMIN_MANAGED_STATUS_VALUES_BY_DOMAIN = Object.freeze({
    lifecycle: ['active', 'inactive'],
    product: ['active', 'inactive'],
    category: ['active', 'inactive'],
    componentType: ['active', 'inactive'],
    spec: ['active', 'inactive'],
    user: ['active', 'locked'],
    contact: ['new', 'contacted', 'resolved', 'archived'],
    blog: ['draft', 'published', 'archived'],
    review: ['pending', 'approved', 'hidden'],
});

function normalizeOptionValues(values, fallbackValues = [], excludeValues = []) {
    const sourceValues = Array.isArray(values) && values.length ? values : fallbackValues;
    const excludedValueSet = new Set(
        excludeValues
            .filter((value) => value !== undefined && value !== null && value !== '')
            .map((value) => String(value)),
    );

    return [
        ...new Set(
            sourceValues.filter((value) => {
                if (value === undefined || value === null || value === '') {
                    return false;
                }

                return !excludedValueSet.has(String(value));
            }),
        ),
    ];
}

function withAllOption(options, includeAll, allLabel) {
    if (!includeAll) {
        return options;
    }

    return [{ value: 'all', label: allLabel, plainLabel: allLabel }, ...options];
}

function getAdminStatusPlainLabel(domain, value) {
    return ADMIN_STATUS_META_BY_DOMAIN[domain]?.[value]?.label || value;
}

function getAdminStatusOptionLabel(domain, value, display) {
    const plainLabel = getAdminStatusPlainLabel(domain, value);

    if (display === ADMIN_STATUS_OPTION_DISPLAY.tag) {
        return <AdminStatusOptionTag domain={domain} status={value} />;
    }

    return plainLabel;
}

function buildAdminStatusOptions({
    domain = 'lifecycle',
    values,
    includeAll = false,
    allLabel = ADMIN_FILTER_ALL_LABEL.status,
    excludeValues = [],
    display = ADMIN_STATUS_OPTION_DISPLAY.text,
} = {}) {
    const fallbackValues = Object.keys(ADMIN_STATUS_META_BY_DOMAIN[domain] || {});
    const normalizedValues = normalizeOptionValues(values, fallbackValues, excludeValues);
    const options = normalizedValues.map((value) => ({
        value,
        plainLabel: getAdminStatusPlainLabel(domain, value),
        label: getAdminStatusOptionLabel(domain, value, display),
    }));

    return withAllOption(options, includeAll, allLabel);
}

function getManagedStatusValues(domain, values) {
    if (Array.isArray(values) && values.length) {
        return values;
    }

    return ADMIN_MANAGED_STATUS_VALUES_BY_DOMAIN[domain];
}

// Keep status option creation explicit by UI context:
// filters/forms render plain text, inline workflow switchers render colored tags.
export function getAdminStatusFilterOptions(options = {}) {
    return buildAdminStatusOptions({
        ...options,
        display: ADMIN_STATUS_OPTION_DISPLAY.text,
    });
}

export function getAdminManagedStatusFilterOptions(options = {}) {
    const excludeValues = Array.isArray(options.excludeValues) ? options.excludeValues : [];
    const managedValues = getManagedStatusValues(options.domain, options.values);

    return buildAdminStatusOptions({
        ...options,
        values: managedValues,
        excludeValues: [...excludeValues, ADMIN_SYSTEM_STATUS_VALUES.deleted],
        display: ADMIN_STATUS_OPTION_DISPLAY.text,
    });
}

export function getAdminStatusFormOptions(options = {}) {
    return buildAdminStatusOptions({
        ...options,
        display: ADMIN_STATUS_OPTION_DISPLAY.text,
    });
}

export function getAdminStatusInlineOptions(options = {}) {
    return buildAdminStatusOptions({
        ...options,
        display: ADMIN_STATUS_OPTION_DISPLAY.tag,
    });
}

function getAdminRolePlainLabel(role) {
    return getAdminRoleMeta(role).label;
}

function getAdminRoleOptionLabel(role, display) {
    const plainLabel = getAdminRolePlainLabel(role);

    if (display === ADMIN_STATUS_OPTION_DISPLAY.tag) {
        return <AdminRoleTag role={role} />;
    }

    return plainLabel;
}

function buildAdminRoleOptions({
    includeAll = false,
    allLabel = ADMIN_FILTER_ALL_LABEL.role,
    mode = 'string',
    display = ADMIN_STATUS_OPTION_DISPLAY.text,
} = {}) {
    const roleOptions =
        mode === 'boolean'
            ? [
                {
                    value: false,
                    plainLabel: getAdminRolePlainLabel('user'),
                    label: getAdminRoleOptionLabel('user', display),
                },
                {
                    value: true,
                    plainLabel: getAdminRolePlainLabel('admin'),
                    label: getAdminRoleOptionLabel('admin', display),
                },
            ]
            : [
                {
                    value: 'admin',
                    plainLabel: getAdminRolePlainLabel('admin'),
                    label: getAdminRoleOptionLabel('admin', display),
                },
                {
                    value: 'user',
                    plainLabel: getAdminRolePlainLabel('user'),
                    label: getAdminRoleOptionLabel('user', display),
                },
            ];

    return withAllOption(roleOptions, includeAll, allLabel);
}

export function getAdminRoleFilterOptions(options = {}) {
    return buildAdminRoleOptions({
        ...options,
        display: ADMIN_STATUS_OPTION_DISPLAY.text,
    });
}

export function getAdminRoleFormOptions(options = {}) {
    return buildAdminRoleOptions({
        ...options,
        display: ADMIN_STATUS_OPTION_DISPLAY.text,
    });
}

export function getAdminPaymentTypeSelectOptions({
    includeAll = false,
    allLabel = ADMIN_FILTER_ALL_LABEL.payment,
    shortLabel = true,
} = {}) {
    const paymentOptions = Object.keys(PAYMENT_TYPE_CONFIG).map((value) => ({
        value,
        plainLabel: shortLabel ? PAYMENT_TYPE_CONFIG[value].shortLabel : PAYMENT_TYPE_CONFIG[value].label,
        label: <PaymentTypeTag type={value} shortLabel={shortLabel} />,
    }));

    return withAllOption(paymentOptions, includeAll, allLabel);
}

export function getAdminPaymentAttemptStatusOptions({
    includeAll = false,
    allLabel = ADMIN_FILTER_ALL_LABEL.paymentAttempt,
} = {}) {
    return buildAdminStatusOptions({
        domain: 'paymentAttempt',
        includeAll,
        allLabel,
        display: ADMIN_STATUS_OPTION_DISPLAY.text,
    });
}
