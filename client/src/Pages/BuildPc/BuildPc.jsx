import {
    Button,
    Card,
    Row,
    Col,
    Typography,
    Modal,
    Table,
    Image,
    InputNumber,
    Input,
    Select,
    Space,
    Pagination,
    message,
    Empty,
} from 'antd';
import { useCallback, useState, useEffect } from 'react';
import Footer from '../../Components/Footer/Footer';
import classNames from 'classnames/bind';
import styles from './BuildPc.module.scss';
import Header from '../../Components/Header/Header';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import {
    requestAddToCartBuildPc,
    requestFindProductComponent,
    requestGetBuildPcItems,
    requestDeleteCartBuildPc,
    requestUpdateQuantityCartBuildPc,
    requestAddToCartBuildPcToCart,
    requestDeleteAllCartBuildPC,
    requestGetProductSearchByCategory,
} from '../../api';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { getFirstResolvedImage } from '../../lib/assetUrl';
import {
    addGuestBuildPcItem,
    clearGuestBuildPc,
    getGuestBuildPc,
    moveGuestBuildPcToCart,
    removeGuestBuildPcItem,
    updateGuestBuildPcItemQuantity,
} from '../../utils/guestStorage';
import { useComponentTypes } from '../../hooks/useComponentTypes';
import useDebounce from '../../hooks/useDebounce';
import CategoryComponentFilter from '../../Components/CategoryComponentFilter/CategoryComponentFilter';

const cx = classNames.bind(styles);
const { Title } = Typography;
const { Option } = Select;

function getDiscountedPrice(product = {}) {
    const price = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;

    if (discount <= 0) {
        return price;
    }

    return Math.max(0, Math.round(price * (1 - discount / 100)));
}

function hasStock(product = {}) {
    return Number(product.stock) > 0;
}

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
}

