import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import { useEffect, useState } from 'react';

import { requestGetProductSearch, requestGetProductSearchByCategory, requestLogout } from '../../api';

import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Dropdown } from 'antd';
import {
    UserOutlined,
    ShoppingOutlined,
    LogoutOutlined,
    SearchOutlined,
    PhoneOutlined,
    AppstoreOutlined,
    ShoppingCartOutlined,
} from '@ant-design/icons';
import { getFirstResolvedImage, resolveAssetUrl } from '../../lib/assetUrl';
import {
    createCategoryListPath,
    createProductListPath,
} from '../../utils/productListRoute';

import useDebounce from '../../hooks/useDebounce';

const cx = classNames.bind(styles);

function Header() {
    const { dataUser, dataCart, clearSession, category, fetchCategory } = useStore();
    const isLoggedIn = Boolean(dataUser?.id);

    const Navigate = useNavigate();

    const items = [
        {
            key: '1',
            label: <Link to="/profile">Thông tin tài khoản</Link>,
            icon: <UserOutlined />,
        },
        {
            key: '2',
            label: <Link to="/orders">Đơn hàng của tôi</Link>,
            icon: <ShoppingOutlined />,
        },
        {
            key: '3',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: async () => {
                try {
                    await requestLogout();
                } finally {
                    clearSession();
                    await fetchCategory();
                    setSearch('');
                    setProductSearch([]);
                    Navigate('/', { replace: true });
                }
            },
        },
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    const [search, setSearch] = useState('');

    const debounceSearch = useDebounce(search, 500);
    const [productSearch, setProductSearch] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const getListingParamsFromSelectedCategory = () => {
        if (selectedCategory === 'all') {
            return {};
        }

        return { category: selectedCategory };
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const query = {
                    search: debounceSearch.trim(),
                    page: 1,
                    limit: 10,
                };
                const res = selectedCategory === 'all'
                    ? await requestGetProductSearch(query)
                    : await requestGetProductSearchByCategory({ ...query, category: selectedCategory });
                setProductSearch(Array.isArray(res.metadata) ? res.metadata : []);
            } catch (error) {
                console.error('Error fetching product search suggestions:', error);
                setProductSearch([]);
            }
        };

        if (debounceSearch.trim()) {
            fetchData();
            return;
        }

        setProductSearch([]);
    }, [debounceSearch, selectedCategory]);

    const handleNavigate = () => {
        const keyword = search.trim();

        Navigate(createProductListPath({ ...getListingParamsFromSelectedCategory(), search: keyword }));
        setSearch('');
        setProductSearch([]);
        setIsSearchFocused(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleNavigate();
        }
    };

    const handleSearchItemClick = (itemId) => {
        Navigate(`/products/${itemId}`);
        setSearch('');
        setProductSearch([]);
    };

    const actionLinks = (
        <div className={cx('action-bar')}>
            <Link to="/contact" className={cx('action-item')}>
                <span className={cx('action-icon')}>
                    <PhoneOutlined />
                </span>
                <span className={cx('action-text')}>
                    <small>Tư vấn build</small>
                    <strong>PC</strong>
                </span>
            </Link>

            <Link to="/build-pc" className={cx('action-item')}>
                <span className={cx('action-icon')}>
                    <AppstoreOutlined />
                </span>
                <span className={cx('action-text')}>
                    <small>Xây dựng cấu</small>
                    <strong>hình PC</strong>
                </span>
            </Link>

            <Link to="/cart" className={cx('action-item')}>
                <span className={cx('action-icon')}>
                    <ShoppingCartOutlined />
                </span>
                <span className={cx('action-text')}>
                    <small>Giỏ hàng</small>
                    <strong>({dataCart?.length ?? 0})</strong>
                </span>
            </Link>
        </div>
    );

    return (
        <div className={cx('wrapper')}>
            <div className={cx('topbar')}>
                <div className={cx('topbar-inner')}>
                    <div></div>
                    {!isLoggedIn ? (
                        <div className={cx('auth-strip')}>
                            <UserOutlined />
                            <Link to="/register">Đăng ký</Link>
                            <span>|</span>
                            <Link to="/login">Đăng nhập</Link>
                        </div>
                    ) : (
                        <Dropdown menu={{ items }} placement="bottomRight" arrow>
                            <div className={cx('auth-strip', 'auth-strip-logged')}>
                                <UserOutlined />
                                <span>Xin chào, {dataUser?.fullName || 'Người dùng'}</span>
                            </div>
                        </Dropdown>
                    )}
                </div>
            </div>
            <div className={cx('inner')}>
                <Link to="/">
                    <div>
                        <img src="https://pcmarket.vn/static/assets/2021/images/logo-new.png" alt="Zafes Computer" />
                    </div>
                </Link>

                <div className={cx('search-container')}>
                    <select name="" id="" onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="all">Tất cả danh mục</option>
                        {category.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            setTimeout(() => {
                                setIsSearchFocused(false);
                                setProductSearch([]);
                            }, 200);
                        }}
                    />
                    <button onClick={handleNavigate}>
                        <SearchOutlined />
                    </button>
                    {isSearchFocused && debounceSearch.trim() && (
                        <div className={cx('search-result')}>
                            <ul style={{ width: '100%' }}>
                                {productSearch.length === 0 ? (
                                    <li>Không tìm thấy sản phẩm</li>
                                ) : (
                                    productSearch.map((item) => (
                                        <li key={item.id} onClick={() => handleSearchItemClick(item.id)}>
                                            <img src={getFirstResolvedImage(item.images)} alt="" />
                                            <div>
                                                <h3>{item.name}</h3>
                                                <p>
                                                    {(item.discount
                                                        ? item.price - (item.price * item.discount) / 100
                                                        : item.price
                                                    ).toLocaleString('vi-VN')}{' '}
                                                    VNĐ
                                                </p>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                <div className={cx('user-menu')}>{actionLinks}</div>
            </div>
            <div className={cx('category-list')}>
                {category.map((item) => (
                    <Link key={item.id} to={createCategoryListPath(item)}>
                        <div className={cx('category-item')}>
                            <img src={resolveAssetUrl(item.image)} alt="" />
                            <span>{item.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Header;
