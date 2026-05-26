import { Button, Space, Tooltip } from 'antd';

function joinClassNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function AdminIconAction({
    title,
    icon,
    variant = 'view',
    className,
    ...props
}) {
    return (
        <Tooltip title={title}>
            <span>
                <Button
                    type="default"
                    icon={icon}
                    aria-label={title}
                    className={joinClassNames('admin-icon-action', `admin-icon-action-${variant}`, className)}
                    {...props}
                />
            </span>
        </Tooltip>
    );
}

export function AdminIconActionGroup({ className, size = 0, children, ...props }) {
    return (
        <Space
            size={size}
            className={joinClassNames('admin-action-group', 'admin-action-group-icons', className)}
            {...props}
        >
            {children}
        </Space>
    );
}
