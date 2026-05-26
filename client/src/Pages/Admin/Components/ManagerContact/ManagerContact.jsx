import { useCallback, useEffect, useRef, useState } from 'react';
import { Table, Card, Typography, Space, Button, Modal, message, Select, Input, Form, DatePicker } from 'antd';
import { PhoneOutlined, EyeOutlined, DeleteOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    requestDeleteContact,
    requestDeleteContactPermanently,
    requestGetContacts,
    requestRestoreContact,
    requestUpdateContact,
} from '../../../../api';
import classNames from 'classnames/bind';
import styles from './ManagerContact.module.scss';
import { AdminFilterSearch, AdminFilterSelect, AdminScopeSelect } from '../shared/AdminFilterControls';
import { AdminStatusTag } from '../shared/AdminTag';
import { getAdminManagedStatusFilterOptions, getAdminStatusFormOptions } from '../shared/adminTagOptions';
import { useSearchParams } from 'react-router-dom';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';

const cx = classNames.bind(styles);
const { Title } = Typography;
const { RangePicker } = DatePicker;
const disableFutureDate = (current) => current && current.endOf('day').isAfter(dayjs().endOf('day'));

const normalizeContact = (contact) => ({
    ...contact,
    purchaseIntent: contact.purchaseIntent ?? contact.option1 ?? '',
    purpose: contact.purpose ?? contact.option2 ?? '',
    budget: contact.budget ?? contact.option3 ?? '',
    deliveryOption: contact.deliveryOption ?? contact.option4 ?? '',
});

function getContactSelectableStatuses(contact) {
    return getAdminStatusFormOptions({
        domain: 'contact',
        values: contact?.availableStatuses || [contact?.status],
    });
}

