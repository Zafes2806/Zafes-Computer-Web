import classNames from 'classnames/bind';

import { AppMetaTag, AppTag } from '../../../../Components/AppTag/AppTag';
import { TAG_COLOR } from '../../../../constants/tagPalette';
import styles from './AdminTag.module.scss';
import {
    getAdminAuthMethodMeta,
    getAdminRoleMeta,
    getAdminStatusMeta,
} from './adminTagMeta';

const cx = classNames.bind(styles);

function getStockTagColor(stock) {
    const normalizedStock = Number(stock || 0);

    if (normalizedStock > 10) {
        return TAG_COLOR.success;
    }

    if (normalizedStock > 5) {
        return TAG_COLOR.warning;
    }

    return TAG_COLOR.danger;
}

export function AdminStatusTag({ domain, status, deletedAt, color, label, children, className, ...props }) {
    const meta = getAdminStatusMeta({
        domain,
        status,
        deletedAt,
        fallbackLabel: label,
    });

    return (
        <AppTag color={color || meta.color} className={className} {...props}>
            {children ?? label ?? meta.label}
        </AppTag>
    );
}

export function AdminStatusOptionTag(props) {
    return <AdminStatusTag {...props} className={cx('statusOptionTag', props.className)} />;
}

export function AdminMetaTag({ variant = 'info', children, className, ...props }) {
    return (
        <AppMetaTag variant={variant} className={cx('metaTag', className)} {...props}>
            {children}
        </AppMetaTag>
    );
}

export function AdminStockTag({ stock, prefix = 'Kho:', className, ...props }) {
    const normalizedPrefix = typeof prefix === 'string' ? prefix.trim() : prefix;

    return (
        <AppTag color={getStockTagColor(stock)} className={cx('metaTag', className)} {...props}>
            {normalizedPrefix ? `${normalizedPrefix} ${stock ?? 0}` : stock ?? 0}
        </AppTag>
    );
}

export function AdminRoleTag({ role, isAdmin, className, ...props }) {
    const meta = getAdminRoleMeta(typeof isAdmin === 'boolean' ? isAdmin : role);

    return (
        <AdminStatusTag color={meta.color} className={className} {...props}>
            {meta.label}
        </AdminStatusTag>
    );
}

export function AdminAuthMethodTag({ authProvider, className, ...props }) {
    const meta = getAdminAuthMethodMeta(authProvider);

    return (
        <AdminMetaTag variant={meta.variant} className={className} {...props}>
            {meta.label}
        </AdminMetaTag>
    );
}

