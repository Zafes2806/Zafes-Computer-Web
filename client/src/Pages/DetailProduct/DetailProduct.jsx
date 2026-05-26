import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Empty, Rate, Spin, message } from 'antd';
import dayjs from 'dayjs';
import classNames from 'classnames/bind';

import styles from './DetailProduct.module.scss';
import Header from '../../Components/Header/Header';
import Footer from '../../Components/Footer/Footer';
import SafeHtml from '../../Components/SafeHtml/SafeHtml';
import {
    requestAddToRecentlyViewed,
    requestGetProductByIdPublic,
    requestGetSpecDefinitionsPublic,
} from '../../api';
import { useStore } from '../../hooks/useStore';
import { resolveAssetUrl } from '../../lib/assetUrl';
import { createProductListPath } from '../../utils/productListRoute';

const cx = classNames.bind(styles);
const DEFAULT_PRODUCT = {};

function parseProductImages(images) {
    if (typeof images !== 'string') {
        return [];
    }

    return images
        .split(',')
        .map((image) => image.trim())
        .filter(Boolean);
}

function formatPrice(value) {
    return Number(value || 0).toLocaleString('vi-VN');
}

function normalizeProductStock(stock) {
    const normalizedStock = Number(stock);

    if (!Number.isFinite(normalizedStock)) {
        return 0;
    }

    return Math.max(0, Math.trunc(normalizedStock));
}

function clampQuantity(value, maxStock) {
    if (maxStock <= 0) {
        return 0;
    }

    const normalizedValue = Number.parseInt(String(value), 10);

    if (!Number.isFinite(normalizedValue) || normalizedValue < 1) {
        return 1;
    }

    return Math.min(normalizedValue, maxStock);
}

function buildSpecificationItems(product) {
    const pcConfiguration = product?.pcConfiguration || {};
    const productSpecs = Array.isArray(product?.specs)
        ? product.specs.filter((item) => item?.specKey && item?.specValue)
        : [];

    if (product?.componentType === 'pc') {
        return [
            { key: 'cpu', label: 'CPU', value: pcConfiguration.cpu },
            { key: 'motherboard', label: 'Mainboard', value: pcConfiguration.motherboard },
            { key: 'ram', label: 'RAM', value: pcConfiguration.ram },
            { key: 'storage', label: 'Ổ cứng', value: pcConfiguration.storage },
            { key: 'gpu', label: 'GPU', value: pcConfiguration.gpu },
            { key: 'computerCase', label: 'Case', value: pcConfiguration.computerCase },
            { key: 'power', label: 'PSU', value: pcConfiguration.power },
            { key: 'cooler', label: 'Tản nhiệt', value: pcConfiguration.cooler },
        ].filter((item) => item.value);
    }

    return productSpecs.map((item) => ({
        key: String(item.specKey),
        label: String(item.specKey).replace(/[_-]+/g, ' ').trim(),
        value: item.specValue,
    }));
}

function buildSpecLabelMap(specDefinitions = []) {
    return specDefinitions.reduce((accumulator, definition) => {
        if (!definition?.specKey || !definition?.label) {
            return accumulator;
        }

        accumulator[String(definition.specKey)] = definition.label;
        return accumulator;
    }, {});
}

function getProductAvailabilityMessage(product, fallback = '') {
    if (fallback) {
        return fallback;
    }

    if (product?.deletedAt) {
        return 'Sản phẩm đã ngừng bán';
    }

    if (product?.status && product.status !== 'active') {
        return 'Sản phẩm tạm ngừng bán';
    }

    if (product?.category?.deletedAt) {
        return 'Sản phẩm đã ngừng bán do danh mục đã bị xóa';
    }

    if (product?.category?.status && product.category.status !== 'active') {
        return 'Sản phẩm tạm ngừng bán do danh mục đang tạm khóa';
    }

    return '';
}

function getReviewInitial(name) {
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName) {
        return '?';
    }

    return Array.from(normalizedName)[0].toLocaleUpperCase('vi-VN');
}

