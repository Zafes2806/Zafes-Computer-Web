import classNames from 'classnames/bind';
import styles from './Cart.module.scss';
import Header from '../../Components/Header/Header';
import { Card, Table, Input, Form, Button, Checkbox, Space, message, Popover } from 'antd';
import { DeleteOutlined, ShopOutlined, BuildOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { requestCheckoutOrder } from '../../api';
import { useStore } from '../../hooks/useStore';
import Footer from '../../Components/Footer/Footer';
import EmptyState from '../../Components/EmptyState/EmptyState';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getFirstResolvedImage } from '../../lib/assetUrl';
import { buildGuestCheckoutItems } from '../../utils/guestStorage';
import { consumePendingCartSelection } from '../../utils/cartSelection';
import { rememberGuestOrderAccess } from '../../utils/guestOrderAccess';
import {
    getPaymentAmountLimitMessage,
    isPaymentAmountWithinLimit,
} from '../../constants/paymentLimits';

const cx = classNames.bind(styles);

function toUniqueProductIds(productIds = []) {
    return [...new Set(productIds.map((productId) => String(productId || '').trim()).filter(Boolean))];
}

function areSameProductIdLists(left = [], right = []) {
    if (left.length !== right.length) {
        return false;
    }

    return left.every((productId, index) => productId === right[index]);
}

function getCartItemStock(item = {}) {
    const stock = Number(item?.product?.stock);
    return Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0;
}

function isCartItemPurchasable(item = {}) {
    return getCartItemStock(item) >= Number(item.quantity || 0) && Number(item.quantity || 0) > 0;
}

function getCartItemAvailabilityMessage(item = {}) {
    const stock = getCartItemStock(item);
    const quantity = Number(item.quantity || 0);

    if (stock <= 0) {
        return 'Sản phẩm đã hết hàng';
    }

    if (quantity > stock) {
        return `Chỉ còn ${stock} sản phẩm trong kho`;
    }

    return '';
}

