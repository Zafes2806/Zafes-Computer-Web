import { useCallback, useEffect, useRef, useState } from 'react';
import { Table, Button, message, Modal, Form, Select, Input } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    StopOutlined,
    CheckCircleOutlined,
    RollbackOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerUser.module.scss';
import { AdminFilterSearch, AdminFilterSelect, AdminScopeSelect } from '../shared/AdminFilterControls';
import {
    requestCreateUser,
    requestDeleteUser,
    requestDeleteUserPermanently,
    requestGetUsers,
    requestRestoreUser,
    requestUpdateRoleUser,
    requestUpdateUserStatus,
} from '../../../../api';
import { useStore } from '../../../../hooks/useStore';
import {
    AdminAuthMethodTag,
    AdminRoleTag,
    AdminStatusTag,
} from '../shared/AdminTag';
import {
    getAdminManagedStatusFilterOptions,
    getAdminRoleFilterOptions,
    getAdminRoleFormOptions,
} from '../shared/adminTagOptions';
import { useSearchParams } from 'react-router-dom';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';

const cx = classNames.bind(styles);

const getErrorMessage = (error, fallbackMessage) => error?.response?.data?.message || fallbackMessage;

function ManagerUser() {
    const [searchParams] = useSearchParams();
    const { dataUser } = useStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        status: ['active', 'locked', 'all'].includes(searchParams.get('status'))
            ? searchParams.get('status')
            : 'active',
        role: 'all',
        scope: searchParams.get('scope') === 'trash' ? 'trash' : 'managed',
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [form] = Form.useForm();
    const [createForm] = Form.useForm();
    const fetchSequenceRef = useRef(0);

    const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;

    const fetchUsers = useCallback(async (
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

            if (nextFilters.role !== 'all') {
                params.role = nextFilters.role;
            }

            const res = await requestGetUsers(params);
            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setUsers(Array.isArray(res.metadata) ? res.metadata : []);
            setPagination((prev) => ({
                ...prev,
                current: res.pagination?.page || nextPagination.current,
                pageSize: res.pagination?.limit || nextPagination.pageSize,
                total: res.pagination?.totalItems || 0,
            }));
        } catch (error) {
            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setUsers([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            message.error(getErrorMessage(error, 'Không thể tải danh sách người dùng'));
        } finally {
            if (fetchSequence === fetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [filters, paginationCurrent, paginationPageSize]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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

    const handleEditUser = (user) => {
        setSelectedUser(user);
        form.setFieldsValue({
            userId: user.id,
            role: user.isAdmin,
        });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedUser(null);
        form.resetFields();
    };

    const handleOpenCreateModal = () => {
        createForm.setFieldsValue({
            role: false,
        });
        setIsCreateModalVisible(true);
    };

    const handleCreateCancel = () => {
        setIsCreateModalVisible(false);
        createForm.resetFields();
    };

    const handleFinish = async (values) => {
        try {
            await requestUpdateRoleUser(values);
            await fetchUsers();
            message.success('Cập nhật quyền người dùng thành công');
            handleCancel();
        } catch (error) {
            message.error(getErrorMessage(error, 'Không thể cập nhật quyền người dùng'));
        }
    };

    const handleCreateUser = async (values) => {
        try {
            await requestCreateUser(values);
            await fetchUsers();
            message.success('Tạo người dùng thành công');
            handleCreateCancel();
        } catch (error) {
            message.error(getErrorMessage(error, 'Không thể tạo người dùng'));
        }
    };

    const handleDeleteUser = (user) => {
        Modal.confirm({
            title: 'Xóa người dùng',
            content: `Tài khoản "${user.fullName}" sẽ chuyển vào thùng rác. Bạn có thể khôi phục hoặc xóa vĩnh viễn sau.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteUser(user.id);
                    await fetchUsers();
                    message.success('Đã xóa người dùng');
                } catch (error) {
                    message.error(getErrorMessage(error, 'Không thể xóa người dùng'));
                }
            },
        });
    };

    const handleRestoreUser = async (user) => {
        try {
            await requestRestoreUser(user.id);
            await fetchUsers();
            message.success('Đã khôi phục người dùng về trạng thái tạm khóa');
        } catch (error) {
            message.error(getErrorMessage(error, 'Không thể khôi phục người dùng'));
        }
    };

    const handlePermanentDeleteUser = (user) => {
        Modal.confirm({
            title: 'Xóa vĩnh viễn người dùng',
            content: `Tài khoản "${user.fullName}" sẽ bị xóa vĩnh viễn và không thể khôi phục. Chỉ tài khoản chưa phát sinh đơn hàng mới được phép xóa vĩnh viễn.`,
            okText: 'Xóa vĩnh viễn',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteUserPermanently(user.id);
                    await fetchUsers();
                    message.success('Đã xóa vĩnh viễn người dùng');
                } catch (error) {
                    message.error(getErrorMessage(error, 'Không thể xóa vĩnh viễn người dùng'));
                }
            },
        });
    };

    const handleToggleUserStatus = (user) => {
        const nextStatus = user.status === 'locked' ? 'active' : 'locked';
        const statusLabel = nextStatus === 'locked' ? 'tạm khóa' : 'mở khóa';
        Modal.confirm({
            title: nextStatus === 'locked' ? 'Tạm khóa người dùng' : 'Mở khóa người dùng',
            content: `Bạn có chắc chắn muốn ${statusLabel} tài khoản "${user.fullName}"?`,
            okText: nextStatus === 'locked' ? 'Tạm khóa' : 'Mở khóa',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestUpdateUserStatus(user.id, nextStatus);
                    await fetchUsers();
                    message.success(nextStatus === 'locked' ? 'Đã tạm khóa người dùng' : 'Đã mở khóa người dùng');
                } catch (error) {
                    message.error(getErrorMessage(error, 'Không thể cập nhật trạng thái người dùng'));
                }
            },
        });
    };

    const columns = [
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, record) => (
                <div className="admin-cell-stack">
                    <span className="admin-cell-title admin-cell-clamp-2" title={record.fullName}>
                        {record.fullName}
                    </span>
                    <span className="admin-cell-subtitle admin-cell-clamp-2" title={record.email}>
                        {record.email}
                    </span>
                    <span className="admin-cell-subtitle">SĐT: {record.phone || 'Chưa cập nhật'}</span>
                </div>
            ),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (address) => (
                <span className="admin-cell-subtitle admin-cell-clamp-2" title={address}>
                    {address || 'Chưa cập nhật địa chỉ'}
                </span>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'isAdmin',
            key: 'isAdmin',
            width: 120,
            render: (isAdmin) => <AdminRoleTag isAdmin={isAdmin} />,
        },
        {
            title: 'Đăng nhập',
            dataIndex: 'authProvider',
            key: 'authProvider',
            width: 130,
            render: (authProvider) => <AdminAuthMethodTag authProvider={authProvider} />,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 170,
            render: (_, record) => <AdminStatusTag domain="user" status={record.status} deletedAt={record.deletedAt} />,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 170,
            align: 'right',
            render: (_, record) => {
                const isSelf = record.id === dataUser?.id;

                return (
                    <AdminIconActionGroup>
                        {record.deletedAt ? (
                            <>
                                <AdminIconAction
                                    title="Khôi phục"
                                    icon={<RollbackOutlined />}
                                    onClick={() => handleRestoreUser(record)}
                                    variant="restore"
                                    disabled={isSelf}
                                />
                                <AdminIconAction
                                    title="Xóa vĩnh viễn"
                                    icon={<DeleteOutlined />}
                                    onClick={() => handlePermanentDeleteUser(record)}
                                    variant="delete"
                                    disabled={isSelf}
                                />
                            </>
                        ) : (
                            <>
                                <AdminIconAction
                                    title="Sửa vai trò"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditUser(record)}
                                    variant="edit"
                                />
                                <AdminIconAction
                                    title={record.status === 'locked' ? 'Mở khóa' : 'Tạm khóa'}
                                    icon={record.status === 'locked' ? <CheckCircleOutlined /> : <StopOutlined />}
                                    onClick={() => handleToggleUserStatus(record)}
                                    variant={record.status === 'locked' ? 'activate' : 'deactivate'}
                                    disabled={isSelf}
                                />
                                <AdminIconAction
                                    title="Xóa"
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteUser(record)}
                                    variant="delete"
                                    disabled={isSelf}
                                />
                            </>
                        )}
                    </AdminIconActionGroup>
                );
            },
        },
    ];

    return (
        <div className={`${cx('wrapper')} admin-page admin-card`}>
            <div className="admin-page-header">
                <div className="admin-page-header-main">
                    <h2 className={`admin-page-title ${cx('title')}`}>Quản lý người dùng</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">
                        Hiển thị {pagination.total} {filters.scope === 'trash' ? 'người dùng trong thùng rác' : 'người dùng'}
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
                        Thêm người dùng
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
                                domain: 'user',
                                includeAll: true,
                            })}
                        />
                    )}
                    <AdminFilterSelect
                        value={filters.role}
                        onChange={(value) => handleFilterChange({ role: value })}
                        options={getAdminRoleFilterOptions({ includeAll: true })}
                    />
                    <AdminFilterSearch
                        allowClear
                        placeholder="Tìm theo tên, email hoặc số điện thoại"
                        value={filters.search}
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        onSearch={(value) => handleFilterChange({ search: value })}
                    />
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                className="admin-table"
                tableLayout="fixed"
                scroll={{ x: 1080 }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
            />

            <Modal
                title="Thêm người dùng"
                open={isCreateModalVisible}
                onOk={() => createForm.submit()}
                onCancel={handleCreateCancel}
                okText="Tạo"
                cancelText="Hủy"
                className={cx('permission-modal')}
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreateUser}>
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                    >
                        <Input placeholder="Nhập họ và tên" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' },
                        ]}
                    >
                        <Input placeholder="Nhập email" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu tạm" />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                    >
                        <Select options={getAdminRoleFormOptions({ mode: 'boolean' })} />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            {
                                pattern: /^0\d{9}$/,
                                message: 'Số điện thoại phải bắt đầu bằng số 0 và đủ 10 số!',
                            },
                        ]}
                    >
                        <Input placeholder="Nhập số điện thoại nếu có" />
                    </Form.Item>
                    <Form.Item name="address" label="Địa chỉ">
                        <Input.TextArea rows={3} placeholder="Nhập địa chỉ nếu có" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Cập nhật vai trò người dùng"
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={handleCancel}
                okText="Lưu"
                cancelText="Hủy"
                className={cx('permission-modal')}
            >
                {selectedUser && (
                    <div className={cx('user-info')}>
                        <p>
                            <strong>Họ và tên:</strong> {selectedUser.fullName}
                        </p>
                        <p>
                            <strong>Email:</strong> {selectedUser.email}
                        </p>
                    </div>
                )}
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Form.Item name="userId" hidden>
                        <input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                    >
                        <Select options={getAdminRoleFormOptions({ mode: 'boolean' })} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerUser;

