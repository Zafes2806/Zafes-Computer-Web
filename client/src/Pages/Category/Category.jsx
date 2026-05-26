import { useState, useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames/bind';
import { Layout, Row, Col, Card, Input, Slider, Select, Empty, Spin, Pagination } from 'antd';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import styles from './Category.module.scss';
import Header from '../../Components/Header/Header';
import {
    requestGetCategoryAvailabilityPublic,
    requestGetProductCategory,
    requestGetProductSearchByCategory,
} from '../../api';
import { getComponentTypeMeta } from '../../constants/componentTypes';
import { useComponentTypes } from '../../hooks/useComponentTypes';
import CardBody from '../../Components/CardBody/CardBody';
import Footer from '../../Components/Footer/Footer';
import CategoryComponentFilter from '../../Components/CategoryComponentFilter/CategoryComponentFilter';
import NotFound from '../NotFound/NotFound';
import { createProductListPath, isComponentCatalogCategory } from '../../utils/productListRoute';
import { useStore } from '../../hooks/useStore';

const { Content } = Layout;
const { Search } = Input;
const cx = classNames.bind(styles);

const DEFAULT_PRICE_RANGE = [0, 100000000];
const CATEGORY_AVAILABILITY = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DELETED: 'deleted',
};

function createInitialFilters(search = '') {
    return {
        search,
        priceRange: [...DEFAULT_PRICE_RANGE],
        componentIds: [],
        specFilters: {},
        sort: 'newest',
    };
}

function getUnavailableCopy(categoryAvailability) {
    if (categoryAvailability?.availability === CATEGORY_AVAILABILITY.DELETED) {
        return {
            eyebrow: 'Danh mục đã ngừng hiển thị',
            title: 'Danh mục không còn khả dụng',
            description: 'Danh mục này đã được gỡ khỏi trang bán hàng. Bạn vẫn có thể xem các nhóm sản phẩm đang hoạt động khác.',
        };
    }

    return {
        eyebrow: 'Danh mục đang tạm khóa',
        title: 'Danh mục hiện chưa khả dụng',
        description: 'Danh mục này đang tạm ngừng hiển thị. Các sản phẩm trong danh mục sẽ xuất hiện lại khi danh mục được kích hoạt.',
    };
}

