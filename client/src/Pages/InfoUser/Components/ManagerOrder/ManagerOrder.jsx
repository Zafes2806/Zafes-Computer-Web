import { Table, Space, Typography, Image, Button, Popconfirm, message, Modal, Rate, Input, Form, Descriptions, Divider, Tag, Tooltip } from 'antd';
import { ShoppingCartOutlined, ShoppingOutlined, BuildOutlined, EyeOutlined, RollbackOutlined, StarOutlined, StarFilled, CreditCardOutlined, CloseCircleOutlined, HourglassOutlined } from '@ant-design/icons';
import { AdminIconAction, AdminIconActionGroup } from '../../../Admin/Components/shared/AdminIconAction';
import classNames from 'classnames/bind';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppTag, PaymentTypeTag } from '../../../../Components/AppTag/AppTag';
import EmptyState from '../../../../Components/EmptyState/EmptyState';
import {
    requestCancelOrder,
    requestCreateReview,
    requestGetMyReviews,
    requestGetOrders,
    requestRetryOrderPayment,
    requestReturnOrder,
    requestUpdateReview,
} from '../../../../api';
import {
    getOrderStatusColor,
    getOrderStatusLabel,
    isReviewableOrderStatus,
} from '../../../../constants/orderStatus';
import { getFirstResolvedImage } from '../../../../lib/assetUrl';
import { useStore } from '../../../../hooks/useStore';
import styles from './ManagerOrder.module.scss';

const { Text } = Typography;
const { TextArea } = Input;

const cx = classNames.bind(styles);
const ACTION_WIDTH = 80;
const ACTION_CONTAINER_STYLE = { width: ACTION_WIDTH };
const REORDERABLE_STATUSES = new Set(['cancelled', 'return_requested', 'return_in_progress', 'returned', 'refunded']);

const renderOrderStatus = (status) => (
    <AppTag
        color={getOrderStatusColor(status)}
        style={{
            display: 'inline-block',
            lineHeight: '18px',
            marginInlineEnd: 0,
            maxWidth: '100%',
            textAlign: 'center',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
        }}
    >
        {getOrderStatusLabel(status)}
    </AppTag>
);

