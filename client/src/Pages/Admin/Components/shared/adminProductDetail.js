import dayjs from 'dayjs';
import React from 'react';
import { Button } from 'antd';
import { COMPONENT_TYPE_LABELS, getBaseComponentType } from '../../../../constants/componentTypes';

export const PC_CONFIGURATION_FIELDS = ['cpu', 'motherboard', 'ram', 'storage', 'gpu', 'power', 'computerCase', 'cooler'];

export const PC_CONFIGURATION_LABELS = {
    cpu: 'CPU',
    motherboard: 'Mainboard',
    ram: 'RAM',
    storage: 'Ổ cứng',
    gpu: 'Card đồ họa',
    power: 'Nguồn',
    computerCase: 'Case',
    cooler: 'Tản nhiệt',
};

export const getPcConfigurationFormValues = (pcConfiguration = {}) =>
    PC_CONFIGURATION_FIELDS.reduce((accumulator, field) => {
        accumulator[field] = pcConfiguration?.[field] || '';
        return accumulator;
    }, {});

export const getProductTypeLabel = (type = 'pc') => {
    const normalizedType = getBaseComponentType(type || 'pc');
    return COMPONENT_TYPE_LABELS[normalizedType] || normalizedType;
};

export const getProductImageList = (images = '') =>
    String(images || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;

export const formatDateTime = (value) => (value ? dayjs(value).format('HH:mm DD/MM/YYYY') : '---');

export const isDeletedProduct = (product) => Boolean(product?.deletedAt);

export const isInactiveProduct = (product) => product?.status === 'inactive' && !product?.deletedAt;

export const buildProductDetailFooter = (actions = [], onClose, options = {}) => [
    ...actions.filter(Boolean),
    React.createElement(
        Button,
        {
            key: 'close',
            onClick: onClose,
            type: options.closeButtonType || 'default',
            style: options.closeButtonStyle,
            className: options.closeButtonClassName,
        },
        'Đóng',
    ),
];
