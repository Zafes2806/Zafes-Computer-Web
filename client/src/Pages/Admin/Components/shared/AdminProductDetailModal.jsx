import { useEffect, useState } from 'react';
import { Descriptions, Image, Modal, Spin } from 'antd';
import classNames from 'classnames/bind';

import styles from './AdminProductDetailModal.module.scss';
import SafeHtml from '../../../../Components/SafeHtml/SafeHtml';
import { resolveAssetUrl } from '../../../../lib/assetUrl';
import { AdminMetaTag, AdminStatusTag, AdminStockTag } from './AdminTag';
import {
    formatCurrency,
    formatDateTime,
    getProductImageList,
    getProductTypeLabel,
    PC_CONFIGURATION_FIELDS,
    PC_CONFIGURATION_LABELS,
} from './adminProductDetail';

const cx = classNames.bind(styles);

function AdminProductDetailModal({
    open,
    loading = false,
    product,
    reviewCount = 0,
    onClose,
    footer,
    width = 920,
    getCategoryName = () => 'Chưa phân loại',
}) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        if (!open) {
            setActiveImageIndex(0);
        }
    }, [open, product?.id]);

    const detailImages = getProductImageList(product?.images);
    const isOrderSnapshot = product?.detailSource === 'order_snapshot' || product?.detailSource === 'legacy_order_item';
    const listPrice = Number(
        isOrderSnapshot ? (product?.originalPrice ?? product?.price ?? 0) : (product?.price ?? 0),
    );
    const discountedPrice = Number(
        isOrderSnapshot ? (product?.unitPrice ?? product?.price ?? 0) : listPrice * (1 - Number(product?.discount || 0) / 100),
    );
    const detailPcConfiguration = product?.pcConfiguration || {};
    const detailSpecs = Array.isArray(product?.specs) ? product.specs.filter((item) => item?.specKey && item?.specValue) : [];
    const hasPcConfiguration = PC_CONFIGURATION_FIELDS.some((field) => detailPcConfiguration?.[field]);

    return (
        <Modal
            title="Chi tiết sản phẩm"
            open={open}
            onCancel={onClose}
            footer={footer}
            width={width}
            destroyOnHidden
            className={cx('detail-modal')}
        >
            {loading ? (
                <div className={cx('detail-loading')}>
                    <Spin size="large" />
                </div>
            ) : product ? (
                <div className={cx('detail-content')}>
                    <div className={cx('detail-layout')}>
                        <div className={cx('detail-gallery')}>
                            <div className={cx('detail-main-image')}>
                                {detailImages.length ? (
                                    <Image
                                        src={resolveAssetUrl(detailImages[activeImageIndex] || detailImages[0])}
                                        alt={product.name}
                                    />
                                ) : (
                                    <div className={cx('detail-image-placeholder')}>Không có hình ảnh</div>
                                )}
                            </div>

                            {detailImages.length > 1 && (
                                <div className={cx('detail-thumbnails')}>
                                    {detailImages.map((image, index) => (
                                        <button
                                            key={`${image}-${index}`}
                                            type="button"
                                            className={cx('detail-thumbnail-button', {
                                                'detail-thumbnail-active': index === activeImageIndex,
                                            })}
                                            onClick={() => setActiveImageIndex(index)}
                                        >
                                            <img
                                                src={resolveAssetUrl(image)}
                                                alt={`${product.name} ${index + 1}`}
                                                className={cx('detail-thumbnail')}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={cx('detail-main')}>
                            <h3 className={cx('detail-title')}>{product.name}</h3>

                            <div className={cx('detail-badges')}>
                                <AdminMetaTag variant="info">{getProductTypeLabel(product.componentType)}</AdminMetaTag>
                                {isOrderSnapshot ? (
                                    <AdminMetaTag variant="neutral">Bản lưu khi đặt hàng</AdminMetaTag>
                                ) : (
                                    <AdminStatusTag domain="product" status={product.status} deletedAt={product.deletedAt} />
                                )}
                                <AdminMetaTag variant="category">
                                    {getCategoryName(product.categoryId, product)}
                                </AdminMetaTag>
                                {!isOrderSnapshot && <AdminStockTag stock={product.stock} prefix="Kho:" />}
                            </div>

                            <div className={cx('detail-price-card')}>
                                <span className={cx('detail-current-price')}>
                                    {formatCurrency(discountedPrice)}
                                </span>
                                {Number(product.discount) > 0 && listPrice > discountedPrice && (
                                    <>
                                        <span className={cx('detail-original-price')}>
                                            {formatCurrency(listPrice)}
                                        </span>
                                        <span className={cx('detail-discount')}>-{Number(product.discount)}%</span>
                                    </>
                                )}
                            </div>

                            <Descriptions column={1} size="small" className={cx('detail-facts')}>
                                {!isOrderSnapshot && (
                                    <Descriptions.Item label="Tồn kho">{product.stock ?? '---'}</Descriptions.Item>
                                )}
                                <Descriptions.Item label={isOrderSnapshot ? 'Danh mục lúc mua' : 'Danh mục'}>
                                    {getCategoryName(product.categoryId, product)}
                                </Descriptions.Item>
                                {!isOrderSnapshot && <Descriptions.Item label="Đánh giá">{reviewCount}</Descriptions.Item>}
                                <Descriptions.Item label="Mã sản phẩm">{product.id}</Descriptions.Item>
                                {isOrderSnapshot ? (
                                    <Descriptions.Item label="Lưu theo đơn lúc">
                                        {formatDateTime(product.snapshotTakenAt)}
                                    </Descriptions.Item>
                                ) : (
                                    <>
                                        <Descriptions.Item label="Tạo lúc">
                                            {formatDateTime(product.createdAt)}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Cập nhật lúc">
                                            {formatDateTime(product.updatedAt)}
                                        </Descriptions.Item>
                                        {product.deletedAt && (
                                            <Descriptions.Item label="Xóa lúc">
                                                {formatDateTime(product.deletedAt)}
                                            </Descriptions.Item>
                                        )}
                                    </>
                                )}
                            </Descriptions>
                        </div>
                    </div>

                    {hasPcConfiguration && (
                        <section className={cx('detail-section')}>
                            <h4 className={cx('detail-section-title')}>
                                {isOrderSnapshot ? 'Cấu hình PC lúc mua' : 'Cấu hình PC'}
                            </h4>
                            <div className={cx('detail-spec-grid')}>
                                {PC_CONFIGURATION_FIELDS.filter((field) => detailPcConfiguration?.[field]).map((field) => (
                                    <div key={field} className={cx('detail-spec-item')}>
                                        <span className={cx('detail-spec-label')}>{PC_CONFIGURATION_LABELS[field]}</span>
                                        <span className={cx('detail-spec-value')}>{detailPcConfiguration[field]}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {detailSpecs.length > 0 && (
                        <section className={cx('detail-section')}>
                            <h4 className={cx('detail-section-title')}>
                                {isOrderSnapshot ? 'Thông số kỹ thuật lúc mua' : 'Thông số kỹ thuật'}
                            </h4>
                            <div className={cx('detail-spec-grid')}>
                                {detailSpecs.map((item) => (
                                    <div key={`${item.specKey}-${item.specValue}`} className={cx('detail-spec-item')}>
                                        <span className={cx('detail-spec-label')}>{item.specKey}</span>
                                        <span className={cx('detail-spec-value')}>{item.specValue}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className={cx('detail-section')}>
                        <h4 className={cx('detail-section-title')}>
                            {isOrderSnapshot ? 'Mô tả tại thời điểm đặt hàng' : 'Mô tả'}
                        </h4>
                        <SafeHtml
                            className={cx('detail-description')}
                            html={product.description}
                            fallback="<p>Chưa có mô tả cho sản phẩm này.</p>"
                        />
                    </section>
                </div>
            ) : null}
        </Modal>
    );
}

export default AdminProductDetailModal;
