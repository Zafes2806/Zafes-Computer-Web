import classNames from 'classnames/bind';
import styles from './CardBody.module.scss';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { getFirstResolvedImage } from '../../lib/assetUrl';

import { message } from 'antd';
import { useRef, useState } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, arrow, inline } from '@floating-ui/react-dom';
import { useStore } from '../../hooks/useStore';

const cx = classNames.bind(styles);

function CardBody({ product }) {
    const { addProductToCart } = useStore();
    const [isHovering, setIsHovering] = useState(false);
    const arrowRef = useRef(null);
    const pcConfiguration = product?.pcConfiguration || {};

    // Floating UI setup
    const { x, y, strategy, refs, middlewareData, placement } = useFloating({
        middleware: [offset(10), inline(), flip(), shift({ padding: 5 }), arrow({ element: arrowRef })],
        placement: 'right-start',
        whileElementsMounted: autoUpdate,
    });

    // Arrow positioning
    const { x: arrowX, y: arrowY } = middlewareData.arrow || {};
    const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
    }[placement.split('-')[0]];

    const onAddToCart = async () => {
        try {
            await addProductToCart(product, 1);
            message.success('Thêm vào giỏ hàng thành công');
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể thêm vào giỏ hàng');
        }
    };

    // Calculate discounted price
    const discountedPrice =
        product?.price && !isNaN(product.price)
            ? ((product.price * (100 - (product?.discount || 0))) / 100).toLocaleString()
            : 'Liên hệ';
    const originalPrice = product?.price && !isNaN(product.price) ? product.price.toLocaleString() : '';

    // Get the first image for the main display
    const mainImage = getFirstResolvedImage(product?.images);

    // Add timeout for hover to prevent flickering
    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    // Render specifications based on product type
    const renderSpecifications = () => {
        const specs = [];

        if (pcConfiguration.cpu) {
            specs.push(
                <li key="cpu">
                    <span className={cx('check-icon')}></span>
                    CPU: {pcConfiguration.cpu}
                </li>,
            );
        }

        if (pcConfiguration.motherboard) {
            specs.push(
                <li key="motherboard">
                    <span className={cx('check-icon')}></span>
                    Mainboard: {pcConfiguration.motherboard}
                </li>,
            );
        }

        if (pcConfiguration.ram) {
            specs.push(
                <li key="ram">
                    <span className={cx('check-icon')}></span>
                    RAM: {pcConfiguration.ram}
                </li>,
            );
        }

        if (pcConfiguration.storage) {
            specs.push(
                <li key="storage">
                    <span className={cx('check-icon')}></span>Ổ cứng: {pcConfiguration.storage}
                </li>,
            );
        }

        if (pcConfiguration.gpu) {
            specs.push(
                <li key="gpu">
                    <span className={cx('check-icon')}></span>
                    Card đồ họa: {pcConfiguration.gpu}
                </li>,
            );
        }

        if (pcConfiguration.power) {
            specs.push(
                <li key="power">
                    <span className={cx('check-icon')}></span>
                    Nguồn: {pcConfiguration.power}
                </li>,
            );
        }

        if (pcConfiguration.computerCase) {
            specs.push(
                <li key="case">
                    <span className={cx('check-icon')}></span>
                    Case: {pcConfiguration.computerCase}
                </li>,
            );
        }

        if (pcConfiguration.cooler) {
            specs.push(
                <li key="cooler">
                    <span className={cx('check-icon')}></span>
                    Tản nhiệt: {pcConfiguration.cooler}
                </li>,
            );
        }

        return specs;
    };

    // Cập nhật phần render modal
    return (
        <div
            ref={refs.setReference}
            className={cx('wrapper')}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link to={`/products/${product?.id}`}>
                <img src={mainImage} alt={product?.name} />
            </Link>
            <div className={cx('info')}>
                <Link to={`/products/${product?.id}`} className={cx('product-name-link')}>
                    <h3>{product?.name}</h3>
                </Link>
                <div>
                    <div>
                        <p>{discountedPrice}</p>
                        <p>{originalPrice}</p>
                    </div>

                    <button onClick={onAddToCart}>
                        <FontAwesomeIcon icon={faCartPlus} />
                    </button>
                </div>
            </div>

            {isHovering && (
                <div
                    ref={refs.setFloating}
                    className={cx('modal-product-detail')}
                    style={{
                        position: strategy,
                        top: y ?? 0,
                        left: x ?? 0,
                        width: 'min(500px, 90vw)',
                    }}
                >
                    <div
                        ref={arrowRef}
                        className={cx('arrow')}
                        style={{
                            position: 'absolute',
                            left: arrowX != null ? `${arrowX}px` : '',
                            top: arrowY != null ? `${arrowY}px` : '',
                            right: '',
                            bottom: '',
                            [staticSide]: '-6px',
                        }}
                    />
                    <h2 className={cx('modal-title')}>{product?.name}</h2>

                    <div className={cx('modal-price-container')}>
                        <div className={cx('price-row')}>
                            <p className={cx('price-label')}>Giá bán:</p>
                            <p className={cx('price-value')}>{discountedPrice} VNĐ</p>
                        </div>
                        <div className={cx('price-row')}>
                            <p className={cx('price-label')}>Giá gốc:</p>
                            <p className={cx('original-price')}>{originalPrice} VNĐ</p>
                        </div>
                        <div className={cx('price-row')}>
                            <p className={cx('price-label')}>Tiết kiệm:</p>
                            <p className={cx('discount-value')}>
                                {product?.price && !isNaN(product.price) && product?.discount
                                    ? ((product.price * product.discount) / 100).toLocaleString()
                                    : 0}{' '}
                                VNĐ ({product?.discount || 0}%)
                            </p>
                        </div>
                        <div className={cx('price-row')}>
                            <p className={cx('price-label')}>Bảo hành:</p>
                            <p className={cx('warranty-value')}>36 Tháng</p>
                        </div>
                    </div>

                    <ul className={cx('spec-list')}>{renderSpecifications()}</ul>
                </div>
            )}
        </div>
    );
}

export default CardBody;