function ProductGallery({ productName, images, selectedImage, onSelectImage }) {
    const selectedImageUrl = resolveAssetUrl(images[selectedImage]);

    return (
        <div className={cx('product-images')}>
            <div className={cx('main-image')}>
                {selectedImageUrl ? (
                    <img src={selectedImageUrl} alt={productName || 'Sản phẩm'} />
                ) : (
                    <div className={cx('image-placeholder')}>
                        <Empty description="Sản phẩm chưa có ảnh" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                )}
            </div>

            {images.length > 1 ? (
                <div className={cx('thumbnail-list')}>
                    {images.map((image, index) => (
                        <img
                            key={`${image}-${index}`}
                            src={resolveAssetUrl(image)}
                            alt={`Thumbnail ${index + 1}`}
                            onClick={() => onSelectImage(index)}
                            className={cx({ active: selectedImage === index })}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function ProductDescription({ description, isExpanded, onToggle }) {
    if (!description) {
        return null;
    }

    return (
        <div className={cx('description')}>
            <div
                className={cx('description-content')}
                style={{
                    maxHeight: isExpanded ? 'none' : '300px',
                    overflow: isExpanded ? 'visible' : 'hidden',
                }}
            >
                <SafeHtml html={description} />
                {!isExpanded ? <div className={cx('fade-overlay')}></div> : null}
            </div>
            <button onClick={onToggle} className={cx('description-toggle-btn')}>
                {isExpanded ? 'Thu gọn' : 'Xem thêm mô tả'}
            </button>
        </div>
    );
}

function ProductReviews({ reviews, isLoading }) {
    return (
        <div className={cx('product-preview')}>
            <h3>Đánh giá sản phẩm</h3>
            <div className={cx('review-list')}>
                {isLoading ? (
                    <div className={cx('loading-block')}>
                        <Spin />
                    </div>
                ) : null}

                {!isLoading && reviews.length === 0 ? <p>Chưa có đánh giá nào cho sản phẩm này.</p> : null}

                {!isLoading
                    ? reviews.map((item) => (
                          <div key={item.id} className={cx('product-preview-item')}>
                              <div className={cx('review-avatar')} aria-hidden="true">
                                  {getReviewInitial(item?.user?.name)}
                              </div>
                              <div className={cx('review-body')}>
                                  <div className={cx('review-head')}>
                                      <h4>{item?.user?.name || 'Người dùng'}</h4>
                                      <Rate disabled value={item.rating} />
                                  </div>
                                  <p>{item?.content || 'Không có nội dung đánh giá.'}</p>
                                  <span className={cx('review-time')}>
                                      {dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')}
                                  </span>
                              </div>
                          </div>
                      ))
                    : null}
            </div>
        </div>
    );
}

function DetailProduct() {
    const location = useLocation();
    const orderProductSnapshot = location.state?.productSnapshot || null;
    const [product, setProduct] = useState(DEFAULT_PRODUCT);
    const [reviews, setReviews] = useState([]);
    const [specLabelMap, setSpecLabelMap] = useState({});
    const [quantity, setQuantity] = useState('1');
    const [selectedImage, setSelectedImage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [availabilityNotice, setAvailabilityNotice] = useState('');

    const pageTopRef = useRef(null);
    const navigate = useNavigate();
    const { id } = useParams();
    const { addProductToCart, dataUser } = useStore();

    const isLoggedIn = Boolean(dataUser?.id);
    const productCategoryId = product?.category?.id || product?.categoryId || orderProductSnapshot?.categoryId || '';
    const productCategoryName = product?.category?.name || orderProductSnapshot?.categoryName || 'Danh mục sản phẩm';
    const productBreadcrumbName = product?.name || orderProductSnapshot?.name || 'Chi tiết sản phẩm';
    const productImages = useMemo(() => parseProductImages(product?.images), [product?.images]);
    const specificationItems = useMemo(() => {
        const items = buildSpecificationItems(product);

        return items.map((item) => {
            const label = item.key ? specLabelMap[item.key] || item.label : item.label;
            return [label, item.value];
        });
    }, [product, specLabelMap]);
    const currentPrice = Number(product?.price || 0);
    const currentDiscount = Number(product?.discount || 0);
    const discountedPrice = currentPrice - (currentPrice * currentDiscount) / 100;
    const savedPrice = (currentPrice * currentDiscount) / 100;
    const productDescription = typeof product?.description === 'string' ? product.description : '';
    const productStock = useMemo(() => normalizeProductStock(product?.stock), [product?.stock]);
    const normalizedQuantity = clampQuantity(quantity, productStock);
    const isOutOfStock = productStock === 0;
    const isUnavailableProduct = Boolean(
        product?.deletedAt
        || (product?.status && product.status !== 'active')
        || product?.category?.deletedAt
        || (product?.category?.status && product.category.status !== 'active'),
    );
    const productAvailabilityMessage = getProductAvailabilityMessage(product, availabilityNotice);
    const productCategoryPath = productCategoryId ? createProductListPath({ category: productCategoryId }) : '';

    useEffect(() => {
        const fetchProductDetail = async () => {
            setIsLoading(true);
            setIsDescriptionExpanded(false);
            setQuantity('1');
            setSpecLabelMap({});
            setAvailabilityNotice('');

            try {
                const res = await requestGetProductByIdPublic(id);
                const nextProduct = res?.metadata?.product || DEFAULT_PRODUCT;
                setProduct(nextProduct);
                setQuantity(normalizeProductStock(nextProduct?.stock) > 0 ? '1' : '0');
                setReviews(Array.isArray(res?.metadata?.reviews) ? res.metadata.reviews : []);
            } catch (error) {
                if (orderProductSnapshot) {
                    setProduct(orderProductSnapshot);
                    setQuantity(normalizeProductStock(orderProductSnapshot?.stock) > 0 ? '1' : '0');
                    setReviews([]);
                    setAvailabilityNotice('Sản phẩm đã ngừng bán nhưng vẫn được giữ trong lịch sử đơn hàng');
                    return;
                }

                message.error(error?.response?.data?.message || 'Sản phẩm hiện không khả dụng');
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductDetail();
    }, [id, navigate, orderProductSnapshot]);

    useEffect(() => {
        if (!product?.componentType || product.componentType === 'pc') {
            return;
        }

        let isMounted = true;

        const fetchSpecDefinitions = async () => {
            try {
                const res = await requestGetSpecDefinitionsPublic({ componentType: product.componentType });
                const definitions = Array.isArray(res?.metadata) ? res.metadata : [];

                if (isMounted) {
                    setSpecLabelMap(buildSpecLabelMap(definitions));
                }
            } catch (error) {
                console.error('Fetch spec definitions error:', error);
            }
        };

        fetchSpecDefinitions();

        return () => {
            isMounted = false;
        };
    }, [product?.componentType]);

    useEffect(() => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [id]);

    useEffect(() => {
        if (selectedImage >= productImages.length) {
            setSelectedImage(0);
        }
    }, [productImages.length, selectedImage]);

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        const trackViewedProduct = async () => {
            try {
                await requestAddToRecentlyViewed({ productId: id });
            } catch (error) {
                console.error('Watch product error:', error);
            }
        };

        trackViewedProduct();
    }, [id, isLoggedIn]);

    const handleQuantityChange = (type) => {
        if (productStock <= 0) {
            return;
        }

        setQuantity((prevQuantity) => {
            const currentQuantity = prevQuantity === '' ? 0 : clampQuantity(prevQuantity, productStock);

            if (type === 'decrement') {
                return String(Math.max(1, currentQuantity - 1));
            }

            return String(Math.min(productStock, currentQuantity + 1));
        });
    };

    const handleQuantityInputChange = (event) => {
        const nextValue = event.target.value;

        if (nextValue === '') {
            setQuantity('');
            return;
        }

        if (!/^\d+$/.test(nextValue)) {
            return;
        }

        setQuantity(String(clampQuantity(nextValue, productStock)));
    };

    const handleQuantityInputBlur = () => {
        setQuantity(String(clampQuantity(quantity, productStock)));
    };

    const handleQuantityInputKeyDown = (event) => {
        if (['e', 'E', '+', '-', '.'].includes(event.key)) {
            event.preventDefault();
        }
    };

    const handleAddToCart = async (redirectToCart = false) => {
        if (isUnavailableProduct) {
            message.error(productAvailabilityMessage || 'Sản phẩm hiện không còn khả dụng để đặt mua');
            return;
        }

        if (isOutOfStock) {
            message.error('Sản phẩm hiện đã hết hàng');
            return;
        }

        try {
            setQuantity(String(normalizedQuantity));
            await addProductToCart(product, normalizedQuantity);

            if (redirectToCart) {
                navigate('/cart');
                return;
            }

            message.success('Thêm vào giỏ hàng thành công');
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể thêm vào giỏ hàng');
        }
    };

    return (
        <div className={cx('wrapper')} ref={pageTopRef}>
            <Header />

            <section className={cx('detail-hero')}>
                <nav className={cx('breadcrumb')} aria-label="Điều hướng sản phẩm">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    {productCategoryPath ? (
                        <Link to={productCategoryPath}>{productCategoryName}</Link>
                    ) : (
                        <strong>{productCategoryName}</strong>
                    )}
                    <span>/</span>
                    <strong>{productBreadcrumbName}</strong>
                </nav>
            </section>

            <div className={cx('container')}>
                <ProductGallery
                    productName={product?.name}
                    images={productImages}
                    selectedImage={selectedImage}
                    onSelectImage={setSelectedImage}
                />

                <div className={cx('product-info')}>
                    {isLoading ? (
                        <div className={cx('loading-block')}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <>
                            <h1 className={cx('product-title')}>{product?.name || 'Chi tiết sản phẩm'}</h1>

                            {productAvailabilityMessage && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message={productAvailabilityMessage}
                                    style={{ marginBottom: 15 }}
                                />
                            )}

                            <div className={cx('price-section')}>
                                <span className={cx('current-price')}>{formatPrice(discountedPrice)} đ</span>
                                <span className={cx('original-price')}>{formatPrice(currentPrice)}đ</span>
                                <span className={cx('discount')}>Tiết kiệm: {formatPrice(savedPrice)}đ</span>
                            </div>

                            {specificationItems.length > 0 ? (
                                <div className={cx('specifications')}>
                                    <h3>Thông số sản phẩm</h3>
                                    <ul>
                                        {specificationItems.map(([label, value]) => (
                                            <li key={label}>
                                                {label}: {value}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            <div className={cx('stock-section')}>
                                <span className={cx('stock-label')}>Tồn kho:</span>
                                <span
                                    className={cx('stock-value', {
                                        'in-stock': productStock > 5,
                                        'low-stock': productStock > 0 && productStock <= 5,
                                        'out-of-stock': isOutOfStock,
                                    })}
                                >
                                    {isOutOfStock ? 'Hết hàng' : `Còn ${productStock} sản phẩm`}
                                </span>
                            </div>

                            <div className={cx('quantity-section')}>
                                <span>Số lượng:</span>
                                <div className={cx('quantity-panel')}>
                                    <div className={cx('quantity-controls')}>
                                        <button
                                            type="button"
                                            onClick={() => handleQuantityChange('decrement')}
                                            disabled={isOutOfStock || isUnavailableProduct || normalizedQuantity <= 1}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            min={isOutOfStock ? 0 : 1}
                                            max={productStock}
                                            inputMode="numeric"
                                            onChange={handleQuantityInputChange}
                                            onBlur={handleQuantityInputBlur}
                                            onKeyDown={handleQuantityInputKeyDown}
                                            disabled={isOutOfStock || isUnavailableProduct}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleQuantityChange('increment')}
                                            disabled={isOutOfStock || isUnavailableProduct || normalizedQuantity >= productStock}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className={cx('quantity-hint')}>
                                        {isUnavailableProduct
                                            ? `${productAvailabilityMessage || 'Sản phẩm hiện tạm ngừng bán'}. Chỉ có thể xem thông tin.`
                                            : isOutOfStock
                                            ? 'Sản phẩm hiện không còn sẵn để đặt mua.'
                                            : `Bạn có thể mua tối đa ${productStock} sản phẩm.`}
                                    </span>
                                </div>
                            </div>

                            <div className={cx('action-buttons')}>
                                <Button
                                    type="primary"
                                    className={cx('buy-now')}
                                    onClick={() => handleAddToCart(true)}
                                    disabled={isOutOfStock || isUnavailableProduct}
                                >
                                    {isUnavailableProduct ? 'TẠM NGỪNG BÁN' : isOutOfStock ? 'HẾT HÀNG' : isLoggedIn ? 'ĐẶT HÀNG' : 'MUA NGAY'}
                                </Button>
                                <Button
                                    className={cx('add-to-cart')}
                                    onClick={() => handleAddToCart(false)}
                                    disabled={isOutOfStock || isUnavailableProduct}
                                >
                                    THÊM VÀO GIỎ
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ProductDescription
                description={productDescription}
                isExpanded={isDescriptionExpanded}
                onToggle={() => setIsDescriptionExpanded((prev) => !prev)}
            />

            <ProductReviews reviews={reviews} isLoading={isLoading} />

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default DetailProduct;

