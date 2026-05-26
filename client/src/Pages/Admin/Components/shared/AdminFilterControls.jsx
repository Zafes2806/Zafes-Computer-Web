import { AppstoreOutlined, InboxOutlined } from '@ant-design/icons';
import { Input, Select } from 'antd';

const { Search } = Input;

function joinClassNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

function normalizeFilterOptions(options) {
    if (!Array.isArray(options)) {
        return options;
    }

    return options.map((option) => {
        if (!option || typeof option !== 'object' || Array.isArray(option)) {
            return option;
        }

        return {
            ...option,
            label: option.plainLabel ?? option.label,
        };
    });
}

function renderScopeLabel(icon, label) {
    return (
        <span className="admin-scope-option">
            {icon}
            <span>{label}</span>
        </span>
    );
}

export function AdminFilterSelect({ className, size = 'large', options, ...props }) {
    return (
        <Select
            size={size}
            className={joinClassNames('admin-filter-control', className)}
            options={normalizeFilterOptions(options)}
            {...props}
        />
    );
}

export function AdminFilterSearch({ className, size = 'large', ...props }) {
    return (
        <Search
            size={size}
            className={joinClassNames('admin-filter-search', className)}
            allowClear
            {...props}
        />
    );
}

export function AdminScopeSelect({
    className,
    size = 'large',
    managedLabel = 'Đang quản lý',
    trashLabel = 'Thùng rác',
    ...props
}) {
    return (
        <Select
            size={size}
            className={joinClassNames('admin-filter-control', 'admin-filter-control-scope', className)}
            options={[
                {
                    value: 'managed',
                    label: renderScopeLabel(<AppstoreOutlined />, managedLabel),
                },
                {
                    value: 'trash',
                    label: renderScopeLabel(<InboxOutlined />, trashLabel),
                },
            ]}
            {...props}
        />
    );
}

export function AdminWideFilterSelect({ className, size = 'large', options, ...props }) {
    return (
        <Select
            size={size}
            className={joinClassNames('admin-filter-control', 'admin-filter-control-wide', className)}
            options={normalizeFilterOptions(options)}
            {...props}
        />
    );
}
