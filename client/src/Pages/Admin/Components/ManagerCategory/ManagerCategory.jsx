import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ManagerCategory.module.scss';
import classNames from 'classnames/bind';
import { Table, Button, Modal, Form, Input, Upload, Space, message, Select } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    RollbackOutlined,
    PauseCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { AdminFilterSearch, AdminFilterSelect, AdminScopeSelect } from '../shared/AdminFilterControls';
import {
    requestCreateCategory,
    requestDeleteCategory,
    requestDeleteCategoryPermanently,
    requestGetCategory,
    requestRestoreCategory,
    requestUpdateCategory,
    requestUpdateCategoryStatus,
    requestUploadImage,
} from '../../../../api';
import { resolveAssetUrl } from '../../../../lib/assetUrl';
import { AdminStatusTag } from '../shared/AdminTag';
import { getAdminManagedStatusFilterOptions, getAdminStatusFormOptions } from '../shared/adminTagOptions';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';
import { useStore } from '../../../../hooks/useStore';

const cx = classNames.bind(styles);

function ManagerCategory() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [fileList, setFileList] = useState([]);
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
    const fetchSequenceRef = useRef(0);
    const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;
    const { fetchCategory: refreshPublicCategories } = useStore();

    const fetchCategories = useCallback(async (
        nextPagination = { current: paginationCurrent, pageSize: paginationPageSize },
        nextFilters = filters,
    ) => {
        const fetchSequence = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSequence;
        setLoading(true);
        try {
            const response = await requestGetCategory({
                page: nextPagination.current,
                limit: nextPagination.pageSize,
                includeDeleted: nextFilters.scope === 'trash',
                status: nextFilters.scope === 'trash' ? 'deleted' : nextFilters.status,
                ...(nextFilters.search.trim() ? { search: nextFilters.search.trim() } : {}),
            });

            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setCategories(Array.isArray(response.metadata) ? response.metadata : []);
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

            setCategories([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            message.error(error?.response?.data?.message || 'Không thể tải danh sách danh mục');
        } finally {
            if (fetchSequence === fetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [filters, paginationCurrent, paginationPageSize]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

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

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Xóa danh mục',
            content: `Danh mục "${record.name}" sẽ chuyển vào thùng rác và bị ẩn khỏi trang bán hàng. Sản phẩm thuộc danh mục này vẫn giữ dữ liệu, chỉ không còn bán được khi danh mục đang ở thùng rác.`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteCategory(record.id);
                    await fetchCategories();
                    await refreshPublicCategories();
                    message.success('Đã xóa danh mục');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể xóa danh mục');
                }
            },
        });
    };

    const handlePermanentDelete = (record) => {
        Modal.confirm({
            title: 'Xóa vĩnh viễn danh mục',
            content: `Danh mục "${record.name}" sẽ bị xóa vĩnh viễn và không thể khôi phục.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteCategoryPermanently(record.id);
                    await fetchCategories();
                    await refreshPublicCategories();
                    message.success('Đã xóa vĩnh viễn danh mục');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể xóa vĩnh viễn danh mục');
                }
            },
        });
    };

    const handleRestore = async (record) => {
        try {
            await requestRestoreCategory(record.id);
            await fetchCategories();
            await refreshPublicCategories();
            message.success('Đã khôi phục danh mục về trạng thái tạm khóa');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể khôi phục danh mục');
        }
    };

    const handleToggleStatus = (record) => {
        const nextStatus = record.status === 'inactive' ? 'active' : 'inactive';
        const isActivating = nextStatus === 'active';
        Modal.confirm({
            title: isActivating ? 'Kích hoạt danh mục' : 'Tạm khóa danh mục',
            content: isActivating
                ? `Danh mục "${record.name}" sẽ hiển thị lại trên trang bán hàng. Các sản phẩm đang mở bán trong danh mục này có thể được bán lại, sản phẩm tạm khóa vẫn giữ nguyên trạng thái.`
                : `Danh mục "${record.name}" sẽ bị ẩn khỏi trang bán hàng. Các sản phẩm thuộc danh mục này không bị đổi trạng thái, nhưng khách hàng sẽ không thể đặt mua cho đến khi danh mục được kích hoạt lại.`,
            okText: isActivating ? 'Kích hoạt' : 'Tạm khóa',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestUpdateCategoryStatus(record.id, nextStatus);
                    await fetchCategories();
                    await refreshPublicCategories();
                    message.success(isActivating
                        ? 'Đã kích hoạt danh mục'
                        : 'Đã tạm khóa danh mục, sản phẩm trong danh mục đã bị ẩn khỏi trang bán hàng');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái danh mục');
                }
            },
        });
    };

    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const handleOpenAddModal = () => {
        setModalMode('add');
        form.resetFields();
        form.setFieldsValue({ status: 'active' });
        setFileList([]);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (record) => {
        setModalMode('edit');
        form.setFieldsValue({
            id: record.id,
            name: record.name,
            image: record.image,
        });
        setFileList(
            record.image
                ? [{
                    uid: record.id,
                    name: record.name,
                    status: 'done',
                    url: resolveAssetUrl(record.image),
                    serverPath: record.image,
                }]
                : [],
        );
        setIsModalOpen(true);
    };

    const handleSubmit = async (values) => {
        try {
            let image = values.image;

            if (fileList[0]?.originFileObj) {
                const formData = new FormData();
                formData.append('image', fileList[0].originFileObj);
                const res = await requestUploadImage(formData);
                image = res.image;
            } else if (fileList[0]?.serverPath) {
                image = fileList[0].serverPath;
            }

            if (!image) {
                message.error('Vui lòng tải lên hình ảnh danh mục');
                return;
            }

            if (modalMode === 'add') {
                await requestCreateCategory({
                    name: values.name,
                    image,
                    status: values.status || 'active',
                });
                message.success('Đã tạo danh mục thành công');
            } else {
                await requestUpdateCategory({
                    id: values.id,
                    name: values.name,
                    image,
                });
                message.success('Đã cập nhật danh mục thành công');
            }

            setIsModalOpen(false);
            form.resetFields();
            setFileList([]);
            await fetchCategories();
            await refreshPublicCategories();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục');
        }
    };

    const columns = [
        {
            title: 'Danh mục',
            key: 'category',
            render: (_, record) => (
                <div className="admin-media-cell">
                    <img src={resolveAssetUrl(record.image)} alt={record.name} className="admin-thumb" />
                    <div className="admin-cell-stack">
                        <span className="admin-cell-title admin-cell-clamp-2" title={record.name}>
                            {record.name}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 170,
            render: (_, record) => (
                <AdminStatusTag domain="category" status={record.status} deletedAt={record.deletedAt} />
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
        <div className={`${cx('wrapper')} admin-page admin-card`}>
            <div className={`${cx('header')} admin-page-header`}>
                <div className="admin-page-header-main">
                    <h2 className="admin-page-title">Quản lý danh mục</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">
                        Hiển thị {pagination.total} {filters.scope === 'trash' ? 'danh mục trong thùng rác' : 'danh mục'}
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddModal}>
                        Thêm danh mục
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
                                domain: 'category',
                                includeAll: true,
                            })}
                        />
                    )}
                    <AdminFilterSearch
                        value={filters.search}
                        allowClear
                        placeholder="Tìm theo tên danh mục"
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        onSearch={(value) => handleFilterChange({ search: value })}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={categories}
                rowKey="id"
                loading={loading}
                className={`${cx('category-table')} admin-table`}
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
                title={modalMode === 'add' ? 'Thêm danh mục' : 'Sửa danh mục'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Tên danh mục"
                        rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
                    >
                        <Input allowClear placeholder="Nhập tên danh mục" />
                    </Form.Item>

                    {modalMode === 'add' && (
                        <Form.Item
                            name="status"
                            label="Trạng thái"
                            initialValue="active"
                            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                        >
                            <Select
                                options={getAdminStatusFormOptions({
                                    domain: 'category',
                                    values: ['active', 'inactive'],
                                })}
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="image"
                        label="Hình ảnh"
                        rules={[{ required: true, message: 'Vui lòng chọn hình ảnh!' }]}
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleChange}
                            beforeUpload={() => false}
                            maxCount={1}
                            accept="image/*"
                        >
                            {fileList.length >= 1 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item className={cx('form-actions')}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit">
                                Lưu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerCategory;
