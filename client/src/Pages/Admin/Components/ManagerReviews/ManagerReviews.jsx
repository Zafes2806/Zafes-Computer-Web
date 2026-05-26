import { useCallback, useEffect, useRef, useState } from 'react';
import { Table, Space, Button, Modal, Input, Select, Rate, message, DatePicker, Empty } from 'antd';
import {
    DeleteOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    StopOutlined,
    RollbackOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';
import dayjs from 'dayjs';

import styles from './ManagerReviews.module.scss';
import {
    requestDeleteAdminReview,
    requestDeleteAdminReviewPermanently,
    requestGetAdminReviews,
    requestRestoreAdminReview,
    requestUpdateAdminReviewStatus,
} from '../../../../api';
import { getFirstResolvedImage } from '../../../../lib/assetUrl';
import { AdminFilterSearch, AdminFilterSelect, AdminScopeSelect } from '../shared/AdminFilterControls';
import { AdminStatusTag } from '../shared/AdminTag';
import { getAdminManagedStatusFilterOptions } from '../shared/adminTagOptions';
import { useSearchParams } from 'react-router-dom';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';

const { RangePicker } = DatePicker;
const cx = classNames.bind(styles);
const disableFutureDate = (current) => current && current.endOf('day').isAfter(dayjs().endOf('day'));

function getReviewAvailableStatusSet(review) {
    return new Set(review?.availableStatuses || [review?.status]);
}

function canMoveReviewTo(review, nextStatus) {
    return getReviewAvailableStatusSet(review).has(nextStatus) && review?.status !== nextStatus;
}

function ManagerReviews() {
    const [searchParams] = useSearchParams();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        status: ['pending', 'approved', 'hidden', 'all'].includes(searchParams.get('status'))
            ? searchParams.get('status')
            : 'pending',
        rating: 'all',
        dateRange: null,
        scope: searchParams.get('scope') === 'trash' ? 'trash' : 'managed',
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const fetchSequenceRef = useRef(0);
    const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;

    const fetchReviews = useCallback(async (
        nextPagination = { current: paginationCurrent, pageSize: paginationPageSize },
        nextFilters = filters,
    ) => {
        const fetchSequence = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSequence;

        try {
            setLoading(true);
            const params = {
                page: nextPagination.current,
                limit: nextPagination.pageSize,
                includeDeleted: nextFilters.scope === 'trash',
                status: nextFilters.scope === 'trash' ? 'deleted' : nextFilters.status,
            };

            if (nextFilters.search.trim()) {
                params.search = nextFilters.search.trim();
            }

            if (nextFilters.rating !== 'all') {
                params.rating = Number(nextFilters.rating);
            }

            if (nextFilters.dateRange?.[0] && nextFilters.dateRange?.[1]) {
                params.startDate = nextFilters.dateRange[0].format('YYYY-MM-DD');
                params.endDate = nextFilters.dateRange[1].format('YYYY-MM-DD');
            }

            const response = await requestGetAdminReviews(params);
            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setReviews(Array.isArray(response.metadata) ? response.metadata : []);
            setPagination((prev) => ({
                ...prev,
                current: response.pagination?.page || nextPagination.current,
                pageSize: response.pagination?.limit || nextPagination.pageSize,
                total: response.pagination?.totalItems || 0,
            }));
        } catch (error) {
            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setReviews([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            message.error(error?.response?.data?.message || 'Không thể tải danh sách đánh giá');
        } finally {
            if (fetchSequence === fetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [filters, paginationCurrent, paginationPageSize]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

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

    const handleViewReview = (review) => {
        setSelectedReview(review);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedReview(null);
    };

    const handleDeleteReview = (review) => {
        Modal.confirm({
            title: 'Xóa đánh giá',
            content: `Đánh giá của "${review.user?.name || 'Người dùng đã xóa'}" sẽ chuyển vào thùng rác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteAdminReview(review.id);
                    if (selectedReview?.id === review.id) {
                        handleCloseDetailModal();
                    }
                    await fetchReviews();
                    message.success('Đã xóa đánh giá');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể xóa đánh giá sản phẩm');
                }
            },
        });
    };

    const handlePermanentDeleteReview = (review) => {
        Modal.confirm({
            title: 'Xóa vĩnh viễn đánh giá',
            content: 'Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteAdminReviewPermanently(review.id);
                    if (selectedReview?.id === review.id) {
                        handleCloseDetailModal();
                    }
                    await fetchReviews();
                    message.success('Đã xóa vĩnh viễn đánh giá');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể xóa vĩnh viễn đánh giá');
                }
            },
        });
    };

    const handleRestoreReview = async (review) => {
        try {
            await requestRestoreAdminReview(review.id);
            await fetchReviews();
            message.success('Đã khôi phục đánh giá về trạng thái ẩn');
            if (selectedReview?.id === review.id) {
                handleCloseDetailModal();
            }
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể khôi phục đánh giá');
        }
    };

    const handleUpdateStatus = async (review, status) => {
        try {
            await requestUpdateAdminReviewStatus(review.id, status);
            await fetchReviews();
            message.success('Đã cập nhật trạng thái đánh giá');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái đánh giá');
        }
    };

    const columns = [
        {
            title: 'Người đánh giá',
            key: 'user',
            width: 220,
            render: (_, record) => (
                <div className={cx('userMeta')}>
                    <span className={cx('primaryText')}>{record.user?.name || 'Người dùng không còn tồn tại'}</span>
                    <span className={cx('secondaryText')}>{record.user?.email || 'Không có email'}</span>
                    {record.user?.deletedAt && (
                        <AdminStatusTag domain="user" status="deleted" label="Tài khoản đã xóa" />
                    )}
                </div>
            ),
        },
        {
            title: 'Sản phẩm',
            key: 'product',
            width: 260,
            render: (_, record) => (
                <div className={cx('productCell')}>
                    <img
                        src={getFirstResolvedImage(record.product?.images)}
                        alt={record.product?.name || 'Sản phẩm'}
                        className={cx('productImage')}
                    />
                    <div className={cx('productMeta')}>
                        <span className={cx('primaryText')}>{record.product?.name || 'Sản phẩm không còn tồn tại'}</span>
                        <span className={cx('secondaryText')}>{record.product?.id || 'Không có mã sản phẩm'}</span>
                        {record.product?.deletedAt && (
                            <AdminStatusTag domain="product" status="deleted" label="Sản phẩm đã xóa" />
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'Đánh giá',
            key: 'review',
            render: (_, record) => (
                <div className={cx('reviewCell')}>
                    <Rate disabled value={record.rating} />
                    <div className={cx('contentPreview')}>{record.content}</div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 160,
            render: (_, record) => <AdminStatusTag domain="review" status={record.status} deletedAt={record.deletedAt} />,
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (createdAt) => dayjs(createdAt).format('HH:mm DD/MM/YYYY'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 170,
            align: 'right',
            render: (_, record) => (
                <AdminIconActionGroup>
                    <AdminIconAction
                        title="Xem chi tiết"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewReview(record)}
                        variant="view"
                    />
                    {record.deletedAt ? (
                        <>
                            <AdminIconAction
                                title="Khôi phục"
                                icon={<RollbackOutlined />}
                                onClick={() => handleRestoreReview(record)}
                            />
                            <AdminIconAction
                                title="Xóa vĩnh viễn"
                                icon={<DeleteOutlined />}
                                onClick={() => handlePermanentDeleteReview(record)}
                                variant="delete"
                            />
                        </>
                    ) : (
                        <>
                            {canMoveReviewTo(record, 'approved') && (
                                <AdminIconAction
                                    title="Duyệt"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => handleUpdateStatus(record, 'approved')}
                                    variant="activate"
                                />
                            )}
                            {canMoveReviewTo(record, 'hidden') && (
                                <AdminIconAction
                                    title="Ẩn"
                                    icon={<StopOutlined />}
                                    onClick={() => handleUpdateStatus(record, 'hidden')}
                                    variant="deactivate"
                                />
                            )}
                            <AdminIconAction
                                title="Xóa"
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteReview(record)}
                                variant="delete"
                            />
                        </>
                    )}
                </AdminIconActionGroup>
            ),
        },
    ];

    return (
        <div className="admin-page admin-card">
            <div className="admin-page-header">
                <div className="admin-page-header-main">
                    <h2 className="admin-page-title">Quản lý đánh giá</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">
                        Hiển thị {pagination.total} {filters.scope === 'trash' ? 'đánh giá trong thùng rác' : 'đánh giá'}
                    </div>
                </div>
            </div>

            <div className="admin-toolbar">
                <div className="admin-toolbar-group admin-toolbar-group-fluid">
                    <AdminScopeSelect
                        value={filters.scope}
                        onChange={(value) => handleFilterChange({ scope: value })}
                    />
                    <AdminFilterSearch
                        allowClear
                        placeholder="Tìm theo người dùng, email, sản phẩm hoặc nội dung"
                        value={filters.search}
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        onSearch={(value) => handleFilterChange({ search: value })}
                    />
                    {filters.scope !== 'trash' && (
                        <AdminFilterSelect
                            value={filters.status}
                            onChange={(value) => handleFilterChange({ status: value })}
                            options={getAdminManagedStatusFilterOptions({
                                domain: 'review',
                                includeAll: true,
                            })}
                        />
                    )}
                    <AdminFilterSelect
                        value={filters.rating}
                        onChange={(value) => handleFilterChange({ rating: value })}
                        options={[
                            { value: 'all', label: 'Tất cả số sao' },
                            { value: '5', label: '5 sao' },
                            { value: '4', label: '4 sao' },
                            { value: '3', label: '3 sao' },
                            { value: '2', label: '2 sao' },
                            { value: '1', label: '1 sao' },
                        ]}
                    />
                    {filters.scope !== 'trash' && (
                        <RangePicker
                            size="large"
                            format="DD/MM/YYYY"
                            value={filters.dateRange}
                            onChange={(value) => handleFilterChange({ dateRange: value })}
                            disabledDate={disableFutureDate}
                            placeholder={['Từ ngày', 'Đến ngày']}
                        />
                    )}
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={reviews}
                rowKey="id"
                loading={loading}
                className="admin-table"
                tableLayout="fixed"
                scroll={{ x: 1180 }}
                locale={{
                    emptyText: <Empty description="Chưa có đánh giá nào phù hợp" />,
                }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
            />

            <Modal
                title="Chi tiết đánh giá sản phẩm"
                open={isDetailModalOpen}
                onCancel={handleCloseDetailModal}
                footer={selectedReview ? [
                    selectedReview.deletedAt ? (
                        <Button key="restore" onClick={() => handleRestoreReview(selectedReview)}>
                            Khôi phục
                        </Button>
                    ) : (
                        <>
                            {canMoveReviewTo(selectedReview, 'approved') && (
                                <Button key="approve" onClick={() => handleUpdateStatus(selectedReview, 'approved')}>
                                    Duyệt
                                </Button>
                            )}
                            {canMoveReviewTo(selectedReview, 'hidden') && (
                                <Button key="hide" onClick={() => handleUpdateStatus(selectedReview, 'hidden')}>
                                    Ẩn
                                </Button>
                            )}
                            <Button key="delete" danger onClick={() => handleDeleteReview(selectedReview)}>
                                Xóa
                            </Button>
                        </>
                    ),
                    <Button key="close" type="primary" onClick={handleCloseDetailModal}>
                        Đóng
                    </Button>,
                ].flat() : null}
                width={760}
            >
                {selectedReview && (
                    <div className={cx('detailGrid')}>
                        <div className={cx('detailCard')}>
                            <div className={cx('detailHeader')}>
                                <img
                                    src={getFirstResolvedImage(selectedReview.product?.images)}
                                    alt={selectedReview.product?.name || 'Sản phẩm'}
                                    className={cx('detailImage')}
                                />
                                <div className={cx('productMeta')}>
                                    <span className={cx('primaryText')}>
                                        {selectedReview.product?.name || 'Sản phẩm không còn tồn tại'}
                                    </span>
                                    <span className={cx('secondaryText')}>
                                        Mã sản phẩm: {selectedReview.product?.id || 'Không có'}
                                    </span>
                                    <AdminStatusTag
                                        domain="review"
                                        status={selectedReview.status}
                                        deletedAt={selectedReview.deletedAt}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={cx('detailCard')}>
                            <div>
                                <p className={cx('detailLabel')}>Người đánh giá</p>
                                <p className={cx('detailContent')}>
                                    {selectedReview.user?.name || 'Người dùng không còn tồn tại'}
                                </p>
                                <p className={cx('detailContent')}>{selectedReview.user?.email || 'Không có email'}</p>
                            </div>

                            <div>
                                <p className={cx('detailLabel')}>Số sao</p>
                                <Rate disabled value={selectedReview.rating} />
                            </div>

                            <div>
                                <p className={cx('detailLabel')}>Thời gian đánh giá</p>
                                <p className={cx('detailContent')}>
                                    {dayjs(selectedReview.createdAt).format('HH:mm DD/MM/YYYY')}
                                </p>
                            </div>
                        </div>

                        <div className={cx('detailCard')}>
                            <div>
                                <p className={cx('detailLabel')}>Nội dung đánh giá</p>
                                <p className={cx('detailContent')}>{selectedReview.content}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ManagerReviews;

