import { useCallback, useState, useEffect, useRef } from 'react';
import { Table, Space, Button, Modal, Descriptions, Divider, Select, Image, message, DatePicker, Input, Popconfirm } from 'antd';
import { SwapRightOutlined, EyeOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerOrder.module.scss';
import { AdminFilterSearch, AdminFilterSelect, AdminWideFilterSelect } from '../shared/AdminFilterControls';
import AdminProductDetailModal from '../shared/AdminProductDetailModal';
import { buildProductDetailFooter } from '../shared/adminProductDetail';
import {
    requestGetCategory,
    requestGetOrderAdmin,
    requestGetProductById,
    requestMarkPaymentRefundProcessed,
    requestUpdateOrderStatus,
} from '../../../../api';
import {
    ORDER_STATUS_OPTIONS,
    getOrderStatusLabel,
} from '../../../../constants/orderStatus';
import { getPaymentTypeLabel } from '../../../../constants/paymentTypes';
import { PAYMENT_TYPE_CONFIG } from '../../../../constants/paymentTypes';
import { COMPONENT_TYPE_LABELS, getBaseComponentType } from '../../../../constants/componentTypes';
import { getFirstResolvedImage } from '../../../../lib/assetUrl';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';
import { AdminStatusTag } from '../shared/AdminTag';
import {
    getAdminPaymentAttemptStatusOptions,
    getAdminPaymentTypeSelectOptions,
    getAdminStatusFilterOptions,
    getAdminStatusInlineOptions,
} from '../shared/adminTagOptions';
import { getAdminStatusMeta } from '../shared/adminTagMeta';

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;
const disableFutureDate = (current) => current && current.endOf('day').isAfter(dayjs().endOf('day'));

const getProductTypeLabel = (type = '') => {
    const normalizedType = getBaseComponentType(type || '');
    return COMPONENT_TYPE_LABELS[normalizedType] || normalizedType || 'Khác';
};

const buildOrderSnapshotDetailProduct = (product) => ({
    id: product?.id,
    name: product?.name || 'Sản phẩm',
    price: Number(product?.originalPrice ?? product?.unitPrice ?? product?.price ?? 0),
    unitPrice: Number(product?.unitPrice ?? product?.price ?? 0),
    originalPrice: Number(product?.originalPrice ?? product?.unitPrice ?? product?.price ?? 0),
    discount: Number(product?.discount || 0),
    images: product?.images || product?.image,
    componentType: product?.componentType || null,
    categoryId: product?.categoryId || null,
    categoryName: product?.categoryName || null,
    description: product?.description || '',
    specs: Array.isArray(product?.specs) ? product.specs : [],
    pcConfiguration: product?.pcConfiguration || null,
    detailSource: product?.detailSource || 'legacy_order_item',
    snapshotTakenAt: product?.snapshotTakenAt || null,
});

const hasRichOrderSnapshot = (product) =>
    product?.detailSource === 'order_snapshot'
    && (
        Boolean(product?.description)
        || Boolean(product?.categoryName)
        || (Array.isArray(product?.specs) && product.specs.length > 0)
        || Boolean(product?.pcConfiguration)
    );

const getLatestPaymentAttempt = (order) => {
    const attempts = Array.isArray(order?.paymentAttempts) ? order.paymentAttempts : [];
    return attempts[0] || null;
};

function ManagerOrder() {
    const [searchParams] = useSearchParams();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailProduct, setDetailProduct] = useState(null);
    const [detailProductLoading, setDetailProductLoading] = useState(false);
    const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [adminCategories, setAdminCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refundProcessingAttemptId, setRefundProcessingAttemptId] = useState(null);
    const [refundNotes, setRefundNotes] = useState({});
    const [rejectModal, setRejectModal] = useState({
        open: false,
        record: null,
        adminNote: '',
        submitting: false,
    });
    const [filters, setFilters] = useState({
        status: ORDER_STATUS_OPTIONS.some((item) => item.value === searchParams.get('status'))
            ? searchParams.get('status')
            : 'all',
        search: searchParams.get('search') || '',
        paymentMethod: Object.prototype.hasOwnProperty.call(PAYMENT_TYPE_CONFIG, searchParams.get('paymentMethod') || '')
            ? searchParams.get('paymentMethod')
            : 'all',
        paymentAttemptStatus: searchParams.get('paymentAttemptStatus') || 'all',
        dateRange: null,
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const orderFetchSequenceRef = useRef(0);
    const categoryFetchSequenceRef = useRef(0);
    const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;

    const fetchOrders = useCallback(async (
        nextPagination = { current: paginationCurrent, pageSize: paginationPageSize },
        nextFilters = filters,
    ) => {
        const fetchSequence = orderFetchSequenceRef.current + 1;
        orderFetchSequenceRef.current = fetchSequence;

        try {
            setLoading(true);
            const params = {
                page: nextPagination.current,
                limit: nextPagination.pageSize,
            };

            if (nextFilters.status !== 'all') {
                params.status = nextFilters.status;
            }
            if (nextFilters.paymentMethod !== 'all') {
                params.paymentMethod = nextFilters.paymentMethod;
            }
            if (nextFilters.paymentAttemptStatus !== 'all') {
                params.paymentAttemptStatus = nextFilters.paymentAttemptStatus;
            }
            if (nextFilters.search.trim()) {
                params.search = nextFilters.search.trim();
            }
            if (nextFilters.dateRange?.[0] && nextFilters.dateRange?.[1]) {
                params.startDate = nextFilters.dateRange[0].format('YYYY-MM-DD');
                params.endDate = nextFilters.dateRange[1].format('YYYY-MM-DD');
            }

            const response = await requestGetOrderAdmin(params);
            if (fetchSequence !== orderFetchSequenceRef.current) {
                return;
            }

            setOrders(Array.isArray(response.metadata) ? response.metadata : []);
            setPagination((prev) => ({
                ...prev,
                current: response.pagination?.page || nextPagination.current,
                pageSize: response.pagination?.limit || nextPagination.pageSize,
                total: response.pagination?.totalItems || 0,
            }));
        } catch (error) {
            if (fetchSequence !== orderFetchSequenceRef.current) {
                return;
            }

            setOrders([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            message.error(error?.response?.data?.message || 'Lỗi khi tải danh sách đơn hàng');
        } finally {
            if (fetchSequence === orderFetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [filters, paginationCurrent, paginationPageSize]);

    const fetchAdminCategories = useCallback(async () => {
        const fetchSequence = categoryFetchSequenceRef.current + 1;
        categoryFetchSequenceRef.current = fetchSequence;

        try {
            const response = await requestGetCategory({
                limit: 100,
                includeDeleted: true,
                status: 'all',
            });
            if (fetchSequence !== categoryFetchSequenceRef.current) {
                return;
            }

            setAdminCategories(Array.isArray(response.metadata) ? response.metadata : []);
        } catch (error) {
            if (fetchSequence !== categoryFetchSequenceRef.current) {
                return;
            }

            setAdminCategories([]);
            message.error(error?.response?.data?.message || 'Lỗi khi tải danh mục sản phẩm');
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        fetchAdminCategories();
    }, [fetchAdminCategories]);

    const handleFilterChange = (changes) => {
        const nextFilters = { ...filters, ...changes };
        const nextPagination = { ...pagination, current: 1 };
        setLoading(true);
        setFilters(nextFilters);
        setPagination(nextPagination);
    };

    const handleTableChange = (nextPagination) => {
        const resolvedPagination = {
            ...pagination,
            current: nextPagination.current,
            pageSize: nextPagination.pageSize,
        };
        setLoading(true);
        setPagination(resolvedPagination);
    };

    const handleViewDetails = (record) => {
        setSelectedOrder(record);
        setIsModalVisible(true);
    };

    const handleViewProduct = async (product) => {
        if (!product?.id && !product?.name) {
            message.warning('Không có đủ dữ liệu để hiển thị chi tiết sản phẩm');
            return;
        }

        const archivedProduct = buildOrderSnapshotDetailProduct(product);
        setIsProductDetailOpen(true);
        setDetailProduct(archivedProduct);

        if (hasRichOrderSnapshot(product) || !product?.id) {
            setDetailProductLoading(false);
            return;
        }

        setDetailProductLoading(true);

        try {
            const res = await requestGetProductById(product.id, { includeDeleted: true });
            const liveProduct = res.metadata?.product;

            if (liveProduct) {
                setDetailProduct((prev) => ({
                    ...liveProduct,
                    ...prev,
                    images: prev?.images || liveProduct.images,
                    categoryId: prev?.categoryId || liveProduct.categoryId,
                    categoryName: prev?.categoryName || adminCategories.find((item) => item.id === liveProduct.categoryId)?.name || null,
                    componentType: prev?.componentType || liveProduct.componentType,
                    description: prev?.description || liveProduct.description || '<p>Thông tin sản phẩm được lưu từ đơn hàng.</p>',
                    specs: Array.isArray(prev?.specs) && prev.specs.length > 0 ? prev.specs : (liveProduct.specs || []),
                    pcConfiguration: prev?.pcConfiguration || liveProduct.pcConfiguration || null,
                    detailSource: prev?.detailSource || 'legacy_order_item',
                }));
            }
        } catch {
            setDetailProduct((prev) => ({
                ...prev,
                description: prev?.description || '<p>Không thể tải dữ liệu chi tiết mới nhất.</p>',
            }));
        } finally {
            setDetailProductLoading(false);
        }
    };

    const handleCloseProductDetail = () => {
        setIsProductDetailOpen(false);
        setDetailProduct(null);
        setDetailProductLoading(false);
    };

    const getCategoryName = (categoryId, product = null) =>
        adminCategories.find((item) => item.id === categoryId)?.name || product?.categoryName || 'Chưa phân loại';

    const handleStatusChange = async (newStatus, record) => {
        // Nếu chọn "Từ chối trả hàng" → mở modal nhập lý do bắt buộc
        if (newStatus === 'return_rejected') {
            setRejectModal({ open: true, record, adminNote: '', submitting: false });
            return;
        }

        try {
            await requestUpdateOrderStatus({
                orderId: record.id,
                status: newStatus,
            });
            message.success('Cập nhật trạng thái thành công');
            fetchOrders();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    const handleConfirmReject = async () => {
        const normalizedNote = rejectModal.adminNote.trim();
        if (!normalizedNote) {
            message.error('Vui lòng nhập lý do từ chối');
            return;
        }

        setRejectModal((prev) => ({ ...prev, submitting: true }));
        try {
            await requestUpdateOrderStatus({
                orderId: rejectModal.record.id,
                status: 'return_rejected',
                adminNote: normalizedNote,
            });
            message.success('Đã từ chối yêu cầu trả hàng/hoàn tiền');
            setRejectModal({ open: false, record: null, adminNote: '', submitting: false });
            fetchOrders();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi từ chối yêu cầu');
            setRejectModal((prev) => ({ ...prev, submitting: false }));
        }
    };

    const handleCancelReject = () => {
        if (rejectModal.submitting) return;
        setRejectModal({ open: false, record: null, adminNote: '', submitting: false });
    };

    const replaceAttemptInOrder = (order, attemptId, patch) => {
        if (!Array.isArray(order?.paymentAttempts)) {
            return order;
        }

        return {
            ...order,
            paymentAttempts: order.paymentAttempts.map((attempt) =>
                attempt.id === attemptId ? { ...attempt, ...patch } : attempt,
            ),
            hasRefundRequired: order.paymentAttempts.some((attempt) =>
                attempt.id === attemptId ? patch.status === 'requires_refund' : attempt.status === 'requires_refund',
            ),
        };
    };

    const handleMarkRefundProcessed = async (attempt) => {
        try {
            setRefundProcessingAttemptId(attempt.id);
            const refundNote = refundNotes[attempt.id] || '';
            await requestMarkPaymentRefundProcessed(attempt.id, { refundNote });
            const patch = {
                status: 'refunded',
                refundNote: refundNote.trim() || null,
                refundedAt: new Date().toISOString(),
            };

            setOrders((prevOrders) => prevOrders.map((order) => replaceAttemptInOrder(order, attempt.id, patch)));
            setSelectedOrder((prevOrder) => (prevOrder ? replaceAttemptInOrder(prevOrder, attempt.id, patch) : prevOrder));
            message.success('Đã ghi nhận xử lý hoàn tiền');
            fetchOrders();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể ghi nhận xử lý hoàn tiền');
        } finally {
            setRefundProcessingAttemptId(null);
        }
    };

    const getSelectableStatuses = (record) => {
        if (record.availableStatuses?.length) {
            return record.availableStatuses;
        }

        return [record.status];
    };

    const isWrapStatus = (status) => getOrderStatusLabel(status).length >= 14;

    const columns = [
        {
            title: 'Đơn hàng',
            key: 'order',
            width: 145,
            render: (_, record) => (
                <div className="admin-cell-stack">
                    <span className={`admin-cell-title admin-cell-clamp-2 ${cx('orderCode')}`} title={record.orderCode}>
                        {record.orderCode}
                    </span>
                    <span className="admin-cell-subtitle">
                        {dayjs(record.createdAt).format('HH:mm DD/MM/YYYY')}
                    </span>
                    {record.hasRefundRequired && (
                        <AdminStatusTag domain="paymentAttempt" status="requires_refund" className={cx('refund-tag')} />
                    )}
                </div>
            ),
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 180,
            render: (_, record) => (
                <div className="admin-cell-stack">
                    <span className="admin-cell-title admin-cell-clamp-2" title={record.fullName}>
                        {record.fullName}
                    </span>
                    <span className="admin-cell-subtitle">SĐT: {record.phone}</span>
                    {record.email && <span className="admin-cell-subtitle">{record.email}</span>}
                </div>
            ),
        },
        {
            title: 'Sản phẩm',
            key: 'products',
            width: 250,
            render: (_, record) => {
                const products = Array.isArray(record.products) ? record.products : [];

                if (!products.length) {
                    return <span className="admin-cell-subtitle">Không có sản phẩm</span>;
                }

                return (
                    <div className={cx('table-products')}>
                        <div className={cx('table-products-count')}>
                            {products.length} sản phẩm
                        </div>
                        <div className={cx('table-products-scroll')}>
                            {products.map((product, index) => (
                                <div key={`${product.id || product.name}-${index}`} className={cx('table-product-item')}>
                                    <button
                                        type="button"
                                        className={cx('product-trigger')}
                                        onClick={() => handleViewProduct(product)}
                                        disabled={!product.id}
                                    >
                                        <img
                                            src={getFirstResolvedImage(product.image)}
                                            alt={product.name}
                                            className={cx('table-product-image')}
                                        />
                                    </button>
                                    <div className={cx('table-product-meta')}>
                                        <button
                                            type="button"
                                            className={cx('product-trigger', 'product-name-trigger')}
                                            onClick={() => handleViewProduct(product)}
                                            disabled={!product.id}
                                            title={product.name}
                                        >
                                            <span className={cx('table-product-name')}>{product.name}</span>
                                        </button>
                                        <div className={cx('table-product-details-row')}>
                                            <span className={cx('table-product-type')}>
                                                {getProductTypeLabel(product.componentType)}
                                            </span>
                                            <span className={cx('table-product-quantity')}>
                                                SL: {product.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: 120,
            align: 'right',
            render: (price) => <span className={cx('price')}>{price.toLocaleString('vi-VN')}đ</span>,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            dataIndex: 'status',
            width: 150,
            render: (status, record) => (
                <Select
                    value={status}
                    size="large"
                    style={{ width: '100%' }}
                    onChange={(newStatus) => handleStatusChange(newStatus, record)}
                    className={cx('status-select', { 'status-select-wrap': isWrapStatus(status) })}
                    popupClassName={cx('status-select-dropdown')}
                    disabled={getSelectableStatuses(record).length <= 1}
                    options={getAdminStatusInlineOptions({
                        domain: 'order',
                        values: getSelectableStatuses(record),
                    })}
                />
            ),
        },
        {
            title: 'Thanh toán',
            key: 'paymentAttempt',
            width: 150,
            render: (_, record) => {
                const latestAttempt = getLatestPaymentAttempt(record);

                if (!latestAttempt) {
                    return <span className="admin-cell-subtitle">Chưa có giao dịch</span>;
                }

                return (
                    <div className="admin-cell-stack">
                        <AdminStatusTag domain="paymentAttempt" status={latestAttempt.status} />
                        <span className="admin-cell-subtitle">
                            {latestAttempt.provider} · {dayjs(latestAttempt.updatedAt).format('HH:mm DD/MM')}
                        </span>
                    </div>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 84,
            align: 'right',
            render: (_, record) => (
                <AdminIconActionGroup>
                    <AdminIconAction
                        title="Xem chi tiết"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record)}
                        variant="view"
                        className={cx('action-button')}
                    />
                </AdminIconActionGroup>
            ),
        },
    ];

    return (
        <div className={`${cx('wrapper')} admin-page admin-card`}>
            <div className={`${cx('header')} admin-page-header`}>
                <div className="admin-page-header-main">
                    <h2 className={`admin-page-title ${cx('title')}`}>Quản lý đơn hàng</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">Hiển thị {pagination.total} đơn hàng</div>
                </div>
            </div>

            <div className={`${cx('filters')} admin-toolbar`}>
                <div className="admin-toolbar-group admin-toolbar-group-fluid">
                    <AdminFilterSelect
                        placeholder="Lọc theo trạng thái"
                        value={filters.status}
                        onChange={(value) => handleFilterChange({ status: value })}
                        options={getAdminStatusFilterOptions({
                            domain: 'order',
                            values: ORDER_STATUS_OPTIONS.map((status) => status.value),
                            includeAll: true,
                        })}
                    />
                    <AdminWideFilterSelect
                        placeholder="Phương thức thanh toán"
                        value={filters.paymentMethod}
                        onChange={(value) => handleFilterChange({ paymentMethod: value })}
                        options={getAdminPaymentTypeSelectOptions({
                            includeAll: true,
                            shortLabel: true,
                        })}
                    />
                    <AdminWideFilterSelect
                        placeholder="Trạng thái giao dịch"
                        value={filters.paymentAttemptStatus}
                        onChange={(value) => handleFilterChange({ paymentAttemptStatus: value })}
                        options={getAdminPaymentAttemptStatusOptions({
                            includeAll: true,
                        })}
                    />
                    <AdminFilterSearch
                        placeholder="Tìm theo mã đơn, tên khách, email hoặc số điện thoại"
                        allowClear
                        value={filters.search}
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        onSearch={(value) => handleFilterChange({ search: value })}
                    />
                    <RangePicker
                        size="large"
                        style={{ width: 310, maxWidth: '100%' }}
                        placeholder={['Từ ngày', 'Đến ngày']}
                        value={filters.dateRange}
                        onChange={(value) => handleFilterChange({ dateRange: value })}
                        disabledDate={disableFutureDate}
                        format="DD/MM/YYYY"
                        separator={<SwapRightOutlined className={cx('range-separator-icon')} />}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                tableLayout="fixed"
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                loading={loading}
                onChange={handleTableChange}
                rowClassName={(record) => (record.hasRefundRequired ? cx('refund-required-row') : '')}
                className={`${cx('order-table')} admin-table`}
            />

            <Modal
                title={<div className={cx('modal-title')}>Chi tiết đơn hàng — {selectedOrder?.orderCode}</div>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={<Button onClick={() => setIsModalVisible(false)}>Đóng</Button>}
                width={740}
                className={cx('order-modal')}
            >
                {selectedOrder && (() => {
                    const fmt = (d) => d ? dayjs(d).format('HH:mm DD/MM/YYYY') : '—';
                    return (
                        <Space direction="vertical" style={{ width: '100%' }} size={0}>

                            {/* Thông tin đơn hàng */}
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Mã đơn hàng">{selectedOrder.orderCode}</Descriptions.Item>
                                <Descriptions.Item label="Ngày đặt hàng">{fmt(selectedOrder.createdAt)}</Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <AppTag color={getOrderStatusColor(selectedOrder.status)}>
                                        {getOrderStatusLabel(selectedOrder.status)}
                                    </AppTag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Tổng tiền">
                                    <span style={{ fontWeight: 600, color: '#cf1322' }}>
                                        {selectedOrder.totalPrice.toLocaleString('vi-VN')}đ
                                    </span>
                                </Descriptions.Item>
                                <Descriptions.Item label="Phương thức thanh toán">
                                    {getPaymentTypeLabel(selectedOrder.paymentMethod)}
                                </Descriptions.Item>
                            </Descriptions>

                            {/* Thông tin khách hàng */}
                            <Divider orientation="left" style={{ fontSize: 13 }}>Thông tin khách hàng</Divider>
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Họ tên">{selectedOrder.fullName}</Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại">{selectedOrder.phone}</Descriptions.Item>
                                {selectedOrder.email && (
                                    <Descriptions.Item label="Email">{selectedOrder.email}</Descriptions.Item>
                                )}
                                <Descriptions.Item label="Địa chỉ">{selectedOrder.address}</Descriptions.Item>
                            </Descriptions>

                            {/* Thời gian xử lý */}
                            {(selectedOrder.deliveredAt || selectedOrder.completedAt || selectedOrder.cancelledAt ||
                              selectedOrder.returnRequestedAt || selectedOrder.returnRejectedAt ||
                              selectedOrder.returnedAt || selectedOrder.refundedAt) && (
                                <>
                                    <Divider orientation="left" style={{ fontSize: 13 }}>Thời gian xử lý</Divider>
                                    <Descriptions column={1} bordered size="small">
                                        {selectedOrder.deliveredAt && (
                                            <Descriptions.Item label="Đã giao lúc">{fmt(selectedOrder.deliveredAt)}</Descriptions.Item>
                                        )}
                                        {selectedOrder.completedAt && (
                                            <Descriptions.Item label="Hoàn thành lúc">{fmt(selectedOrder.completedAt)}</Descriptions.Item>
                                        )}
                                        {selectedOrder.cancelledAt && (
                                            <Descriptions.Item label="Đã hủy lúc">{fmt(selectedOrder.cancelledAt)}</Descriptions.Item>
                                        )}
                                        {selectedOrder.returnRequestedAt && (
                                            <Descriptions.Item label="Yêu cầu trả hàng lúc">{fmt(selectedOrder.returnRequestedAt)}</Descriptions.Item>
                                        )}
                                        {selectedOrder.returnRejectedAt && (
                                            <Descriptions.Item label="Từ chối yêu cầu lúc">
                                                <span style={{ color: '#cf1322' }}>{fmt(selectedOrder.returnRejectedAt)}</span>
                                            </Descriptions.Item>
                                        )}
                                        {selectedOrder.returnedAt && (
                                            <Descriptions.Item label="Nhận hàng hoàn lúc">{fmt(selectedOrder.returnedAt)}</Descriptions.Item>
                                        )}
                                        {selectedOrder.refundedAt && (
                                            <Descriptions.Item label="Hoàn tiền lúc">{fmt(selectedOrder.refundedAt)}</Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </>
                            )}

                            {/* Thông tin trả hàng / từ chối */}
                            {(selectedOrder.returnReason || selectedOrder.adminNote) && (
                                <>
                                    <Divider orientation="left" style={{ fontSize: 13 }}>Thông tin trả hàng / hoàn tiền</Divider>
                                    <Descriptions column={1} bordered size="small">
                                        {selectedOrder.returnReason && (
                                            <Descriptions.Item label="Lý do yêu cầu của khách">
                                                {selectedOrder.returnReason}
                                            </Descriptions.Item>
                                        )}
                                        {selectedOrder.adminNote && (
                                            <Descriptions.Item label="Lý do từ chối (Admin)">
                                                <span style={{ color: '#cf1322', fontWeight: 500 }}>
                                                    {selectedOrder.adminNote}
                                                </span>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </>
                            )}

                            {/* Sản phẩm */}
                            <Divider orientation="left" style={{ fontSize: 13 }}>Sản phẩm trong đơn</Divider>
                            {selectedOrder.products.map((product, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: 12,
                                    alignItems: 'center',
                                    padding: '10px 0',
                                    borderBottom: index < selectedOrder.products.length - 1 ? '1px solid #f0f0f0' : 'none',
                                }}>
                                    <Image
                                        src={getFirstResolvedImage(product.image)}
                                        alt={product.name}
                                        width={64}
                                        height={64}
                                        style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 500, marginBottom: 2 }}>{product.name}</div>
                                        <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                                            Loại: {getProductTypeLabel(product.componentType)} · Số lượng: {product.quantity}
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 600, color: '#cf1322', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {product.price.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            ))}

                            {/* Giao dịch thanh toán */}
                            <Divider orientation="left" style={{ fontSize: 13 }}>Giao dịch thanh toán</Divider>
                            {Array.isArray(selectedOrder.paymentAttempts) && selectedOrder.paymentAttempts.length > 0 ? (
                                <Space direction="vertical" className={cx('payment-attempts-list')} style={{ width: '100%' }}>
                                    {selectedOrder.paymentAttempts.map((attempt) => (
                                        <div key={attempt.id} className={cx('payment-attempt-item')}>
                                            <div className={cx('payment-attempt-header')}>
                                                <span>{getAdminStatusMeta({ domain: 'paymentAttempt', status: attempt.status }).label}</span>
                                                <span>{attempt.provider}</span>
                                                <span>{Number(attempt.amount || 0).toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            <div className={cx('payment-attempt-meta')}>
                                                Request: {attempt.gatewayRequestId || '---'}
                                            </div>
                                            <div className={cx('payment-attempt-meta')}>
                                                Transaction: {attempt.gatewayTransactionId || '---'}
                                            </div>
                                            {attempt.failureReason && (
                                                <div className={cx('payment-attempt-reason')}>
                                                    {attempt.failureReason}
                                                </div>
                                            )}
                                            {attempt.status === 'requires_refund' && (
                                                <div className={cx('payment-refund-action')}>
                                                    <Input.TextArea
                                                        value={refundNotes[attempt.id] || ''}
                                                        onChange={(event) =>
                                                            setRefundNotes((prev) => ({
                                                                ...prev,
                                                                [attempt.id]: event.target.value,
                                                            }))
                                                        }
                                                        maxLength={1000}
                                                        autoSize={{ minRows: 2, maxRows: 4 }}
                                                        placeholder="Ghi chú mã giao dịch hoàn tiền, thời điểm hoặc người xử lý"
                                                    />
                                                    <Popconfirm
                                                        title="Xác nhận đã hoàn tiền"
                                                        description="Chỉ xác nhận sau khi tiền đã được hoàn qua cổng thanh toán hoặc quy trình thủ công."
                                                        okText="Đã hoàn tiền"
                                                        cancelText="Hủy"
                                                        onConfirm={() => handleMarkRefundProcessed(attempt)}
                                                    >
                                                        <Button
                                                            type="primary"
                                                            icon={<CheckCircleOutlined />}
                                                            loading={refundProcessingAttemptId === attempt.id}
                                                        >
                                                            Đánh dấu đã hoàn tiền
                                                        </Button>
                                                    </Popconfirm>
                                                </div>
                                            )}
                                            {attempt.status === 'refunded' && (
                                                <div className={cx('payment-attempt-meta')}>
                                                    Đã hoàn tiền: {attempt.refundedAt ? dayjs(attempt.refundedAt).format('HH:mm DD/MM/YYYY') : '---'}
                                                    {attempt.refundNote ? ` · ${attempt.refundNote}` : ''}
                                                </div>
                                            )}
                                            <div className={cx('payment-attempt-meta')}>
                                                Cập nhật: {dayjs(attempt.updatedAt).format('HH:mm DD/MM/YYYY')}
                                            </div>
                                        </div>
                                    ))}
                                </Space>
                            ) : (
                                <span style={{ color: 'rgba(0,0,0,0.45)' }}>Chưa có giao dịch thanh toán</span>
                            )}

                        </Space>
                    );
                })()}
            </Modal>


            <AdminProductDetailModal
                open={isProductDetailOpen}
                loading={detailProductLoading}
                product={detailProduct}
                onClose={handleCloseProductDetail}
                getCategoryName={getCategoryName}
                footer={buildProductDetailFooter([], handleCloseProductDetail)}
            />

            {/* Modal từ chối yêu cầu trả hàng */}
            <Modal
                title={
                    <Space>
                        <StopOutlined style={{ color: '#cf1322' }} />
                        <span>Từ chối yêu cầu trả hàng/hoàn tiền</span>
                    </Space>
                }
                open={rejectModal.open}
                onOk={handleConfirmReject}
                onCancel={handleCancelReject}
                okText="Xác nhận từ chối"
                cancelText="Hủy bỏ"
                okButtonProps={{ danger: true, loading: rejectModal.submitting }}
                cancelButtonProps={{ disabled: rejectModal.submitting }}
                closable={!rejectModal.submitting}
                maskClosable={!rejectModal.submitting}
                width={480}
            >
                {rejectModal.record && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <p style={{ marginBottom: 4 }}>
                            Đơn hàng: <strong>{rejectModal.record.orderCode}</strong>
                        </p>
                        <p style={{ marginBottom: 4 }}>
                            Khách hàng: <strong>{rejectModal.record.fullName}</strong>
                        </p>
                        {rejectModal.record.returnReason && (
                            <p style={{ marginBottom: 8, color: 'rgba(0,0,0,0.65)' }}>
                                Lý do KH yêu cầu: <em>{rejectModal.record.returnReason}</em>
                            </p>
                        )}
                        <p style={{ marginBottom: 4, fontWeight: 500, color: '#cf1322' }}>
                            Vui lòng nhập lý do từ chối để khách hàng biết: <span style={{ color: '#cf1322' }}>*</span>
                        </p>
                        <Input.TextArea
                            value={rejectModal.adminNote}
                            onChange={(e) => setRejectModal((prev) => ({ ...prev, adminNote: e.target.value }))}
                            placeholder="Ví dụ: Sản phẩm không có dấu hiệu lỗi, hàng đã qua sử dụng quá 7 ngày..."
                            maxLength={1000}
                            showCount
                            autoSize={{ minRows: 3, maxRows: 6 }}
                            disabled={rejectModal.submitting}
                        />
                    </Space>
                )}
            </Modal>
        </div>
    );
}

export default ManagerOrder;