function BuildPc() {
    const { componentTypes } = useComponentTypes({ buildPcOnly: true });
    const { fetchCart, isAuthenticated } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentComponent, setCurrentComponent] = useState(null);
    const [selectedComponents, setSelectedComponents] = useState({});
    const [quantities, setQuantities] = useState({});
    const [componentProducts, setComponentProducts] = useState([]);
    const [productLoading, setProductLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [displayOrder, setDisplayOrder] = useState(null);
    const [specFilters, setSpecFilters] = useState({});
    const [filterRenderKey, setFilterRenderKey] = useState(0);
    const [productPagination, setProductPagination] = useState({
        current: 1,
        pageSize: 6,
        total: 0,
    });
    const currentProductPage = productPagination.current;
    const currentProductPageSize = productPagination.pageSize;
    const totalProductCount = productPagination.total;
    const debouncedSearchText = useDebounce(searchText, 350);

    const [totalPrice, setTotalPrice] = useState(0);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        const res = isAuthenticated ? await requestGetBuildPcItems() : { metadata: getGuestBuildPc() };

        setTotalPrice(res.metadata.reduce((total, item) => total + item.totalPrice, 0));

        // Tạo object mới từ data cart để map theo componentType
        const componentMap = {};
        res.metadata.forEach((item) => {
            componentMap[item.componentType] = {
                ...item.product,
                quantity: item.quantity,
            };
        });
        setSelectedComponents(componentMap);

        // Set quantities
        const quantityMap = {};
        res.metadata.forEach((item) => {
            quantityMap[item.componentType] = item.quantity;
        });
        setQuantities(quantityMap);
    }, [isAuthenticated]);

    const getProductSort = useCallback((sortOrder) => {
        if (sortOrder === 'ascend') return 'price-asc';
        if (sortOrder === 'descend') return 'price-desc';
        return 'newest';
    }, []);

    const fetchComponentProducts = useCallback(async (componentType, options = {}) => {
        try {
            setProductLoading(true);

            const hasSpecFilters = Object.values(options.specFilters || {}).some((values) => values.length > 0);
            const response = await requestGetProductSearchByCategory({
                category: 'all',
                componentType,
                search: options.search || undefined,
                sort: getProductSort(options.sortOrder),
                specFilters: hasSpecFilters ? JSON.stringify(options.specFilters) : undefined,
                page: options.page || 1,
                limit: options.limit || currentProductPageSize,
            });
            const products = Array.isArray(response.metadata) ? response.metadata : [];
            setComponentProducts(products);
            setProductPagination((prev) => ({
                ...prev,
                current: options.page || 1,
                total: response.pagination?.totalItems ?? products.length,
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            try {
                const response = await requestFindProductComponent(componentType);
                setComponentProducts(response.metadata);
                setProductPagination((prev) => ({
                    ...prev,
                    current: 1,
                    total: Array.isArray(response.metadata) ? response.metadata.length : 0,
                }));
            } catch (fallbackError) {
                console.error('Error fetching fallback products:', fallbackError);
                setComponentProducts([]);
                setProductPagination((prev) => ({
                    ...prev,
                    current: 1,
                    total: 0,
                }));
            }
        } finally {
            setProductLoading(false);
        }
    }, [currentProductPageSize, getProductSort]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (isModalOpen && currentComponent) {
            fetchComponentProducts(currentComponent.type, {
                search: debouncedSearchText,
                sortOrder: displayOrder,
                specFilters,
                page: currentProductPage,
                limit: currentProductPageSize,
            });
        }
    }, [
        currentComponent,
        debouncedSearchText,
        displayOrder,
        fetchComponentProducts,
        isModalOpen,
        currentProductPage,
        currentProductPageSize,
        specFilters,
    ]);

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 140,
            render: (_, record) => (
                <Link
                    to={`/products/${record.id}`}
                    className={cx('product-detail-link')}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={cx('product-image-cell')}>
                        <img className={cx('product-image')} src={getFirstResolvedImage(record.images)} alt="" />
                    </div>
                </Link>
            ),
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <Link
                    to={`/products/${record.id}`}
                    className={cx('product-detail-link', 'product-name-link')}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={cx('product-name-cell')}>{name}</div>
                </Link>
            ),
        },

        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            width: 150,
            sorter: true,
            sortOrder: displayOrder,
            render: (_, record) => {
                const discountedPrice = getDiscountedPrice(record);
                const hasDiscount = Number(record.discount) > 0 && discountedPrice < Number(record.price || 0);

                return (
                    <div className={cx('price-stack')}>
                        <span className={cx('price-cell')}>{formatCurrency(discountedPrice)}</span>
                        {hasDiscount && (
                            <span className={cx('original-price-cell')}>
                                {formatCurrency(record.price)}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Kho hàng',
            dataIndex: 'stock',
            key: 'stock',
            width: 110,
            render: (stock) => (
                <span className={cx(Number(stock) > 0 ? 'stock-cell' : 'stock-cell-empty')}>
                    {Number(stock) > 0 ? stock : 'Hết hàng'}
                </span>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 130,
            render: (_, record) => (
                <Button type="primary" disabled={!hasStock(record)} onClick={() => handleSelectProduct(record)}>
                    {hasStock(record) ? 'Chọn' : 'Hết hàng'}
                </Button>
            ),
        },
    ];

    const pcComponents = componentTypes.map((component, index) => ({
        id: index + 1,
        name: component.buildPcLabel,
        buttonText: component.buttonText,
        type: component.value,
    }));

    const handleOpenModal = (component) => {
        setCurrentComponent(component);
        setIsModalOpen(true);
        setSearchText('');
        setDisplayOrder(null);
        setSpecFilters({});
        setFilterRenderKey((value) => value + 1);
        setProductPagination((prev) => ({
            ...prev,
            current: 1,
        }));
    };

    const handleSelectProduct = async (product) => {
        if (!hasStock(product)) {
            message.warning('Sản phẩm này đã hết hàng, vui lòng chọn sản phẩm khác');
            return;
        }

        if (isAuthenticated) {
            const data = {
                productId: product.id,
                quantity: 1,
            };
            await requestAddToCartBuildPc(data);
        } else {
            addGuestBuildPcItem(product, 1);
        }
        await fetchData();
        setIsModalOpen(false);
    };

    const handleDelete = async (productId) => {
        try {
            // Gọi API xóa với productId
            const data = {
                productId,
            };
            if (isAuthenticated) {
                await requestDeleteCartBuildPc(data);
            } else {
                removeGuestBuildPcItem(productId);
            }

            await fetchData();
        } catch (error) {
            console.error('Error deleting component:', error);
        }
    };

    const handleQuantityChange = async (productId, value) => {
        // Kiểm tra giá trị hợp lệ trước khi cập nhật
        if (!value || value <= 0) {
            message.error('Số lượng không hợp lệ!');
            return;
        }

        // Lấy thông tin sản phẩm từ selectedComponents
        const component = Object.values(selectedComponents).find((item) => item.id === productId);

        // Kiểm tra số lượng không vượt quá stock
        if (component && value > component.stock) {
            message.warning(`Số lượng không thể vượt quá ${component.stock} sản phẩm có sẵn trong kho!`);
            return;
        }

        const data = {
            productId,
            quantity: value,
        };

        try {
            if (isAuthenticated) {
                await requestUpdateQuantityCartBuildPc(data);
            } else {
                updateGuestBuildPcItemQuantity(productId, value);
            }
            await fetchData();
        } catch (error) {
            console.error('Error updating quantity:', error);
            message.error('Số lượng không vượt quá trong kho');
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setProductPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleSortChange = (value) => {
        setDisplayOrder(value);
        setProductPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleSpecFilterChange = (nextSpecFilters) => {
        setSpecFilters(nextSpecFilters);
        setProductPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleModalPageChange = (page, pageSize) => {
        setProductPagination((prev) => ({
            ...prev,
            current: page,
            pageSize,
        }));
    };

    const handleTableChange = (pagination, filters, sorter) => {
        if (sorter.order) {
            setDisplayOrder(sorter.order);
        } else {
            setDisplayOrder(null);
        }
    };

    const navigate = useNavigate();

    const handleAddToCart = async () => {
        try {
            const unavailableComponent = Object.values(selectedComponents).find((component) => !hasStock(component));
            if (unavailableComponent) {
                message.warning(`Sản phẩm "${unavailableComponent.name}" đã hết hàng, vui lòng xóa hoặc chọn sản phẩm khác`);
                return;
            }

            if (isAuthenticated) {
                await requestAddToCartBuildPcToCart();
            } else {
                moveGuestBuildPcToCart();
            }
            await fetchData();
            await fetchCart();
            navigate('/cart');
            message.success('Thêm vào giỏ hàng thành công');
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể thêm cấu hình vào giỏ hàng');
        }
    };

    const openQuotation = () => {
        window.open('/quotation', '_blank');
    };

    const handleReset = async () => {
        try {
            if (isAuthenticated) {
                await requestDeleteAllCartBuildPC();
            } else {
                clearGuestBuildPc();
            }
            setSelectedComponents({});
            setQuantities({});
            setTotalPrice(0);
            setIsResetModalOpen(false);
            message.success('Đã làm mới cấu hình máy tính');
        } catch (error) {
            console.error('Error resetting PC build:', error);
            message.error('Không thể làm mới cấu hình');
        }
    };

    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <Card>
                    <Row justify="space-between" align="middle" className={cx('header')}>
                        <Title level={4}>XÂY DỰNG MÁY TÍNH</Title>
                        <Button type="primary" onClick={() => setIsResetModalOpen(true)}>
                            LÀM MỚI
                        </Button>
                    </Row>

                    <div className={cx('description')}>
                        Vui lòng chọn linh kiện bạn cần để xây dựng cấu hình máy tính riêng cho bạn
                    </div>

                    <div className={cx('components-list')}>
                        {pcComponents.map((component) => (
                            <Row key={component.id} className={cx('component-row')} align="middle">
                                <Col span={4}>
                                    {component.id}. {component.name}
                                </Col>
                                <Col span={16}>
                                    {selectedComponents[component.type] ? (
                                        <Row align="middle" className={cx('selected-product')}>
                                            <Col span={4}>
                                                <Link
                                                    to={`/products/${selectedComponents[component.type].id}`}
                                                    className={cx('selected-product-link', 'selected-product-image-link')}
                                                >
                                                    <Image
                                                        src={getFirstResolvedImage(
                                                            selectedComponents[component.type].images,
                                                        )}
                                                        width={80}
                                                        preview={false}
                                                    />
                                                </Link>
                                            </Col>
                                            <Col span={20}>
                                                <Link
                                                    to={`/products/${selectedComponents[component.type].id}`}
                                                    className={cx('product-info', 'selected-product-link')}
                                                >
                                                    <div className={cx('product-name')}>
                                                        {selectedComponents[component.type].name}
                                                    </div>
                                                    <div className={cx('selected-price')}>
                                                        {formatCurrency(getDiscountedPrice(selectedComponents[component.type]))}
                                                        {Number(selectedComponents[component.type].discount) > 0 && (
                                                            <span className={cx('selected-original-price')}>
                                                                {formatCurrency(selectedComponents[component.type].price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={cx('stock-status')}>
                                                        {hasStock(selectedComponents[component.type])
                                                            ? `Kho hàng: ${selectedComponents[component.type].stock}`
                                                            : 'Hết hàng'}
                                                    </div>
                                                </Link>
                                            </Col>
                                        </Row>
                                    ) : null}
                                </Col>
                                <Col span={4} className={cx('actions')}>
                                    {selectedComponents[component.type] ? (
                                        <Row gutter={8} justify="end" align="middle" className={cx('selected-actions')}>
                                            <Col>
                                                <InputNumber
                                                    min={1}
                                                    value={quantities[component.type]}
                                                    max={selectedComponents[component.type].stock}
                                                    disabled={!hasStock(selectedComponents[component.type])}
                                                    precision={0}
                                                    parser={(value) => {
                                                        const parsed = parseInt(value, 10);
                                                        if (isNaN(parsed)) return 1;
                                                        return Math.min(
                                                            parsed,
                                                            selectedComponents[component.type].stock,
                                                        );
                                                    }}
                                                    formatter={(value) => {
                                                        if (value > selectedComponents[component.type].stock) {
                                                            return selectedComponents[component.type].stock.toString();
                                                        }
                                                        return value.toString();
                                                    }}
                                                    onChange={(value) => {
                                                        // Đảm bảo giá trị không vượt quá stock
                                                        const validValue = Math.min(
                                                            value || 1,
                                                            selectedComponents[component.type].stock,
                                                        );

                                                        handleQuantityChange(
                                                            selectedComponents[component.type].id,
                                                            validValue,
                                                        );
                                                    }}
                                                    style={{ width: 70 }}
                                                />
                                            </Col>
                                            <Col>
                                                <Button
                                                    type="link"
                                                    danger
                                                    onClick={() =>
                                                        handleDelete(
                                                            selectedComponents[component.type].id,
                                                            component.type,
                                                        )
                                                    }
                                                >
                                                    <DeleteOutlined />
                                                </Button>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <Button type="primary" onClick={() => handleOpenModal(component)}>
                                            {component.buttonText}
                                        </Button>
                                    )}
                                </Col>
                            </Row>
                        ))}
                    </div>

                    <Row justify="end" className={cx('total-price')}>
                        <Typography.Text className={cx('total-text')}>
                            Chi phí dự tính: {totalPrice.toLocaleString()} đ
                        </Typography.Text>
                    </Row>

                    <Row justify="end" gutter={16} className={cx('action-buttons')}>
                        <Col>
                            <Button onClick={openQuotation} style={{ marginRight: 10 }} type="primary">
                                Xem & In
                            </Button>
                            <Button onClick={handleAddToCart} type="primary">
                                THÊM VÀO GIỎ HÀNG
                            </Button>
                        </Col>
                    </Row>
                </Card>

                <Modal
                    title={`Chọn ${currentComponent?.name}`}
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    width={1360}
                    footer={null}
                    className={cx('build-pc-modal')}
                >
                    <div className={cx('modal-shell')}>
                        <aside className={cx('filter-sidebar')}>
                            <div className={cx('section-head')}>
                                <div className={cx('section-title')}>Bộ lọc</div>
                            </div>
                            <div className={cx('sidebar-body')}>
                                {currentComponent?.type && (
                                    <CategoryComponentFilter
                                        key={`${currentComponent.type}-${filterRenderKey}`}
                                        activeComponentType={currentComponent.type}
                                        onSpecChange={handleSpecFilterChange}
                                    />
                                )}
                            </div>
                        </aside>

                        <section className={cx('product-panel')}>
                            <div className={cx('section-head', 'section-head-row')}>
                                <div>
                                    <div className={cx('section-title')}>Danh sách sản phẩm</div>
                                </div>

                                <div className={cx('header-actions')}>
                                    <Space className={cx('modal-toolbar')} wrap>
                                        <Input
                                            placeholder="Tìm kiếm sản phẩm"
                                            prefix={<SearchOutlined />}
                                            allowClear
                                            value={searchText}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className={cx('modal-search')}
                                        />
                                        <Select
                                            placeholder="Sắp xếp theo giá"
                                            className={cx('modal-sort')}
                                            onChange={handleSortChange}
                                            value={displayOrder}
                                        >
                                            <Option value="ascend">Giá từ thấp đến cao</Option>
                                            <Option value="descend">Giá từ cao đến thấp</Option>
                                            <Option value={null}>Mặc định</Option>
                                        </Select>
                                    </Space>
                                    <Pagination
                                        className={cx('pagination-top')}
                                        current={currentProductPage}
                                        pageSize={currentProductPageSize}
                                        total={totalProductCount}
                                        onChange={handleModalPageChange}
                                        showSizeChanger={false}
                                    />
                                </div>
                            </div>

                            <div className={cx('table-shell')}>
                                {componentProducts.length > 0 ? (
                                    <Table
                                        columns={columns}
                                        dataSource={componentProducts}
                                        loading={productLoading}
                                        pagination={false}
                                        onChange={handleTableChange}
                                        rowKey="id"
                                        tableLayout="fixed"
                                        scroll={{ y: 560 }}
                                    />
                                ) : (
                                    <Empty description="Không có sản phẩm phù hợp" className={cx('empty-state')} />
                                )}
                            </div>

                        </section>
                    </div>
                </Modal>

                <Modal
                    title="LÀM MỚI"
                    open={isResetModalOpen}
                    onCancel={() => setIsResetModalOpen(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setIsResetModalOpen(false)}>
                            HỦY
                        </Button>,
                        <Button key="confirm" type="primary" onClick={handleReset}>
                            XÁC NHẬN
                        </Button>,
                    ]}
                >
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                            <span style={{ color: '#1890ff', marginRight: '10px' }}>⚠️</span>
                        </div>
                        <p>Cảnh báo: Toàn bộ linh kiện của bộ PC hiện tại sẽ bị xóa đi</p>
                    </div>
                </Modal>
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default BuildPc;