function CategoryUnavailableState({ categoryAvailability, fallbackName }) {
    const copy = getUnavailableCopy(categoryAvailability);
    const categoryName = categoryAvailability?.name || fallbackName;

    return (
        <section className={cx('unavailable-state')}>
            <nav className={cx('breadcrumb')} aria-label="Điều hướng danh mục">
                <Link to="/">Trang chủ</Link>
                <span>/</span>
                <strong>{categoryName}</strong>
            </nav>

            <div className={cx('unavailable-panel')}>
                <div className={cx('unavailable-copy')}>
                    <p className={cx('eyebrow')}>{copy.eyebrow}</p>
                    <h1>{copy.title}</h1>
                    <p>{copy.description}</p>

                    <div className={cx('unavailable-actions')}>
                        <Link to="/" className={cx('secondary-action')}>
                            Về trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ProductListing() {
    const { category } = useStore();
    const { componentTypes } = useComponentTypes({ buildPcOnly: true });
    const { id: categoryParam = '', componentType: componentTypeParam = '' } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const routeSearch = searchParams.get('search') || '';
    const isComponentRoute = Boolean(componentTypeParam);
    const routeCategory = isComponentRoute ? searchParams.get('category') || '' : categoryParam || '';
    const routeComponentType = componentTypeParam;
    const routeSearchRef = useRef(routeSearch);
    routeSearchRef.current = routeSearch;
    const componentTypeValues = useMemo(() => componentTypes.map((item) => item.value), [componentTypes]);
    const activeComponentType = componentTypeValues.includes(routeComponentType) ? routeComponentType : '';
    const activeCategoryId = routeCategory && routeCategory !== 'all' ? routeCategory : '';
    const [categoryAvailability, setCategoryAvailability] = useState(null);
    const activeCategoryItem = category.find((item) => item.id === activeCategoryId);
    const isComponentCategoryPage = isComponentCatalogCategory(activeCategoryItem?.name);
    const activeComponentMeta = componentTypes.find((item) => item.value === activeComponentType)
        || getComponentTypeMeta(activeComponentType);
    const isComponentPage = Boolean(activeComponentType) || isComponentCategoryPage;
    const isInvalidComponentRoute = isComponentRoute && !activeComponentType;
    const requiresCategoryValidation = Boolean(activeCategoryId);
    const categoryDisplayName = activeCategoryItem?.name || categoryAvailability?.name || 'Danh mục sản phẩm';
    const componentCatalogName = activeCategoryItem?.name || 'Linh kiện máy tính';
    const showCategoryHero = Boolean(activeCategoryId && !isComponentPage);
    const showProductListingHero = !showCategoryHero && !isComponentPage;
    const productListingBreadcrumb = routeSearch ? `Tìm kiếm "${routeSearch}"` : 'Sản phẩm';
    const shouldValidateCategoryRoute = Boolean(activeCategoryId && !isComponentRoute);

    const [allProducts, setAllProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isServerPagination, setIsServerPagination] = useState(false);
    const [routeStatus, setRouteStatus] = useState(() => (requiresCategoryValidation ? 'checking' : 'ready'));
    const [filters, setFilters] = useState(() => createInitialFilters(routeSearch));
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 25,
    });
    const fetchRequestRef = useRef(0);
    const currentPage = pagination.current;
    const currentPageSize = pagination.pageSize;

    useEffect(() => {
        setCategoryAvailability(null);
        setFilters(createInitialFilters(routeSearchRef.current));
        setTotalProducts(0);
        setIsServerPagination(false);
        setRouteStatus(shouldValidateCategoryRoute ? 'checking' : 'ready');
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [activeCategoryId, activeComponentType, shouldValidateCategoryRoute]);

    useEffect(() => {
        if (!shouldValidateCategoryRoute) {
            setCategoryAvailability(null);
            setRouteStatus('ready');
            return undefined;
        }

        let isMounted = true;

        const fetchCategoryAvailability = async () => {
            setRouteStatus('checking');

            try {
                const res = await requestGetCategoryAvailabilityPublic(activeCategoryId);
                const nextAvailability = res?.metadata || null;

                if (!isMounted) {
                    return;
                }

                setCategoryAvailability(nextAvailability);

                if (nextAvailability?.availability !== CATEGORY_AVAILABILITY.ACTIVE) {
                    setRouteStatus('unavailable');
                    return;
                }

                setRouteStatus('ready');
            } catch {
                if (!isMounted) {
                    return;
                }

                setCategoryAvailability(null);
                setRouteStatus('not-found');
            }
        };

        fetchCategoryAvailability();

        return () => {
            isMounted = false;
        };
    }, [activeCategoryId, shouldValidateCategoryRoute]);

    useEffect(() => {
        setFilters((prev) => {
            if (prev.search === routeSearch) {
                return prev;
            }
            return { ...prev, search: routeSearch };
        });
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [activeCategoryId, activeComponentType, routeSearch]);

    const sortOptions = [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'price-asc', label: 'Giá tăng dần' },
        { value: 'price-desc', label: 'Giá giảm dần' },
        { value: 'discount', label: 'Khuyến mãi' },
    ];

    const shouldRequestServerPagination = isComponentPage || Boolean(activeCategoryId);
    const paginationDependency = shouldRequestServerPagination ? `${currentPage}-${currentPageSize}` : 'local';

    useEffect(() => {
        if (routeStatus !== 'ready' || isInvalidComponentRoute) {
            return;
        }

        window.scrollTo(0, 0);

        const fetchData = async () => {
            const requestId = fetchRequestRef.current + 1;
            fetchRequestRef.current = requestId;
            setLoading(true);

            try {
                const params = {
                    search: filters.search,
                    minPrice: filters.priceRange[0],
                    maxPrice: filters.priceRange[1],
                    sort: filters.sort,
                };

                if (shouldRequestServerPagination) {
                    params.page = currentPage;
                    params.limit = currentPageSize;
                }

                if (filters.componentIds.length > 0) {
                    params.productIds = filters.componentIds.join(',');
                }

                if (isComponentPage) {
                    if (activeComponentType) {
                        const hasSpecFilters = Object.values(filters.specFilters || {}).some((values) => values.length > 0);
                        const res = await requestGetProductSearchByCategory({
                            ...params,
                            category: activeCategoryId || 'all',
                            componentType: activeComponentType,
                            specFilters: hasSpecFilters ? JSON.stringify(filters.specFilters) : undefined,
                        });
                        if (requestId !== fetchRequestRef.current) return;

                        const products = Array.isArray(res.metadata) ? res.metadata : [];
                        setAllProducts(products);
                        setTotalProducts(res.pagination?.totalItems ?? products.length);
                        setIsServerPagination(Boolean(res.pagination));
                        return;
                    }

                    const res = await requestGetProductCategory({ ...params, id: activeCategoryId });
                    if (requestId !== fetchRequestRef.current) return;
                    const products = Array.isArray(res.metadata) ? res.metadata : res.metadata.products || [];
                    setAllProducts(products);
                    setTotalProducts(res.pagination?.totalItems ?? products.length);
                    setIsServerPagination(Boolean(res.pagination));
                    setRouteStatus('ready');
                    return;
                }

                if (!activeCategoryId) {
                    const res = await requestGetProductSearchByCategory({
                        ...params,
                        category: 'all',
                    });
                    if (requestId !== fetchRequestRef.current) return;
                    const products = Array.isArray(res.metadata) ? res.metadata : [];
                    setAllProducts(products);
                    setTotalProducts(res.pagination?.totalItems ?? products.length);
                    setIsServerPagination(Boolean(res.pagination));
                    setRouteStatus('ready');
                    return;
                }

                const res = await requestGetProductCategory({ ...params, id: activeCategoryId });
                if (requestId !== fetchRequestRef.current) return;
                const products = Array.isArray(res.metadata) ? res.metadata : res.metadata.products || [];
                setAllProducts(products);
                setTotalProducts(res.pagination?.totalItems ?? products.length);
                setIsServerPagination(Boolean(res.pagination));
                setRouteStatus('ready');
            } catch (error) {
                if (requestId !== fetchRequestRef.current) return;

                if (requiresCategoryValidation && error?.response?.status === 404) {
                    setAllProducts([]);
                    setTotalProducts(0);
                    setRouteStatus('not-found');
                    return;
                }

                console.error('Error fetching products:', error);
                setAllProducts([]);
                setTotalProducts(0);
                setRouteStatus('ready');
            } finally {
                if (requestId === fetchRequestRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [
        activeComponentType,
        activeCategoryId,
        currentPage,
        currentPageSize,
        filters,
        isComponentPage,
        isInvalidComponentRoute,
        paginationDependency,
        requiresCategoryValidation,
        routeStatus,
        shouldRequestServerPagination,
    ]);

    const paginatedProducts = useMemo(() => {
        if (isServerPagination) {
            return allProducts;
        }

        const startIndex = (currentPage - 1) * currentPageSize;
        const endIndex = startIndex + currentPageSize;
        return allProducts.slice(startIndex, endIndex);
    }, [allProducts, currentPage, currentPageSize, isServerPagination]);

    const hasActiveFilters = filters.search.trim()
        || filters.componentIds.length > 0
        || Object.values(filters.specFilters || {}).some((values) => values.length > 0)
        || filters.priceRange[0] !== DEFAULT_PRICE_RANGE[0]
        || filters.priceRange[1] !== DEFAULT_PRICE_RANGE[1];
    const emptyProductDescription = activeCategoryId && !hasActiveFilters
        ? 'Danh mục chưa có sản phẩm nào'
        : 'Không tìm thấy sản phẩm nào';

    if (routeStatus === 'not-found' || isInvalidComponentRoute) {
        return <NotFound />;
    }

    const handleFilterUpdate = (partialFilters) => {
        setFilters((prev) => ({
            ...prev,
            ...partialFilters,
        }));
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleSearchSubmit = (value) => {
        const nextSearch = value.trim();
        handleFilterUpdate({ search: nextSearch });

        const nextParams = new URLSearchParams(searchParams);
        if (nextSearch) {
            nextParams.set('search', nextSearch);
        } else {
            nextParams.delete('search');
        }
        setSearchParams(nextParams, { replace: true });
    };

    const handleSpecFilterChange = (specFilters) => {
        handleFilterUpdate({ specFilters, componentIds: [] });
    };

    const handleComponentPartChange = (productIds) => {
        handleFilterUpdate({ componentIds: productIds });
    };

    const buildComponentTabPath = (componentType) => {
        return createProductListPath({
            category: activeCategoryId,
            componentType,
            search: routeSearch || undefined,
        });
    };

    const buildComponentCatalogPath = () => {
        if (activeCategoryId) {
            return createProductListPath({
                category: activeCategoryId,
                search: routeSearch || undefined,
            });
        }

        return createProductListPath({
            search: routeSearch || undefined,
        });
    };

    const handlePageChange = (page, pageSize) => {
        setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize,
        }));
        window.scrollTo(0, 0);
    };

    return (
        <Layout className={cx('wrapper')}>
            <Header />
            <Content className={cx('content')}>
                {routeStatus === 'unavailable' ? (
                    <CategoryUnavailableState
                        categoryAvailability={categoryAvailability}
                        fallbackName={categoryDisplayName}
                    />
                ) : (
                    <>
                        {showCategoryHero && (
                            <section className={cx('category-hero')}>
                                <nav className={cx('breadcrumb')} aria-label="Điều hướng danh mục">
                                    <Link to="/">Trang chủ</Link>
                                    <span>/</span>
                                    <strong>{categoryDisplayName}</strong>
                                </nav>

                                <div className={cx('category-hero-main')}>
                                    <div className={cx('category-hero-copy')}>
                                        <h1>{categoryDisplayName}</h1>
                                    </div>
                                </div>
                            </section>
                        )}

                        {showProductListingHero && (
                            <section className={cx('category-hero')}>
                                <nav className={cx('breadcrumb')} aria-label="Điều hướng sản phẩm">
                                    <Link to="/">Trang chủ</Link>
                                    <span>&gt;</span>
                                    <strong>{productListingBreadcrumb}</strong>
                                </nav>
                            </section>
                        )}

                        {isComponentPage && (
                            <section className={cx('component-hero')}>
                                <nav className={cx('breadcrumb', 'breadcrumb-compact')} aria-label="Điều hướng linh kiện">
                                    <Link to="/">Trang chủ</Link>
                                    <span>/</span>
                                    {activeComponentType ? (
                                        <>
                                            <Link to={buildComponentCatalogPath()}>{componentCatalogName}</Link>
                                            <span>/</span>
                                            <strong>{activeComponentMeta?.label || categoryDisplayName}</strong>
                                        </>
                                    ) : (
                                        <strong>{componentCatalogName}</strong>
                                    )}
                                </nav>

                                <div className={cx('hero-copy')}>
                                    <p className={cx('eyebrow')}>Linh kiện máy tính</p>
                                    <h1>
                                        {activeComponentMeta?.label || activeCategoryItem?.name || 'Tất cả linh kiện'}
                                    </h1>
                                </div>

                                <div className={cx('component-tabs')}>
                                    <Link
                                        to={buildComponentCatalogPath()}
                                        className={cx('component-tab', {
                                            active: !activeComponentType,
                                        })}
                                    >
                                        Tất cả
                                    </Link>
                                    {componentTypes.map((item) => (
                                        <Link
                                            key={item.value}
                                            to={buildComponentTabPath(item.value)}
                                            className={cx('component-tab', {
                                                active: item.value === activeComponentType,
                                            })}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {routeStatus === 'checking' ? (
                    <div className={cx('loading')}>
                        <Spin size="large" />
                    </div>
                        ) : (
                            <Row gutter={[24, 24]}>
                                <Col xs={24} lg={7} xl={6}>
                                    <Card title="Lọc sản phẩm">
                                        <div className={cx('filter-section')}>
                                            <h4>Tìm kiếm</h4>
                                            <Search
                                                placeholder="Tên sản phẩm..."
                                                value={filters.search}
                                                onChange={(e) => handleFilterUpdate({ search: e.target.value })}
                                                onSearch={handleSearchSubmit}
                                                allowClear
                                            />
                                        </div>

                                        <div className={cx('filter-section')}>
                                            <h4>Khoảng giá</h4>
                                            <Slider
                                                range
                                                min={0}
                                                max={100000000}
                                                step={1000000}
                                                value={filters.priceRange}
                                                onChange={(value) => handleFilterUpdate({ priceRange: value })}
                                                tooltip={{
                                                    formatter: (value) => `${value.toLocaleString('vi-VN')}đ`,
                                                }}
                                            />
                                        </div>

                                        <div className={cx('filter-section')}>
                                            <h4>Sắp xếp</h4>
                                            <Select
                                                style={{ width: '100%' }}
                                                options={sortOptions}
                                                value={filters.sort}
                                                onChange={(value) => handleFilterUpdate({ sort: value })}
                                            />
                                        </div>
                                    </Card>

                                    <CategoryComponentFilter
                                        onChange={handleComponentPartChange}
                                        onSpecChange={handleSpecFilterChange}
                                        categoryId={activeCategoryId || undefined}
                                        selectedIds={filters.componentIds}
                                        activeComponentType={activeComponentType}
                                    />
                                </Col>

                                <Col xs={24} lg={17} xl={18}>
                                    {loading ? (
                                        <div className={cx('loading')}>
                                            <Spin size="large" />
                                        </div>
                                    ) : allProducts.length > 0 ? (
                                        <>
                                            <div className={cx('result-meta')}>
                                                <span>
                                                    {isComponentPage
                                                        ? `${activeComponentMeta?.label || 'Linh kiện'} (${totalProducts} sản phẩm)`
                                                        : `Tổng ${totalProducts} sản phẩm`}
                                                </span>
                                            </div>

                                            <div className={cx('product-grid')}>
                                                {paginatedProducts.map((product) => (
                                                    <div key={product.id} className={cx('product-cell')}>
                                                        <CardBody product={product} />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className={cx('pagination-container')}>
                                                <Pagination
                                                    current={pagination.current}
                                                    pageSize={pagination.pageSize}
                                                    total={totalProducts}
                                                    onChange={handlePageChange}
                                                    showSizeChanger={false}
                                                    className={cx('pagination')}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <Empty description={emptyProductDescription} />
                                    )}
                                </Col>
                            </Row>
                        )}
                    </>
                )}
            </Content>
            <footer>
                <Footer />
            </footer>
        </Layout>
    );
}

export default ProductListing;