function Cart() {
    const [checkBox, setCheckBox] = useState(false);
    const [agreementError, setAgreementError] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState([]);

    const { fetchCart, dataCart, dataUser, isAuthenticated, removeCartItem, updateCartItemQuantity } = useStore();
    const [searchParams] = useSearchParams();

    const navigate = useNavigate();

    const buildPaymentRoute = (orderCode, guestAccessToken = '') => {
        if (!orderCode) {
            return '/cart';
        }

        if (!guestAccessToken) {
            return `/orders/${orderCode}/payment`;
        }

        return `/orders/${orderCode}/payment?token=${encodeURIComponent(guestAccessToken)}`;
    };

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    useEffect(() => {
        if (!dataCart.length) {
            setSelectedProductIds([]);
            return;
        }

        const purchasableProductIds = new Set(dataCart.filter(isCartItemPurchasable).map((item) => item?.product?.id).filter(Boolean));
        const pendingProductIds = consumePendingCartSelection();

        setSelectedProductIds((currentSelectedProductIds) => {
            const preservedProductIds = currentSelectedProductIds.filter((productId) => purchasableProductIds.has(productId));
            const mergedProductIds = toUniqueProductIds([
                ...preservedProductIds,
                ...pendingProductIds.filter((productId) => purchasableProductIds.has(productId)),
            ]);

            return areSameProductIdLists(currentSelectedProductIds, mergedProductIds)
                ? currentSelectedProductIds
                : mergedProductIds;
        });
    }, [dataCart]);

    const selectedProductIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);
    const selectedCartItems = useMemo(
        () => dataCart.filter((item) => selectedProductIdSet.has(item.product.id) && isCartItemPurchasable(item)),
        [dataCart, selectedProductIdSet],
    );
    const unavailableCartItems = useMemo(
        () => dataCart.filter((item) => !isCartItemPurchasable(item)),
        [dataCart],
    );
    const totalPrice = useMemo(() => {
        return selectedCartItems.reduce((total, item) => total + item.totalPrice, 0);
    }, [selectedCartItems]);
    const selectedRowKeys = useMemo(
        () => dataCart.filter((item) => selectedProductIdSet.has(item.product.id) && isCartItemPurchasable(item)).map((item) => item.id),
        [dataCart, selectedProductIdSet],
    );
    const allCartProductIds = useMemo(
        () => dataCart.filter(isCartItemPurchasable).map((item) => item?.product?.id).filter(Boolean),
        [dataCart],
    );
    const allCartItemsSelected = allCartProductIds.length > 0
        && allCartProductIds.every((productId) => selectedProductIdSet.has(productId));
    const hasSelectedCartItems = selectedCartItems.length > 0;
    const canPayWithMomo = isPaymentAmountWithinLimit('MOMO', totalPrice);

    const handleToggleAllCartItems = useCallback((event) => {
        if (event.target.checked) {
            setSelectedProductIds(allCartProductIds);
            return;
        }

        setSelectedProductIds([]);
    }, [allCartProductIds]);

    const handleDeleteCart = async (id) => {
        try {
            await removeCartItem(id);
            message.success('Xoá sản phẩm trong giỏ hàng thành công');
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể xoá sản phẩm');
        }
    };

    const handleChangeQuantity = async (record, e) => {
        try {
            if (Number(e.target.value) > record.product.stock) {
                message.error('Số lượng sản phẩm không được vượt quá số lượng có trong kho');
                e.target.value = record.product.stock;
                return;
            }
            await updateCartItemQuantity(record, Number(e.target.value));
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể cập nhật số lượng');
        }
    };

    const columns = [
        {
            title: 'Sản phẩm',
            dataIndex: ['product', 'name'],
            key: 'name',
            width: '52%',
            render: (text, record) => {
                const availabilityMessage = getCartItemAvailabilityMessage(record);

                return (
                    <div className={cx('product-cell')}>
                        <Link to={`/products/${record.product.id}`} className={cx('product-link')}>
                            <img
                                src={getFirstResolvedImage(record.product.images)}
                                alt={text}
                                className={cx('product-image')}
                            />
                        </Link>
                        <div className={cx('product-info')}>
                            <Link to={`/products/${record.product.id}`} className={cx('product-link', 'product-name-link')}>
                                <span>{text}</span>
                            </Link>
                            {availabilityMessage ? (
                                <span className={cx('stock-warning')}>{availabilityMessage}</span>
                            ) : null}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Đơn giá',
            dataIndex: ['product', 'price'],
            key: 'price',
            width: 170,
            render: (price) => `${price?.toLocaleString()} đ`,
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 150,
            render: (quantity, record) => (
                <Input
                    onChange={(e) => handleChangeQuantity(record, e)}
                    type="number"
                    value={quantity}
                    style={{ width: 60 }}
                    min={1}
                    max={record.product.stock}
                    disabled={getCartItemStock(record) <= 0}
                />
            ),
        },
        {
            title: 'Thành tiền',
            dataIndex: 'totalPrice',
            key: 'total',
            width: 180,
            render: (totalPrice) => `${totalPrice?.toLocaleString()} đ`,
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 100,
            render: (record) => (
                <Button
                    onClick={() => handleDeleteCart(record.id)}
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ fontSize: '16px' }}
                />
            ),
        },
    ];

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (dataUser) {
            setFullName(dataUser.fullName || '');
            setPhone(dataUser.phone || '');
            setAddress(dataUser.address || '');
            setEmail(dataUser.email || '');
        }
    }, [dataUser]);

    useEffect(() => {
        const paymentError = searchParams.get('paymentError');

        if (!paymentError) {
            return;
        }

        const errorMessages = {
            failed: 'Thanh toán chưa thành công. Tồn kho đã được giải phóng, vui lòng đặt hàng lại nếu cần.',
            'stock-unavailable': 'Một số sản phẩm không còn đủ tồn kho để hoàn tất đơn hàng.',
            'session-expired': 'Phiên checkout đã hết hạn. Vui lòng nhập lại thông tin giao hàng.',
            'invalid-signature': 'Thông tin xác thực thanh toán không hợp lệ.',
            'requires-refund': 'Thanh toán được ghi nhận sau khi đơn hàng không còn khả dụng. Vui lòng liên hệ hỗ trợ để xử lý hoàn tiền.',
        };

        message.error(errorMessages[paymentError] || 'Có lỗi xảy ra khi thanh toán.');
    }, [searchParams]);

    const handlePayment = async (paymentMethod) => {
        if (isCheckingOut) {
            return;
        }
        if (!selectedCartItems.length) {
            message.error('Vui lòng chọn sản phẩm để đặt hàng');
            return;
        }
        const unavailableSelectedItem = selectedCartItems.find((item) => !isCartItemPurchasable(item));
        if (unavailableSelectedItem) {
            message.error(getCartItemAvailabilityMessage(unavailableSelectedItem) || 'Có sản phẩm không còn đủ tồn kho');
            return;
        }
        if (!isPaymentAmountWithinLimit(paymentMethod, totalPrice)) {
            message.error(getPaymentAmountLimitMessage(paymentMethod) || 'Số tiền thanh toán không hợp lệ');
            return;
        }
        if (!checkBox) {
            setAgreementError(true);
            return;
        }
        if (!fullName || !phone || !address || !email) {
            message.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
            message.error('Email không hợp lệ');
            return;
        }
        if (!/^0\d{9}$/.test(String(phone).trim())) {
            message.error('SĐT phải bắt đầu bằng số 0 và đủ 10 số');
            return;
        }
        try {
            const data = {
                paymentMethod,
                fullName: fullName.trim(),
                phone: String(phone).trim(),
                address: address.trim(),
                email: email.trim(),
            };
            if (isAuthenticated) {
                data.items = selectedCartItems.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                }));
            } else {
                data.items = buildGuestCheckoutItems(selectedCartItems);
            }

            setIsCheckingOut(true);
            const res = await requestCheckoutOrder(data);
            const checkoutMetadata = res?.metadata || {};
            const orderCode = checkoutMetadata.orderCode;

            if (!isAuthenticated) {
                rememberGuestOrderAccess(orderCode, checkoutMetadata.guestAccessToken);
            }

            if (paymentMethod === 'COD') {
                if (!orderCode) {
                    throw new Error('Không nhận được mã đơn hàng');
                }
                message.success('Đặt hàng thành công');
                await fetchCart();
                navigate(buildPaymentRoute(orderCode, checkoutMetadata.guestAccessToken));
                return;
            }

            if (!checkoutMetadata.paymentUrl) {
                if (orderCode) {
                    message.warning('Đơn hàng đã được tạo và đang chờ thanh toán.');
                    await fetchCart();
                    navigate(buildPaymentRoute(orderCode, checkoutMetadata.guestAccessToken));
                    return;
                }

                throw new Error('Không nhận được liên kết thanh toán');
            }

            await fetchCart();
            window.location.assign(checkoutMetadata.paymentUrl);
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể tạo đơn hàng');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <div className={cx('container')}>
                    {unavailableCartItems.length > 0 && (
                        <div className={cx('cart-warning')}>
                            Có {unavailableCartItems.length} sản phẩm trong giỏ không còn đủ tồn kho. Vui lòng xóa hoặc điều chỉnh trước khi thanh toán.
                        </div>
                    )}
                    <Table
                        dataSource={dataCart}
                        columns={columns}
                        pagination={false}
                        rowKey="id"
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (_, selectedRows) => {
                                setSelectedProductIds(toUniqueProductIds(selectedRows.filter(isCartItemPurchasable).map((item) => item?.product?.id)));
                            },
                            getCheckboxProps: (record) => ({
                                disabled: !isCartItemPurchasable(record),
                            }),
                            hideSelectAll: true,
                            columnTitle: (
                                <Checkbox
                                    checked={allCartItemsSelected}
                                    onChange={handleToggleAllCartItems}
                                />
                            ),
                        }}
                        locale={{
                            emptyText: (
                                <EmptyState
                                    title="Giỏ hàng đang trống"
                                    description="Thêm vài sản phẩm vào giỏ để bắt đầu đặt hàng. Khi có sản phẩm, phần thanh toán sẽ hiển thị ngay bên dưới."
                                    icon={<ShopOutlined />}
                                    actions={[
                                        {
                                            label: 'Mua sắm ngay',
                                            type: 'primary',
                                            icon: <ShopOutlined />,
                                            onClick: () => navigate('/products'),
                                        },
                                        {
                                            label: 'Lên cấu hình PC',
                                            icon: <BuildOutlined />,
                                            onClick: () => navigate('/build-pc'),
                                        },
                                    ]}
                                />
                            ),
                        }}
                    />
                    {dataCart.length > 0 && (
                        <div className={cx('checkout-section')}>
                            <Card title="THÔNG TIN NGƯỜI MUA" style={{ marginBottom: 16 }}>
                                <Form layout="vertical">
                                    <Form.Item label="Họ tên" required>
                                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                    </Form.Item>
                                    <Form.Item
                                        label="Email"
                                        required
                                        validateTrigger={['onChange', 'onBlur']}
                                        rules={[
                                            {
                                                type: 'email',
                                                message: 'Email không hợp lệ',
                                            },
                                            {
                                                required: true,
                                                message: 'Email không được để trống',
                                            },
                                        ]}
                                    >
                                        <Input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label="SĐT"
                                        required
                                        validateTrigger={['onChange', 'onBlur']}
                                        rules={[
                                            {
                                                pattern: /^0\d{0,9}$/,
                                                message: 'SĐT phải bắt đầu bằng số 0 và tối đa 10 số',
                                            },
                                            {
                                                required: true,
                                                message: 'SĐT không được để trống',
                                            },
                                        ]}
                                    >
                                        <Input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            maxLength={10}
                                        />
                                    </Form.Item>

                                    <Form.Item label="Địa chỉ" required>
                                        <Input.TextArea value={address} onChange={(e) => setAddress(e.target.value)} />
                                    </Form.Item>
                                    <Form.Item label="Ghi chú">
                                        <Input.TextArea />
                                    </Form.Item>
                                </Form>
                            </Card>

                            <Card title="TỔNG TIỀN">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div className={cx('total-section')}>
                                        <p>Tổng cộng: {totalPrice.toLocaleString()} đ</p>
                                        <p>Giảm giá Voucher: 0 đ</p>
                                        <p>Thành tiền: {totalPrice.toLocaleString()} đ</p>
                                        <p>(Giá đã bao gồm VAT)</p>
                                    </div>

                                    <div className={cx('agreement-section')}>
                                        <Popover
                                            open={agreementError}
                                            placement="topLeft"
                                            trigger="click"
                                            overlayClassName={cx('agreement-popover')}
                                            content={(
                                                <div className={cx('agreement-popover-content')}>
                                                    <ExclamationCircleFilled className={cx('agreement-popover-icon')} />
                                                    <span>Vui lòng chọn hộp kiểm này nếu bạn muốn tiếp tục.</span>
                                                </div>
                                            )}
                                        >
                                            <Checkbox
                                                checked={checkBox}
                                                onChange={(e) => {
                                                    setCheckBox(e.target.checked);
                                                    if (e.target.checked) {
                                                        setAgreementError(false);
                                                    }
                                                }}
                                            >
                                                Tôi đã đọc và đồng ý với các Điều kiện giao dịch chung của website
                                            </Checkbox>
                                        </Popover>
                                    </div>

                                    <Space direction="vertical" style={{ width: '100%' }} className={cx('payment-actions')}>
                                        <Button
                                            onClick={() => handlePayment('COD')}
                                            type="default"
                                            block
                                            className={cx('payment-button', 'payment-button-cod')}
                                            disabled={isCheckingOut}
                                            loading={isCheckingOut}
                                        >
                                            Thanh toán khi nhận hàng
                                        </Button>
                                        <Button
                                            onClick={() => handlePayment('MOMO')}
                                            type="default"
                                            block
                                            className={cx('payment-button', 'payment-button-momo')}
                                            disabled={isCheckingOut}
                                            loading={isCheckingOut}
                                            title={hasSelectedCartItems && !canPayWithMomo ? getPaymentAmountLimitMessage('MOMO') : undefined}
                                        >
                                            Thanh toán qua MOMO
                                        </Button>
                                        {hasSelectedCartItems && !canPayWithMomo && (
                                            <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                                                {getPaymentAmountLimitMessage('MOMO')}
                                            </span>
                                        )}
                                        <Button
                                            onClick={() => handlePayment('VNPAY')}
                                            type="default"
                                            block
                                            className={cx('payment-button', 'payment-button-vnpay')}
                                            disabled={isCheckingOut}
                                            loading={isCheckingOut}
                                        >
                                            Thanh toán qua VNPAY
                                        </Button>
                                    </Space>
                                </Space>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default Cart;

