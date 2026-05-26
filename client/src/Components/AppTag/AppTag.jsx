import { Tag } from 'antd';
import classNames from 'classnames/bind';

import { getOrderStatusConfig } from '../../constants/orderStatus';
import { getPaymentTypeConfig } from '../../constants/paymentTypes';
import { TAG_META_VARIANT_COLOR } from '../../constants/tagPalette';
import styles from './AppTag.module.scss';

const cx = classNames.bind(styles);

export function AppTag({ color, children, className, ...props }) {
    return (
        <Tag color={color} className={cx('tag', className)} {...props}>
            {children}
        </Tag>
    );
}

export function AppMetaTag({ variant = 'info', children, className, ...props }) {
    return (
        <AppTag color={TAG_META_VARIANT_COLOR[variant] || TAG_META_VARIANT_COLOR.info} className={cx('metaTag', className)} {...props}>
            {children}
        </AppTag>
    );
}

export function OrderStatusTag({ status, className, ...props }) {
    const meta = getOrderStatusConfig(status);

    return (
        <AppTag color={meta.color} className={className} {...props}>
            {meta.label}
        </AppTag>
    );
}

export function PaymentTypeTag({ type, shortLabel = false, className, ...props }) {
    const meta = getPaymentTypeConfig(type);

    return (
        <AppTag color={meta.color} className={className} {...props}>
            {shortLabel ? meta.shortLabel : meta.label}
        </AppTag>
    );
}
