import classNames from 'classnames/bind';
import styles from './Index.module.scss';
import './adminShared.scss';
import { Layout, Menu, theme, Avatar, Space, Dropdown, Modal, Form, Input, Spin, message } from 'antd';
import {
    HomeOutlined,
    ShoppingOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    FileOutlined,
    SettingOutlined,
    StarOutlined,
} from '@ant-design/icons';
import { Suspense, lazy, useState } from 'react';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { requestLogout, requestUpdateUser } from '../../api';
import { useStore } from '../../hooks/useStore';
import { AdminRoleTag } from './Components/shared/AdminTag';

const DashBoard = lazy(() => import('./Components/DashBoard/DashBoard'));
const ManagerProduct = lazy(() => import('./Components/ManagerProducts/ManagerProduct'));
const ManagerCategory = lazy(() => import('./Components/ManagerCategory/ManagerCategory'));
const ManagerOrder = lazy(() => import('./Components/ManagerOrder/ManagerOrder'));
const ManagerUser = lazy(() => import('./Components/ManagerUser/ManagerUser'));
const ManagerBlogs = lazy(() => import('./Components/ManagerBlogs/ManagerBlogs'));
const ManagerContact = lazy(() => import('./Components/ManagerContact/ManagerContact'));
const ManagerComponentTypes = lazy(() => import('./Components/ManagerComponentTypes/ManagerComponentTypes'));
const ManagerSpecDefinitions = lazy(() => import('./Components/ManagerSpecDefinitions/ManagerSpecDefinitions'));
const ManagerReviews = lazy(() => import('./Components/ManagerReviews/ManagerReviews'));

const { Header, Sider, Content } = Layout;
const cx = classNames.bind(styles);

const adminContentByKey = {
    home: DashBoard,
    products: ManagerProduct,
    category: ManagerCategory,
    order: ManagerOrder,
    users: ManagerUser,
    blogs: ManagerBlogs,
    contact: ManagerContact,
    componentTypes: ManagerComponentTypes,
    specDefinitions: ManagerSpecDefinitions,
    reviews: ManagerReviews,
};

const DEFAULT_ADMIN_VIEW = 'home';

