import { Table, Button, Modal, Form, Input, Select, Switch, message } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    RollbackOutlined,
    PauseCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';

import {
    requestCreateComponentType,
    requestDeleteComponentType,
    requestDeleteComponentTypePermanently,
    requestGetComponentTypes,
    requestRestoreComponentType,
    requestUpdateComponentType,
    requestUpdateComponentTypeStatus,
} from '../../../../api';
import { AdminFilterSearch, AdminFilterSelect, AdminScopeSelect } from '../shared/AdminFilterControls';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';
import { AdminMetaTag, AdminStatusTag } from '../shared/AdminTag';
import { getAdminManagedStatusFilterOptions, getAdminStatusFormOptions } from '../shared/adminTagOptions';
import styles from './ManagerComponentTypes.module.scss';

const cx = classNames.bind(styles);

function ManagerComponentTypes() {
    const [form] = Form.useForm();
    const [componentTypes, setComponentTypes] = useState([]);
    const [filters, setFilters] = useState({
        status: 'active',
        search: '',
        scope: 'managed',
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const fetchSequenceRef = useRef(0);
    const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;

    const fetchComponentTypes = useCallback(async (
        nextPagination = { current: paginationCurrent, pageSize: paginationPageSize },
        nextFilters = filters,
    ) => {
        const fetchSequence = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSequence;

        setLoading(true);
        try {
            const response = await requestGetComponentTypes({
                page: nextPagination.current,
                limit: nextPagination.pageSize,
                includeDeleted: nextFilters.scope === 'trash',
                status: nextFilters.scope === 'trash' ? 'deleted' : nextFilters.status,
                ...(nextFilters.search.trim() ? { search: nextFilters.search.trim() } : {}),
            });

            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setComponentTypes(Array.isArray(response.metadata) ? response.metadata : []);
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

            setComponentTypes([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            message.error(error?.response?.data?.message || 'Không thể tải danh sách loại linh kiện');
        } finally {
            if (fetchSequence === fetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [filters, paginationCurrent, paginationPageSize]);

    useEffect(() => {
        fetchComponentTypes();
    }, [fetchComponentTypes]);

    const handleFilterChange = (changes) => {
        const nextFilters = { ...filters, ...changes };
        const nextPagination = { ...pagination, current: 1 };
        setLoading(true);
        setFilters(nextFilters);
        setPagination(nextPagination);
    };

    const handleTableChange = (nextPagination) => {
        setLoading(true);
        setPagination((prev) => ({
            ...prev,
            current: nextPagination.current,
            pageSize: nextPagination.pageSize,
        }));
    };

    const handleOpenAddModal = () => {
        setEditing(null);
        form.resetFields();
        form.setFieldsValue({
            status: 'active',
            isBuildPcAllowed: true,
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (record) => {
        setEditing(record);
        form.setFieldsValue({
            code: record.code,
            name: record.name,
            isBuildPcAllowed: Boolean(record.isBuildPcAllowed),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                code: values.code?.trim().toLowerCase(),
                name: values.name?.trim(),
            };

            if (editing) {
                await requestUpdateComponentType({ code: editing.code, ...payload });
                message.success('Đã cập nhật loại linh kiện');
            } else {
                await requestCreateComponentType(payload);
                message.success('Đã tạo loại linh kiện');
            }

            setIsModalOpen(false);
            await fetchComponentTypes();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Không thể lưu loại linh kiện');
        }
    };

    const handleToggleStatus = (record) => {
        const nextStatus = record.status === 'inactive' ? 'active' : 'inactive';
        Modal.confirm({
            title: nextStatus === 'active' ? 'Kích hoạt loại linh kiện' : 'Tạm khóa loại linh kiện',
            content: `Bạn có chắc chắn muốn ${nextStatus === 'active' ? 'kích hoạt' : 'tạm khóa'} "${record.name}"?`,
            okText: nextStatus === 'active' ? 'Kích hoạt' : 'Tạm khóa',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestUpdateComponentTypeStatus(record.code, nextStatus);
                    await fetchComponentTypes();
                    message.success(nextStatus === 'active' ? 'Đã kích hoạt loại linh kiện' : 'Đã tạm khóa loại linh kiện');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái loại linh kiện');
                }
            },
        });
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Xóa loại linh kiện',
            content: `Loại linh kiện "${record.name}" sẽ chuyển vào thùng rác. Dữ liệu sản phẩm đang tham chiếu vẫn được giữ lại.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteComponentType(record.code);
                    await fetchComponentTypes();
                    message.success('Đã xóa loại linh kiện');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể xóa loại linh kiện');
                }
            },
        });
    };

    const handleRestore = async (record) => {
        try {
            await requestRestoreComponentType(record.code);
            await fetchComponentTypes();
            message.success('Đã khôi phục loại linh kiện về trạng thái tạm khóa');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể khôi phục loại linh kiện');
        }
    };

    const handlePermanentDelete = (record) => {
        Modal.confirm({
            title: 'Xóa vĩnh viễn loại linh kiện',
            content: `Loại linh kiện "${record.name}" sẽ bị xóa vĩnh viễn nếu chưa được sản phẩm, thuộc tính hoặc giỏ Build PC sử dụng.`,
            okText: 'Xóa vĩnh viễn',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteComponentTypePermanently(record.code);
                    await fetchComponentTypes();
                    message.success('Đã xóa vĩnh viễn loại linh kiện');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể xóa vĩnh viễn loại linh kiện');
                }
            },
        });
    };

    const columns = [
        {
            title: 'Loại linh kiện',
            key: 'componentType',
            width: 280,
            render: (_, record) => (
                <div className="admin-cell-stack">
                    <span className="admin-cell-title admin-cell-clamp-2" title={record.code}>
                        {record.code}
                    </span>
                    <AdminMetaTag variant="info">{record.name}</AdminMetaTag>
                </div>
            ),
        },
        {
            title: 'Phạm vi sử dụng',
            key: 'scope',
            width: 280,
            render: (_, record) => (
                <div className={cx('scopeTags')}>
                    {record.isProductType && <AdminMetaTag variant="info">Sản phẩm</AdminMetaTag>}
                    {record.isBuildPcAllowed && <AdminMetaTag variant="category">Build PC</AdminMetaTag>}
                    {!record.isProductType && !record.isBuildPcAllowed && (
                        <AdminMetaTag variant="neutral">Chưa sử dụng</AdminMetaTag>
                    )}
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 170,
            render: (_, record) => (
                <AdminStatusTag domain="componentType" status={record.status} deletedAt={record.deletedAt} />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'right',
            render: (_, record) => (
                <AdminIconActionGroup>
                    {record.deletedAt ? (
                        <>
                            <AdminIconAction
                                title="Khôi phục"
                                icon={<RollbackOutlined />}
                                variant="restore"
                                onClick={() => handleRestore(record)}
                            />
                            <AdminIconAction
                                title="Xóa vĩnh viễn"
                                icon={<DeleteOutlined />}
                                variant="delete"
                                onClick={() => handlePermanentDelete(record)}
                            />
                        </>
                    ) : (
                        <>
                            <AdminIconAction
                                title="Sửa"
                                icon={<EditOutlined />}
                                variant="edit"
                                onClick={() => handleOpenEditModal(record)}
                            />
                            <AdminIconAction
                                title={record.status === 'inactive' ? 'Kích hoạt' : 'Tạm khóa'}
                                icon={record.status === 'inactive' ? <CheckCircleOutlined /> : <PauseCircleOutlined />}
                                variant={record.status === 'inactive' ? 'activate' : 'deactivate'}
                                onClick={() => handleToggleStatus(record)}
                            />
                            <AdminIconAction
                                title="Xóa"
                                icon={<DeleteOutlined />}
                                variant="delete"
                                onClick={() => handleDelete(record)}
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
                    <h2 className="admin-page-title">Quản lý loại linh kiện</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">
                        Hiển thị {pagination.total} {filters.scope === 'trash' ? 'loại trong thùng rác' : 'loại linh kiện'}
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddModal}>
                        Thêm loại linh kiện
                    </Button>
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
                                domain: 'componentType',
                                includeAll: true,
                            })}
                        />
                    )}
                    <AdminFilterSearch
                        value={filters.search}
                        allowClear
                        placeholder="Tìm theo tên hoặc mã loại linh kiện"
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        onSearch={(value) => handleFilterChange({ search: value })}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={componentTypes}
                rowKey="code"
                loading={loading}
                className="admin-table"
                tableLayout="fixed"
                scroll={{ x: 880 }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
            />

            <Modal
                title={editing ? 'Sửa loại linh kiện' : 'Thêm loại linh kiện'}
                open={isModalOpen}
                onOk={handleSubmit}
                okText="Lưu"
                cancelText="Hủy"
                onCancel={() => setIsModalOpen(false)}
                width={620}
                destroyOnHidden
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="code"
                        label="Mã loại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã loại linh kiện' },
                            {
                                pattern: /^[a-z0-9_-]{2,50}$/,
                                message: 'Chỉ dùng chữ thường, số, dấu gạch ngang hoặc gạch dưới',
                            },
                        ]}
                    >
                        <Input allowClear disabled={!!editing} placeholder="cpu, mainboard, ram..." />
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label="Tên hiển thị"
                        rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
                    >
                        <Input allowClear placeholder="CPU, Bo mạch chủ, RAM..." />
                    </Form.Item>

                    {!editing && (
                        <Form.Item
                            name="status"
                            label="Trạng thái"
                            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                        >
                            <Select
                                options={getAdminStatusFormOptions({
                                    domain: 'componentType',
                                    values: ['active', 'inactive'],
                                })}
                            />
                        </Form.Item>
                    )}

                    <div className={cx('modalSwitches')}>
                        <Form.Item name="isBuildPcAllowed" valuePropName="checked" noStyle>
                            <SwitchRow
                                title="Cho phép dùng trong Build PC"
                                description="Bật nếu sản phẩm thuộc loại này được chọn khi khách tự build cấu hình PC."
                            />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

function SwitchRow({ title, description, checked, onChange }) {
    return (
        <div className={cx('switchRow')}>
            <span>
                <span className={cx('switchTitle')}>{title}</span>
                <span className={cx('switchDescription')}>{description}</span>
            </span>
            <Switch checked={checked} onChange={onChange} />
        </div>
    );
}

export default ManagerComponentTypes;