function ManagerContact() {
    const [searchParams] = useSearchParams();
    const [form] = Form.useForm();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        status: ['new', 'contacted', 'resolved', 'archived', 'all'].includes(searchParams.get('status'))
            ? searchParams.get('status')
            : 'new',
        dateRange: null,
        scope: searchParams.get('scope') === 'trash' ? 'trash' : 'managed',
    });
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);
    const fetchSequenceRef = useRef(0);
    const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;

    const fetchContacts = useCallback(async (
        nextPagination = { current: paginationCurrent, pageSize: paginationPageSize },
        nextFilters = filters,
    ) => {
        const fetchSequence = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSequence;

        setLoading(true);
        try {
            const params = {
                page: nextPagination.current,
                limit: nextPagination.pageSize,
                includeDeleted: nextFilters.scope === 'trash',
                status: nextFilters.scope === 'trash' ? 'deleted' : nextFilters.status,
            };

            if (nextFilters.search.trim()) {
                params.search = nextFilters.search.trim();
            }

            if (nextFilters.dateRange?.[0] && nextFilters.dateRange?.[1]) {
                params.startDate = nextFilters.dateRange[0].format('YYYY-MM-DD');
                params.endDate = nextFilters.dateRange[1].format('YYYY-MM-DD');
            }

            const response = await requestGetContacts(params);
            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setContacts((response.metadata || []).map(normalizeContact));
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

            setContacts([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            message.error(error?.response?.data?.message || 'Không thể tải danh sách liên hệ');
        } finally {
            if (fetchSequence === fetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [filters, paginationCurrent, paginationPageSize]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

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

    const viewContact = (record) => {
        setCurrentContact(record);
        form.setFieldsValue({
            status: record.status || 'new',
            adminNote: record.adminNote || '',
        });
        setViewModalVisible(true);
    };

    const handleDeleteContact = (record) => {
        Modal.confirm({
            title: 'Xóa liên hệ',
            content: `Liên hệ từ "${record.fullName}" sẽ chuyển vào thùng rác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteContact(record.id);
                    setViewModalVisible(false);
                    await fetchContacts();
                    message.success('Đã xóa liên hệ');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể xóa liên hệ');
                }
            },
        });
    };

    const handlePermanentDeleteContact = (record) => {
        Modal.confirm({
            title: 'Xóa vĩnh viễn liên hệ',
            content: 'Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteContactPermanently(record.id);
                    setViewModalVisible(false);
                    await fetchContacts();
                    message.success('Đã xóa vĩnh viễn liên hệ');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể xóa vĩnh viễn liên hệ');
                }
            },
        });
    };

    const handleRestoreContact = async (record) => {
        try {
            await requestRestoreContact(record.id);
            setViewModalVisible(false);
            await fetchContacts();
            message.success('Đã khôi phục liên hệ');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể khôi phục liên hệ');
        }
    };

    const handleSaveContact = async (values) => {
        if (!currentContact) {
            return;
        }

        try {
            await requestUpdateContact(currentContact.id, values);
            setViewModalVisible(false);
            await fetchContacts();
            message.success('Đã cập nhật trạng thái xử lý liên hệ');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể cập nhật liên hệ');
        }
    };

    const columns = [
        {
            title: 'Liên hệ',
            key: 'contact',
            width: 260,
            render: (_, record) => (
                <div className="admin-cell-stack">
                    <strong className="admin-cell-title admin-cell-clamp-2">{record.fullName}</strong>
                    <span className="admin-cell-subtitle">
                        <PhoneOutlined /> <a href={`tel:${record.phone}`}>{record.phone}</a>
                    </span>
                    <span className="admin-cell-subtitle">{dayjs(record.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                </div>
            ),
        },
        {
            title: 'Nhu cầu tư vấn',
            key: 'demand',
            render: (_, record) => (
                <div className="admin-cell-stack">
                    <span className="admin-cell-subtitle admin-cell-clamp-2" title={record.purchaseIntent}>
                        Nhu cầu mua PC: {record.purchaseIntent}
                    </span>
                    <span className="admin-cell-subtitle admin-cell-clamp-2" title={record.purpose}>
                        Mục đích: {record.purpose}
                    </span>
                    <span className="admin-cell-subtitle admin-cell-clamp-2" title={record.budget}>
                        Ngân sách: {record.budget}
                    </span>
                    <span className="admin-cell-subtitle admin-cell-clamp-2" title={record.deliveryOption}>
                        Nhận hàng: {record.deliveryOption}
                    </span>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 150,
            render: (_, record) => <AdminStatusTag domain="contact" status={record.status} deletedAt={record.deletedAt} />,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 140,
            align: 'right',
            render: (_, record) => (
                <AdminIconActionGroup>
                    <AdminIconAction
                        title="Xem chi tiết"
                        icon={<EyeOutlined />}
                        onClick={() => viewContact(record)}
                        variant="view"
                    />
                    {record.deletedAt ? (
                        <>
                            <AdminIconAction
                                title="Khôi phục"
                                icon={<RollbackOutlined />}
                                onClick={() => handleRestoreContact(record)}
                                variant="restore"
                            />
                            <AdminIconAction
                                title="Xóa vĩnh viễn"
                                icon={<DeleteOutlined />}
                                onClick={() => handlePermanentDeleteContact(record)}
                                variant="delete"
                            />
                        </>
                    ) : (
                        <AdminIconAction
                            title="Xóa"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteContact(record)}
                            variant="delete"
                        />
                    )}
                </AdminIconActionGroup>
            ),
        },
    ];

    return (
        <div className={`${cx('wrapper')} admin-page admin-card`}>
            <div className="admin-page-header">
                <div className="admin-page-header-main">
                    <h2 className="admin-page-title">Quản lý liên hệ</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">
                        Hiển thị {pagination.total} {filters.scope === 'trash' ? 'liên hệ trong thùng rác' : 'liên hệ'}
                    </div>
                </div>
            </div>

            <div className="admin-toolbar">
                <div className="admin-toolbar-group admin-toolbar-group-fluid">
                    <AdminScopeSelect
                        value={filters.scope}
                        onChange={(value) => handleFilterChange({ scope: value })}
                    />
                    {filters.scope !== 'trash' && (
                        <AdminFilterSelect
                            value={filters.status}
                            onChange={(value) => handleFilterChange({ status: value })}
                            options={getAdminManagedStatusFilterOptions({
                                domain: 'contact',
                                includeAll: true,
                            })}
                        />
                    )}
                    <AdminFilterSearch
                        allowClear
                        placeholder="Tìm theo tên, số điện thoại hoặc nhu cầu"
                        value={filters.search}
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        onSearch={(value) => handleFilterChange({ search: value })}
                    />
                    <RangePicker
                        size="large"
                        format="DD/MM/YYYY"
                        value={filters.dateRange}
                        onChange={(value) => handleFilterChange({ dateRange: value })}
                        disabledDate={disableFutureDate}
                        placeholder={['Từ ngày', 'Đến ngày']}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={contacts}
                rowKey="id"
                className="admin-table"
                tableLayout="fixed"
                scroll={{ x: 980 }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                loading={loading}
                onChange={handleTableChange}
            />

            <Modal
                title="Chi tiết liên hệ"
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={null}
                width={760}
            >
                {currentContact && (
                    <div>
                        <Card style={{ marginBottom: '15px' }}>
                            <Title level={4}>Thông tin khách hàng</Title>
                            <div className={cx('detailList')}>
                                <div className={cx('detailRow')}>
                                    <span className={cx('detailLabel')}>Họ và tên:</span>
                                    <span className={cx('detailValue')}>{currentContact.fullName}</span>
                                </div>
                                <div className={cx('detailRow')}>
                                    <span className={cx('detailLabel')}>Số điện thoại:</span>
                                    <span className={cx('detailValue')}>
                                        <a href={`tel:${currentContact.phone}`}>{currentContact.phone}</a>
                                    </span>
                                </div>
                                <div className={cx('detailRow')}>
                                    <span className={cx('detailLabel')}>Thời gian liên hệ:</span>
                                    <span className={cx('detailValue')}>
                                        {dayjs(currentContact.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                                    </span>
                                </div>
                                <div className={cx('detailRow')}>
                                    <span className={cx('detailLabel')}>Trạng thái:</span>
                                    <AdminStatusTag
                                        domain="contact"
                                        status={currentContact.status}
                                        deletedAt={currentContact.deletedAt}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card style={{ marginBottom: '15px' }}>
                            <Title level={4}>Nhu cầu tư vấn</Title>
                            <div className={cx('detailList')}>
                                <div className={cx('detailRow')}>
                                    <span className={cx('detailLabel')}>1. Nhu cầu mua PC:</span>
                                    <span className={cx('detailValue')}>{currentContact.purchaseIntent}</span>
                                </div>
                                <div className={cx('detailRow')}>
                                    <span className={cx('detailLabel')}>2. Mục đích sử dụng:</span>
                                    <span className={cx('detailValue')}>{currentContact.purpose}</span>
                                </div>
                                <div className={cx('detailRow')}>
                                    <span className={cx('detailLabel')}>3. Ngân sách:</span>
                                    <span className={cx('detailValue')}>{currentContact.budget}</span>
                                </div>
                                <div className={cx('detailRow')}>
                                    <span className={cx('detailLabel')}>4. Phương thức nhận hàng:</span>
                                    <span className={cx('detailValue')}>{currentContact.deliveryOption}</span>
                                </div>
                            </div>
                        </Card>

                        {!currentContact.deletedAt ? (
                            <Card>
                                <Title level={4}>Xử lý liên hệ</Title>
                                <Form form={form} layout="vertical" onFinish={handleSaveContact}>
                                    <Form.Item
                                        name="status"
                                        label="Trạng thái xử lý"
                                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                                    >
                                        <Select options={getContactSelectableStatuses(currentContact)} />
                                    </Form.Item>
                                    <Form.Item name="adminNote" label="Ghi chú xử lý">
                                        <Input.TextArea allowClear rows={4} placeholder="Nhập ghi chú chăm sóc khách hàng..." />
                                    </Form.Item>
                                    <Space>
                                        <Button type="primary" onClick={() => form.submit()}>
                                            Lưu xử lý
                                        </Button>
                                        <Button danger onClick={() => handleDeleteContact(currentContact)}>
                                            Xóa
                                        </Button>
                                    </Space>
                                </Form>
                            </Card>
                        ) : (
                            <Space>
                                <Button type="primary" onClick={() => handleRestoreContact(currentContact)}>
                                    Khôi phục
                                </Button>
                                <Button danger onClick={() => handlePermanentDeleteContact(currentContact)}>
                                    Xóa vĩnh viễn
                                </Button>
                            </Space>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ManagerContact;