function Admin() {
    const [collapsed, setCollapsed] = useState(false);
    const { token } = theme.useToken();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [profileForm] = Form.useForm();

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { dataUser, clearSession, fetchAuth, fetchCategory } = useStore();
    const selectedKey = adminContentByKey[searchParams.get('view')] ? searchParams.get('view') : DEFAULT_ADMIN_VIEW;

    const menuItems = [
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: 'Trang chủ',
        },
        {
            key: 'products',
            icon: <ShoppingOutlined />,
            label: 'Quản lý sản phẩm',
        },
        {
            key: 'category',
            icon: <FileOutlined />,
            label: 'Quản lý danh mục',
        },
        {
            key: 'order',
            icon: <ShoppingOutlined />,
            label: 'Quản lý đơn hàng',
        },
        {
            key: 'users',
            icon: <UserOutlined />,
            label: 'Quản lý người dùng',
        },
        {
            key: 'blogs',
            icon: <FileOutlined />,
            label: 'Quản lý bài viết',
        },
        {
            key: 'contact',
            icon: <FileOutlined />,
            label: 'Quản lý liên hệ',
        },
        {
            key: 'reviews',
            icon: <StarOutlined />,
            label: 'Quản lý đánh giá',
        },
        {
            key: 'componentTypes',
            icon: <SettingOutlined />,
            label: 'Quản lý loại linh kiện',
        },
        {
            key: 'specDefinitions',
            icon: <SettingOutlined />,
            label: 'Quản lý thuộc tính linh kiện',
        },
    ];

    const handleUserMenuClick = async ({ key }) => {
        if (key === 'profile') {
            profileForm.setFieldsValue({
                fullName: dataUser?.fullName || '',
                email: dataUser?.email || '',
                phone: dataUser?.phone || '',
                address: dataUser?.address || '',
            });
            setIsProfileModalOpen(true);
            return;
        }

        if (key === 'logout') {
            try {
                await requestLogout();
            } finally {
                clearSession();
                await fetchCategory();
                navigate('/login', { replace: true });
            }
        }
    };

    const handleCloseProfileModal = () => {
        setIsProfileModalOpen(false);
        profileForm.resetFields();
    };

    const handleSaveProfile = async (values) => {
        setIsProfileSaving(true);
        try {
            await requestUpdateUser({
                fullName: values.fullName,
                phone: values.phone,
                address: values.address,
            });
            await fetchAuth();
            message.success('Cập nhật thông tin quản trị thành công');
            setIsProfileModalOpen(false);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể cập nhật thông tin quản trị');
        } finally {
            setIsProfileSaving(false);
        }
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
        },
    ];

    const SelectedAdminContent = adminContentByKey[selectedKey] || DashBoard;
    const contentKey = `${selectedKey}:${location.search}`;
    const navigateAdmin = (view, extraParams = {}) => {
        const nextParams = new URLSearchParams();
        nextParams.set('view', adminContentByKey[view] ? view : DEFAULT_ADMIN_VIEW);

        Object.entries(extraParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                nextParams.set(key, String(value));
            }
        });

        navigate(`/admin?${nextParams.toString()}`);
    };

    return (
        <Layout className={cx('wrapper')}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                style={{
                    background: token.colorPrimary,
                }}
            >
                <div className={cx('logo')}>{collapsed ? 'A' : 'ADMIN'}</div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    onClick={(item) => navigateAdmin(item.key)}
                    style={{
                        background: 'transparent',
                    }}
                />
            </Sider>
            <Layout>
                <Header className={cx('header')}>
                    <button
                        type="button"
                        style={{
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                            fontSize: '16px',
                            color: token.colorTextSecondary,
                        }}
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    </button>
                    <Dropdown
                        menu={{
                            items: userMenuItems,
                            onClick: handleUserMenuClick,
                        }}
                        placement="bottomRight"
                        arrow
                        trigger={['click']}
                    >
                        <button type="button" className={cx('userMenuButton')}>
                            <Space size={12}>
                                <Avatar
                                    size={40}
                                    icon={<UserOutlined />}
                                    style={{
                                        backgroundColor: token.colorPrimary,
                                        flexShrink: 0,
                                    }}
                                />
                                <span className={cx('userName')}>
                                    {dataUser?.fullName || dataUser?.email || 'Quản trị viên'}
                                </span>
                            </Space>
                        </button>
                    </Dropdown>
                </Header>
                <Content className={cx('content')}>
                    <Suspense
                        fallback={(
                            <div style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
                                <Spin size="large" />
                            </div>
                        )}
                    >
                        <SelectedAdminContent key={contentKey} onNavigate={navigateAdmin} />
                    </Suspense>
                </Content>
            </Layout>
            <Modal
                title="Hồ sơ quản trị"
                open={isProfileModalOpen}
                onCancel={handleCloseProfileModal}
                onOk={() => profileForm.submit()}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={isProfileSaving}
                className={cx('profileModal')}
            >
                <div className={cx('profileHeader')}>
                    <Avatar
                        size={56}
                        icon={<UserOutlined />}
                        style={{
                            backgroundColor: token.colorPrimary,
                            flexShrink: 0,
                        }}
                    />
                    <div className={cx('profileHeaderText')}>
                        <div className={cx('profileTitle')}>{dataUser?.fullName || 'Quản trị viên'}</div>
                        <div className={cx('profileSubtitle')}>{dataUser?.email || 'admin@zafescomputer.local'}</div>
                        <AdminRoleTag role="admin" />
                    </div>
                </div>

                <Form form={profileForm} layout="vertical" onFinish={handleSaveProfile}>
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input allowClear placeholder="Nhập họ và tên" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input disabled />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại' },
                            { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' },
                        ]}
                    >
                        <Input allowClear placeholder="Nhập số điện thoại" />
                    </Form.Item>

                    <Form.Item
                        name="address"
                        label="Địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                    >
                        <Input.TextArea allowClear rows={3} placeholder="Nhập địa chỉ" />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}

export default Admin;
