import { Button, Typography } from 'antd';
import classNames from 'classnames/bind';
import { InboxOutlined } from '@ant-design/icons';
import styles from './EmptyState.module.scss';

const { Text, Title } = Typography;
const cx = classNames.bind(styles);

function EmptyState({ icon, title, description, actions = [], className }) {
    return (
        <div className={cx('empty-state', className)}>
            <div className={cx('icon-wrap')}>
                {icon || <InboxOutlined />}
            </div>
            <div className={cx('content')}>
                <Title level={5} className={cx('title')}>
                    {title}
                </Title>
                {description && (
                    <Text type="secondary" className={cx('description')}>
                        {description}
                    </Text>
                )}
            </div>
            {actions.length > 0 && (
                <div className={cx('actions')}>
                    {actions.map((action) => (
                        <Button
                            key={action.label}
                            type={action.type || 'default'}
                            icon={action.icon}
                            onClick={action.onClick}
                            className={cx('action-button', action.className)}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default EmptyState;
