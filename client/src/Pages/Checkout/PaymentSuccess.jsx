import React, { useState, useEffect, useCallback } from 'react';
import { Result, Button, Card, Divider, Spin, message, Popconfirm, Alert } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, HomeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './PaymentSuccess.module.scss';
import classNames from 'classnames/bind';
import { requestCancelOrder, requestGetOrderDetail, requestRetryOrderPayment } from '../../api';
import Header from '../../Components/Header/Header';
import { getOrderStatusLabel } from '../../constants/orderStatus';
import { getPaymentTypeLabel } from '../../constants/paymentTypes';
import { getFirstResolvedImage } from '../../lib/assetUrl';
import { useStore } from '../../hooks/useStore';
import { getGuestOrderAccessToken, rememberGuestOrderAccess } from '../../utils/guestOrderAccess';

const cx = classNames.bind(styles);

function PaymentSuccess() {
    const navigate = useNavigate();
    const { orderCode } = useParams();
    const [searchParams] = useSearchParams();
    const { clearGuestCheckoutState, isAuthenticated, reorderProductsToCart } = useStore();
    const [orderData, setOrderData] = useState(null);
    const [isRetryingPayment, setIsRetryingPayment] = useState(false);
    const [isCancellingOrder, setIsCancellingOrder] = useState(false);
    const guestAccessToken = searchParams.get('token') || getGuestOrderAccessToken(orderCode);

    const fetchData = useCallback(async () => {
        try {
            const res = await requestGetOrderDetail(orderCode, guestAccessToken);
            if (res.metadata) {
                rememberGuestOrderAccess(orderCode, guestAccessToken);
                setOrderData(res.metadata);
                if (!isAuthenticated && res.metadata.status !== 'cancelled') {
                    clearGuestCheckoutState();
                }
            }
        } catch (error) {
            console.error('Error fetching payment data:', error);
        }
    }, [clearGuestCheckoutState, orderCode, isAuthenticated, guestAccessToken]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (searchParams.get('paymentError') === 'failed') {
            message.warning('Thanh toán chưa thành công. Đơn hàng đã được hủy và tồn kho đã được giải phóng.');
        } else if (searchParams.get('paymentError') === 'requires-refund') {
            message.error('Thanh toán được ghi nhận sau khi đơn hàng không còn khả dụng. Vui lòng liên hệ hỗ trợ để xử lý hoàn tiền.');
        }
    }, [searchParams]);

    const isPendingPayment = orderData?.status === 'pending_payment';
    const isCancelled = orderData?.status === 'cancelled';
    const hasRefundError = searchParams.get('paymentError') === 'requires-refund';
    const canRetryPayment = isPendingPayment && ['MOMO', 'VNPAY'].includes(orderData?.paymentMethod);
    const canReorder = isCancelled && Array.isArray(orderData?.products) && orderData.products.length > 0;

    const getResultIcon = () => {
        if (isPendingPayment) return <ClockCircleOutlined style={{ color: '#faad14', fontSize: '72px' }} />;
        if (isCancelled) return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '72px' }} />;
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '72px' }} />;
    };

    const getResultTitle = () => {
        if (isPendingPayment) return 'Đơn hàng đang chờ thanh toán';
        if (isCancelled) return 'Đơn hàng đã hủy';
        return 'Đặt hàng thành công!';
    };

    const getResultTitleColor = () => {
        if (isPendingPayment) return '#faad14';
        if (isCancelled) return '#ff4d4f';
        return '#52c41a';
    };

    const handleRetryPayment = async () => {
        try {
            setIsRetryingPayment(true);
            const res = await requestRetryOrderPayment(orderCode, guestAccessToken);
            const paymentUrl = res?.metadata?.paymentUrl;
            if (!paymentUrl) {
                throw new Error('Không nhận được liên kết thanh toán');
            }
            window.location.assign(paymentUrl);
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể tạo lại liên kết thanh toán');
        } finally {
            setIsRetryingPayment(false);
        }
    };

    const handleCancelOrder = async () => {
        try {
            setIsCancellingOrder(true);
            await requestCancelOrder({ orderCode, guestAccessToken });
            message.success('Hủy đơn hàng thành công');
            await fetchData();
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể hủy đơn hàng');
        } finally {
            setIsCancellingOrder(false);
        }
    };

    const handleReorder = async () => {
        try {
            await reorderProductsToCart(orderData.products.map((item) => ({
                productId: item.productId,
                product: {
                    id: item.productId,
                    name: item.name,
                    price: item.originalPrice ?? item.unitPrice ?? item.price,
                    discount: item.originalPrice ? item.discount || 0 : 0,
                    images: item.images,
                    stock: item.stock,
                    componentType: item.componentType,
                    categoryId: item.categoryId,
                },
            })));
            message.success('Đã thêm sản phẩm của đơn hàng vào giỏ');
            navigate('/cart');
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể đặt lại đơn hàng');
        }
    };

    if (!orderData)
        return (
            <div className={cx('loading-wrapper')}>
                <Spin size="large" />
            </div>
        );

    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>
            <div className={cx('content')}>
                <Result
                    icon={getResultIcon()}
                    status={isPendingPayment ? 'warning' : isCancelled ? 'error' : 'success'}
                    title={
                        <span style={{ fontSize: '24px', color: getResultTitleColor() }}>
                            {getResultTitle()}
                        </span>
                    }
                    subTitle={
                        <span style={{ fontSize: '16px', color: '#8c8c8c' }}>
                            Mã đơn hàng: <strong>{orderCode}</strong>
                        </span>
                    }
                />

                {(isCancelled || hasRefundError) && (
                    <Alert
                        className={cx('payment-alert')}
                        type={hasRefundError ? 'error' : 'warning'}
                        showIcon
                        message={hasRefundError ? 'Giao dịch cần xử lý hoàn tiền' : 'Thanh toán không thành công'}
                        description={
                            hasRefundError
                                ? 'Thanh toán được ghi nhận sau khi đơn hàng không còn khả dụng. Vui lòng liên hệ hỗ trợ để được xử lý hoàn tiền.'
                                : 'Đơn hàng đã được hủy và tồn kho đã được giải phóng. Bạn có thể đặt lại đơn này nếu vẫn muốn mua các sản phẩm bên dưới.'
                        }
                    />
                )}

                <Card
                    className={cx('order-card')}
                    bordered={false}
                    style={{
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        marginBottom: '24px',
                    }}
                >
                    <h2
                        style={{
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: '12px',
                            marginBottom: '20px',
                            color: '#262626',
                        }}
                    >
                        Thông tin đơn hàng
                    </h2>

                    <div className={cx('order-info')}>
                        <div className={cx('info-item')}>
                            <span className={cx('label')}>Người nhận:</span>
                            <span className={cx('value')}>{orderData.fullName}</span>
                        </div>
                        <div className={cx('info-item')}>
                            <span className={cx('label')}>Số điện thoại:</span>
                            <span className={cx('value')}>{orderData.phone}</span>
                        </div>
                        <div className={cx('info-item')}>
                            <span className={cx('label')}>Email:</span>
                            <span className={cx('value')}>{orderData.email || 'Chưa có'}</span>
                        </div>
                        <div className={cx('info-item')}>
                            <span className={cx('label')}>Địa chỉ:</span>
                            <span className={cx('value')}>{orderData.address}</span>
                        </div>
                        <div className={cx('info-item')}>
                            <span className={cx('label')}>Phương thức thanh toán:</span>
                            <span className={cx('value')}>{getPaymentTypeLabel(orderData.paymentMethod)}</span>
                        </div>
                        <div className={cx('info-item')}>
                            <span className={cx('label')}>Trạng thái:</span>
                            <span className={cx('value')}>{getOrderStatusLabel(orderData.status)}</span>
                        </div>
                    </div>
                </Card>

                <Card
                    className={cx('products-card')}
                    bordered={false}
                    style={{
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                    }}
                >
                    <h2
                        style={{
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: '12px',
                            marginBottom: '20px',
                            color: '#262626',
                        }}
                    >
                        Chi tiết sản phẩm
                    </h2>

                    {orderData.products.map((product, index) => (
                        <div key={product.productId} className={cx('product-item')}>
                            <div className={cx('product-info')}>
                                <Link to={`/products/${product.productId}`} className={cx('product-link')}>
                                    <img
                                        src={getFirstResolvedImage(product.images)}
                                        alt={product.name}
                                        className={cx('product-image')}
                                    />
                                </Link>
                                <div className={cx('product-details')}>
                                    <Link to={`/products/${product.productId}`} className={cx('product-link')}>
                                        <h3>{product.name}</h3>
                                    </Link>
                                    <p>Số lượng: {product.quantity}</p>
                                </div>
                            </div>
                            {index < orderData.products.length - 1 && <Divider style={{ margin: '12px 0' }} />}
                        </div>
                    ))}

                    <div className={cx('total-price')}>
                        <span>Tổng tiền:</span>
                        <span className={cx('price')}>{orderData.totalPrice?.toLocaleString('vi-VN')}đ</span>
                    </div>
                </Card>

                <div className={cx('action-buttons')}>
                    {canRetryPayment && (
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleRetryPayment}
                            loading={isRetryingPayment}
                        >
                            Thanh toán lại
                        </Button>
                    )}
                    {isPendingPayment && (
                        <Popconfirm
                            title="Hủy đơn hàng"
                            description="Bạn có chắc chắn muốn hủy đơn hàng này?"
                            onConfirm={handleCancelOrder}
                            okText="Đồng ý"
                            cancelText="Hủy"
                        >
                            <Button danger size="large" loading={isCancellingOrder}>
                                Hủy đơn
                            </Button>
                        </Popconfirm>
                    )}
                    {canReorder && (
                        <Button
                            size="large"
                            icon={<ShoppingCartOutlined />}
                            onClick={handleReorder}
                        >
                            Đặt lại đơn này
                        </Button>
                    )}
                    <Button type="primary" icon={<HomeOutlined />} size="large" onClick={() => navigate('/')}>
                        Về trang chủ
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccess;

