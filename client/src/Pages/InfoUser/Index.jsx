import React from 'react';
import { Layout, Menu } from 'antd';
import { UserOutlined, ShoppingOutlined, HeartOutlined, LogoutOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Index.module.scss';
import Header from '../../Components/Header/Header';

// Import các components
import InfoUser from './Components/InfoUser/InfoUser';
import ManagerOrder from './Components/ManagerOrder/ManagerOrder';
import ManagerProductWatch from './Components/ManagerProductWatch/ManagerProductWatch';
import { requestLogout } from '../../api';
import Footer from '../../Components/Footer/Footer';
import { useStore } from '../../hooks/useStore';
// import Wishlist from './Components/Wishlist/Wishlist';
// import History from './Components/History/History';

const { Content, Sider } = Layout;
const cx = classNames.bind(styles);

function Index() {
    const navigate = useNavigate();
    const { clearSession, fetchCategory } = useStore();

    const { pathname } = useLocation();

    const accountPages = {
        '/profile': <InfoUser />,
        '/orders': <ManagerOrder />,
        '/recently-viewed': <ManagerProductWatch />,
    };
    const currentComponent = accountPages[pathname] || accountPages['/profile'];
    const selectedMenuKey = pathname === '/recently-viewed' ? 'recently-viewed' : pathname.slice(1) || 'profile';

    const handleLogout = async () => {
        try {
            await requestLogout();
        } finally {
            clearSession();
            await fetchCategory();
            navigate('/', { replace: true });
        }
    };

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
            onClick: () => navigate('/profile'),
        },
        {
            key: 'orders',
            icon: <ShoppingOutlined />,
            label: 'Đơn hàng của tôi',
            onClick: () => navigate('/orders'),
        },
        {
            key: 'recently-viewed',
            icon: <HeartOutlined />,
            label: 'Sản phẩm đã xem',
            onClick: () => navigate('/recently-viewed'),
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: () => handleLogout('logout'),
        },
    ];

    return (
        <Layout className={cx('wrapper')}>
            <header>
                <Header />
            </header>
            <div className={cx('shell')}>
                <Layout className={cx('account-layout')}>
                    <Sider width={250} theme="light" className={cx('sider')}>
                        <Menu mode="inline" selectedKeys={[selectedMenuKey]} items={menuItems} className={cx('menu')} />
                    </Sider>
                    <Layout className={cx('content-layout')}>
                        <Content className={cx('content')}>{currentComponent}</Content>
                    </Layout>
                </Layout>
            </div>
            <footer>
                <Footer />
            </footer>
        </Layout>
    );
}

export default Index;