function ManagerOrder() {
    const navigate = useNavigate();
    const { reorderProductsToCart } = useStore();
    const [orders, setOrders] = useState([]);
    const [reviewModalState, setReviewModalState] = useState({
        open: false,
        mode: 'create',
        review: null,
        order: null,
        product: null,
    });
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnTargetOrder, setReturnTargetOrder] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    const [reviewForm] = Form.useForm();
    const [userReviews, setUserReviews] = useState([]);
    const [orderDetailModal, setOrderDetailModal] = useState({ open: false, order: null });

    const openOrderDetail = (order) => setOrderDetailModal({ open: true, order });
    const closeOrderDetail = () => setOrderDetailModal({ open: false, order: null });

    const fetchData = useCallback(async () => {
        const res = await requestGetOrders();
        setOrders(res.metadata);
    }, []);

    const fetchMyReviews = useCallback(async () => {
        const res = await requestGetMyReviews();
        setUserReviews(res.metadata);
    }, []);

    useEffect(() => {
        fetchData();
        fetchMyReviews();
    }, [fetchData, fetchMyReviews]);

    const handleCancelOrder = async (orderCode) => {
        try {
            const data = {
                orderCode,
            };

            await requestCancelOrder(data);
            await fetchData();
            message.success('Hủy đơn hàng thành công');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể hủy đơn hàng');
        }
    };

    const handleRetryPayment = async (orderCode) => {
        try {
            const res = await requestRetryOrderPayment(orderCode);
            const paymentUrl = res?.metadata?.paymentUrl;
            if (!paymentUrl) {
                throw new Error('Không nhận được liên kết thanh toán');
            }
            window.location.assign(paymentUrl);
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể tạo lại liên kết thanh toán');
        }
    };

    const handleReorder = async (record) => {
        try {
            await reorderProductsToCart(record.products.map((item) => {
                const product = item.product || {};

                return {
                    productId: product.id,
                    product: {
                        ...product,
                        id: product.id,
                        price: product.originalPrice ?? product.price ?? item.unitPrice,
                        discount: product.originalPrice ? product.discount || 0 : 0,
                        images: product.images || item.images,
                    },
                };
            }));
            message.success('Đã thêm sản phẩm của đơn hàng vào giỏ');
            navigate('/cart');
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể đặt lại đơn hàng');
        }
    };

    const getReviewForProduct = (order, product) =>
        userReviews.find((item) => item.orderId === order.id && item.productId === product.product.id) || null;

    const openCreateReviewModal = (product, order) => {
        setReviewModalState({
            open: true,
            mode: 'create',
            review: null,
            order,
            product,
        });
        reviewForm.resetFields();
        reviewForm.setFieldsValue({ rating: 5, content: '' });
    };

    const openViewReviewModal = (review, product, order) => {
        setReviewModalState({
            open: true,
            mode: 'view',
            review,
            order,
            product,
        });
        reviewForm.setFieldsValue({
            rating: review.rating,
            content: review.content,
        });
    };

    const closeReviewModal = () => {
        setReviewModalState({
            open: false,
            mode: 'create',
            review: null,
            order: null,
            product: null,
        });
        reviewForm.resetFields();
    };

    const startEditReview = () => {
        if (!reviewModalState.review?.canEdit) {
            return;
        }

        setReviewModalState((prev) => ({ ...prev, mode: 'edit' }));
        reviewForm.setFieldsValue({
            rating: reviewModalState.review.rating,
            content: reviewModalState.review.content,
        });
    };

    const submitReviewModal = async () => {
        try {
            const values = await reviewForm.validateFields();
            const payload = {
                productId: reviewModalState.product.product.id,
                orderCode: reviewModalState.order.orderCode,
                rating: values.rating,
                content: values.content,
            };

            if (reviewModalState.mode === 'edit' && reviewModalState.review) {
                await requestUpdateReview(reviewModalState.review.id, payload);
                message.success('Cập nhật đánh giá sản phẩm thành công');
            } else {
                await requestCreateReview(payload);
                message.success('Đánh giá sản phẩm thành công');
            }

            await fetchMyReviews();
            closeReviewModal();
        } catch (error) {
            if (error?.errorFields) {
                return;
            }

            message.error(error?.response?.data?.message || (reviewModalState.mode === 'edit' ? 'Không thể cập nhật đánh giá' : 'Không thể đánh giá sản phẩm'));
        }
    };

    const showReturnModal = (order) => {
        setReturnTargetOrder(order);
        setReturnReason('');
        setIsReturnModalOpen(true);
    };

    const handleReturnCancel = () => {
        setIsReturnModalOpen(false);
        setReturnTargetOrder(null);
        setReturnReason('');
    };

    const openProductDetail = (item) => {
        const productId = item?.product?.id || item?.productId;
        if (!productId) {
            message.error('Không tìm thấy liên kết sản phẩm');
            return;
        }
        navigate(`/products/${productId}`, {
            state: {
                fromOrderItem: true,
                productSnapshot: item?.product || null,
            },
        });
    };

    const handleReturnOk = async () => {
        const normalizedReason = returnReason.trim();

        if (!normalizedReason) {
            message.error('Vui lòng nhập lý do trả hàng/hoàn tiền');
            return;
        }

        try {
            setIsSubmittingReturn(true);
            await requestReturnOrder({
                orderCode: returnTargetOrder.orderCode,
                reason: normalizedReason,
            });
            await fetchData();
            handleReturnCancel();
            message.success('Gửi yêu cầu trả hàng/hoàn tiền thành công');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể gửi yêu cầu trả hàng/hoàn tiền');
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    const isProductReviewedInOrder = (record, product) =>
        userReviews.some((item) => item.productId === product.product.id && item.orderId === record.id);

    const isOrderFullyReviewed = (record) =>
        record.products.length > 0 && record.products.every((product) => isProductReviewedInOrder(record, product));

    const renderReorderButton = (record, key = 'reorder') => (
        <AdminIconAction
            key={key}
            title="Mua lại"
            icon={<ShoppingCartOutlined />}
            variant="restore"
            onClick={() => handleReorder(record)}
        />
    );

    // Thu gom tất cả nút thành 1 mảng để render trong AdminIconActionGroup
    const collectAllActionButtons = (record) => {
        const nodes = [];

        // Nút Chi tiết luôn hiện
        nodes.push(
            <AdminIconAction
                key="detail"
                title="Chi tiết đơn hàng"
                icon={<EyeOutlined />}
                variant="view"
                onClick={() => openOrderDetail(record)}
            />
        );

        if (record.status === 'pending_payment') {
            if (['MOMO', 'VNPAY'].includes(record.paymentMethod)) {
                nodes.push(
                    <AdminIconAction
                        key="pay"
                        title="Thanh toán lại"
                        icon={<CreditCardOutlined />}
                        variant="edit"
                        onClick={() => handleRetryPayment(record.orderCode)}
                    />
                );
            }
            nodes.push(
                <Popconfirm
                    key="cancel"
                    title="Hủy đơn hàng"
                    description="Bạn có chắc chắn muốn hủy đơn hàng này?"
                    onConfirm={() => handleCancelOrder(record.orderCode)}
                    okText="Đồng ý"
                    cancelText="Hủy"
                >
                    <span>
                        <AdminIconAction title="Hủy đơn" icon={<CloseCircleOutlined />} variant="delete" />
                    </span>
                </Popconfirm>
            );
            return nodes;
        }

        if (record.canCancel && record.status !== 'cancelled') {
            nodes.push(
                <Popconfirm
                    key="cancel"
                    title="Hủy đơn hàng"
                    description="Bạn có chắc chắn muốn hủy đơn hàng này?"
                    onConfirm={() => handleCancelOrder(record.orderCode)}
                    okText="Đồng ý"
                    cancelText="Hủy"
                >
                    <span>
                        <AdminIconAction title="Hủy đơn" icon={<CloseCircleOutlined />} variant="delete" />
                    </span>
                </Popconfirm>
            );
            return nodes;
        }

        if (record.status === 'return_rejected') {
            nodes.push(
                <AdminIconAction
                    key="waiting"
                    title="Đang chờ admin xử lý"
                    icon={<HourglassOutlined />}
                    variant="deactivate"
                    disabled
                />
            );
            return nodes;
        }

        if (record.status === 'cancelled') {
            nodes.push(renderReorderButton(record));
        }

        if (record.canRequestReturn) {
            nodes.push(
                <AdminIconAction
                    key="return"
                    title="Trả hàng / Hoàn tiền"
                    icon={<RollbackOutlined />}
                    variant="delete"
                    onClick={() => showReturnModal(record)}
                />
            );
        }

        if (isReviewableOrderStatus(record.status)) {
            const reviewNodes = record.products
                .filter((product) => getReviewForProduct(record, product) || record.canReview)
                .map((product, index) => {
                    const review = getReviewForProduct(record, product);
                    return (
                        <AdminIconAction
                            key={`rev-${index}`}
                            title={review ? 'Xem đánh giá' : 'Đánh giá'}
                            icon={review ? <StarFilled /> : <StarOutlined />}
                            variant="activate"
                            onClick={() => {
                                if (review) { openViewReviewModal(review, product, record); return; }
                                openCreateReviewModal(product, record);
                            }}
                        />
                    );
                });
            nodes.push(...reviewNodes);
        }

        const isFullyReviewed = isReviewableOrderStatus(record.status) && isOrderFullyReviewed(record);
        if (record.status !== 'cancelled' && (REORDERABLE_STATUSES.has(record.status) || isFullyReviewed)) {
            nodes.push(renderReorderButton(record, 'reorder-end'));
        }

        return nodes;
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'orderCode',
            key: 'orderCode',
            width: '12%',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Ngày mua',
            dataIndex: 'orderDate',
            key: 'orderDate',
            width: '10%',
            render: (date) => dayjs(date).format('HH:mm DD/MM/YYYY'),
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'products',
            key: 'products',
            align: 'left',
            width: '22%',
            render: (products) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {products.map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <button type="button" onClick={() => openProductDetail(item)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                                <Image
                                    src={getFirstResolvedImage(item.images)}
                                    width={50}
                                    height={50}
                                    style={{ objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                    preview={false}
                                />
                            </button>
                            <div style={{ textAlign: 'left' }}>
                                <button type="button" onClick={() => openProductDetail(item)} style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 500, cursor: 'pointer', textAlign: 'left', wordBreak: 'break-word' }}>
                                    {item.product.name}
                                </button>
                                <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '14px' }}>
                                    Số lượng: {item.quantity}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: '13%',
            render: (amount) => (
                <Text strong type="danger">
                    {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                    }).format(amount)}
                </Text>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: '16%',
            render: (status) => renderOrderStatus(status),
        },
        {
            title: 'Hình thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: '10%',
            render: (type) => <PaymentTypeTag type={type} shortLabel />,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '15%',
            align: 'right',
            render: (_, record) => (
                <AdminIconActionGroup>
                    {collectAllActionButtons(record)}
                </AdminIconActionGroup>
            ),
        },
    ];

    return (
        <div className={cx('manager-order')}>
            <h1>Đơn hàng của tôi</h1>
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="orderCode"
                tableLayout="fixed"
                pagination={{ pageSize: 5 }}
                locale={{
                    emptyText: (
                        <EmptyState
                            title="Chưa có đơn hàng nào"
                            description="Khi bạn đặt hàng thành công, toàn bộ lịch sử mua hàng sẽ hiển thị ở đây kèm trạng thái, thanh toán và thao tác tiếp theo."
                            icon={<ShoppingOutlined />}
                            actions={[
                                {
                                    label: 'Xem sản phẩm',
                                    type: 'primary',
                                    icon: <ShoppingOutlined />,
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

            <Modal
                title="Yêu cầu trả hàng/hoàn tiền"
                open={isReturnModalOpen}
                onOk={handleReturnOk}
                onCancel={handleReturnCancel}
                okText="Gửi yêu cầu"
                cancelText="Hủy"
                confirmLoading={isSubmittingReturn}
            >
                <div style={{ marginBottom: '12px' }}>
                    {returnTargetOrder && (
                        <Text type="secondary">
                            Đơn hàng: <Text strong>{returnTargetOrder.orderCode}</Text>
                        </Text>
                    )}
                </div>
                <TextArea
                    rows={4}
                    value={returnReason}
                    onChange={(event) => setReturnReason(event.target.value)}
                    placeholder="Mô tả lý do trả hàng/hoàn tiền"
                    maxLength={500}
                    style={{ resize: 'none' }}
                />
            </Modal>

            <Modal
                title={reviewModalState.mode === 'edit' ? 'Sửa đánh giá sản phẩm' : reviewModalState.review ? 'Xem đánh giá sản phẩm' : 'Đánh giá sản phẩm'}
                open={reviewModalState.open}
                onOk={submitReviewModal}
                onCancel={closeReviewModal}
                okText={reviewModalState.mode === 'edit' ? 'Cập nhật' : 'Gửi đánh giá'}
                cancelText="Hủy"
                width={500}
                footer={reviewModalState.mode === 'view'
                    ? [
                        <Button key="close" onClick={closeReviewModal}>
                            Đóng
                        </Button>,
                        reviewModalState.review?.canEdit ? (
                            <Button key="edit" type="primary" onClick={startEditReview}>
                                Sửa đánh giá
                            </Button>
                        ) : null,
                    ].filter(Boolean)
                    : undefined}
            >
                {reviewModalState.product && (
                    <div className={cx('rating-container')}>
                        <div className={cx('product-info')}>
                            <Image
                                src={getFirstResolvedImage(reviewModalState.product.images)}
                                width={80}
                                height={80}
                                style={{ objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div>
                                <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                                    {reviewModalState.product.product.name}
                                </Text>
                                <Text type="secondary">Số lượng: {reviewModalState.product.quantity}</Text>
                            </div>
                        </div>

                        {reviewModalState.mode === 'view' ? (
                            <div className={cx('review-view')}>
                                <div className={cx('review-view-row')}>
                                    <Text strong>Đánh giá sao</Text>
                                    <Rate disabled value={reviewModalState.review.rating} />
                                </div>
                                <div className={cx('review-view-row')}>
                                    <Text strong>Nội dung</Text>
                                    <div className={cx('review-content')}>{reviewModalState.review.content}</div>
                                </div>
                            </div>
                        ) : (
                            <Form form={reviewForm} layout="vertical">
                                <Form.Item
                                    name="rating"
                                    label={<Text strong>Đánh giá sao</Text>}
                                    rules={[{ required: true, message: 'Vui lòng đánh giá sao' }]}
                                >
                                    <Rate allowHalf style={{ fontSize: '32px' }} />
                                </Form.Item>

                                <Form.Item
                                    name="content"
                                    label={<Text strong>Nội dung đánh giá</Text>}
                                    rules={[{ required: true, message: 'Vui lòng nhập nội dung đánh giá' }]}
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm"
                                        style={{ resize: 'none' }}
                                    />
                                </Form.Item>
                            </Form>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal chi tiết đơn hàng */}
            <Modal
                title={`Chi tiết đơn hàng — ${orderDetailModal.order?.orderCode || ''}`}
                open={orderDetailModal.open}
                onCancel={closeOrderDetail}
                footer={<Button onClick={closeOrderDetail}>Đóng</Button>}
                width={640}
            >
                {orderDetailModal.order && (() => {
                    const o = orderDetailModal.order;
                    const fmt = (d) => d ? dayjs(d).format('HH:mm DD/MM/YYYY') : '—';
                    return (
                        <Space direction="vertical" style={{ width: '100%' }} size={0}>
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Mã đơn hàng">{o.orderCode}</Descriptions.Item>
                                <Descriptions.Item label="Ngày đặt">{fmt(o.orderDate)}</Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">{renderOrderStatus(o.status)}</Descriptions.Item>
                                <Descriptions.Item label="Tổng tiền">
                                    <Text strong type="danger">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.totalAmount)}
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Hình thức thanh toán">{o.paymentMethod}</Descriptions.Item>
                            </Descriptions>

                            <Divider orientation="left" style={{ fontSize: 13 }}>Thời gian xử lý</Divider>
                            <Descriptions column={1} bordered size="small">
                                {o.deliveredAt && <Descriptions.Item label="Đã giao lúc">{fmt(o.deliveredAt)}</Descriptions.Item>}
                                {o.completedAt && <Descriptions.Item label="Hoàn thành lúc">{fmt(o.completedAt)}</Descriptions.Item>}
                                {o.cancelledAt && <Descriptions.Item label="Đã hủy lúc">{fmt(o.cancelledAt)}</Descriptions.Item>}
                                {o.returnRequestedAt && <Descriptions.Item label="Yêu cầu trả hàng lúc">{fmt(o.returnRequestedAt)}</Descriptions.Item>}
                                {o.returnRejectedAt && (
                                    <Descriptions.Item label="Từ chối yêu cầu lúc">
                                        <Text type="danger">{fmt(o.returnRejectedAt)}</Text>
                                    </Descriptions.Item>
                                )}
                                {o.returnedAt && <Descriptions.Item label="Nhận hàng hoàn lúc">{fmt(o.returnedAt)}</Descriptions.Item>}
                                {o.refundedAt && <Descriptions.Item label="Hoàn tiền lúc">{fmt(o.refundedAt)}</Descriptions.Item>}
                            </Descriptions>

                            {(o.returnReason || o.adminNote) && (
                                <>
                                    <Divider orientation="left" style={{ fontSize: 13 }}>Thông tin trả hàng/hoàn tiền</Divider>
                                    <Descriptions column={1} bordered size="small">
                                        {o.returnReason && (
                                            <Descriptions.Item label="Lý do yêu cầu">{o.returnReason}</Descriptions.Item>
                                        )}
                                        {o.adminNote && (
                                            <Descriptions.Item label="Lý do từ chối">
                                                <Text type="danger" strong>{o.adminNote}</Text>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </>
                            )}

                            <Divider orientation="left" style={{ fontSize: 13 }}>Sản phẩm trong đơn</Divider>
                            {o.products.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: idx < o.products.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                    <button
                                        type="button"
                                        onClick={() => { closeOrderDetail(); openProductDetail(item); }}
                                        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        <Image
                                            src={getFirstResolvedImage(item.images)}
                                            width={56} height={56}
                                            style={{ objectFit: 'cover', borderRadius: 4 }}
                                            preview={false}
                                        />
                                    </button>
                                    <div style={{ flex: 1 }}>
                                        <button
                                            type="button"
                                            onClick={() => { closeOrderDetail(); openProductDetail(item); }}
                                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontWeight: 500, textAlign: 'left', textDecoration: 'none', color: 'inherit' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                                        >
                                            {item.product?.name}
                                        </button>
                                        <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>Số lượng: {item.quantity}</div>
                                    </div>
                                    <Text strong type="danger" style={{ whiteSpace: 'nowrap' }}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.lineTotal)}
                                    </Text>
                                </div>
                            ))}
                        </Space>
                    );
                })()}
            </Modal>
        </div>
    );
}

export default ManagerOrder;

