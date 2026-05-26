import { useCallback, useState, useEffect, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Upload, Space, Popconfirm, message, Spin, Select } from 'antd';
import {
    UploadOutlined,
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    RollbackOutlined,
} from '@ant-design/icons';
import {
    requestGetBlogs,
    requestCreateBlog,
    requestDeleteBlog,
    requestDeleteBlogPermanently,
    requestRestoreBlog,
    requestUpdateBlog,
    requestUpdateBlogStatus,
    requestUploadImage,
} from '../../../../api';
import LazyTinymceEditor from '../../../../Components/LazyTinymceEditor/LazyTinymceEditor';
import classNames from 'classnames/bind';
import styles from './ManagerBlogs.module.scss';
import { resolveAssetUrl } from '../../../../lib/assetUrl';
import { AdminFilterSearch, AdminFilterSelect, AdminScopeSelect } from '../shared/AdminFilterControls';
import { useSearchParams } from 'react-router-dom';
import { AdminStatusTag } from '../shared/AdminTag';
import { getAdminManagedStatusFilterOptions, getAdminStatusInlineOptions } from '../shared/adminTagOptions';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';

const cx = classNames.bind(styles);

function getBlogSelectableStatuses(blog) {
    return getAdminStatusInlineOptions({
        domain: 'blog',
        values: blog?.availableStatuses || [blog?.status],
    });
}

function ManagerBlogs() {
    const [searchParams] = useSearchParams();
    const [blogs, setBlogs] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingBlog, setEditingBlog] = useState(null);
    const [form] = Form.useForm();
    const [imageUrl, setImageUrl] = useState('');
    const [messageApi, contextHolder] = message.useMessage();
    const [editorRef, setEditorRef] = useState(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [filters, setFilters] = useState({
        status: ['draft', 'published', 'archived', 'all'].includes(searchParams.get('status'))
            ? searchParams.get('status')
            : 'published',
        search: searchParams.get('search') || '',
        scope: searchParams.get('scope') === 'trash' ? 'trash' : 'managed',
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [loading, setLoading] = useState(false);
    const fetchSequenceRef = useRef(0);
    const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;

    const fetchBlogs = useCallback(async (
        nextPagination = { current: paginationCurrent, pageSize: paginationPageSize },
        nextFilters = filters,
    ) => {
        const fetchSequence = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSequence;

        try {
            setLoading(true);
            const response = await requestGetBlogs({
                page: nextPagination.current,
                limit: nextPagination.pageSize,
                includeDeleted: nextFilters.scope === 'trash',
                status: nextFilters.scope === 'trash' ? 'deleted' : nextFilters.status,
                ...(nextFilters.search.trim() ? { search: nextFilters.search.trim() } : {}),
            });
            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setBlogs(response.metadata || []);
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

            setBlogs([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            messageApi.error(error?.response?.data?.message || 'Không thể tải danh sách bài viết');
        } finally {
            if (fetchSequence === fetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [filters, messageApi, paginationCurrent, paginationPageSize]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    useEffect(() => {
        if (!modalVisible || !editorRef) {
            return;
        }

        editorRef.setContent(editingBlog?.content || '');
    }, [modalVisible, editingBlog, editorRef]);

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

    const handleAddBlog = () => {
        setModalMode('create');
        setEditingBlog(null);
        form.resetFields();
        setImageUrl('');
        setIsEditorReady(false);
        setModalVisible(true);
    };

    const handleEditBlog = (blog) => {
        setModalMode('edit');
        setEditingBlog(blog);
        form.setFieldsValue({
            title: blog.title,
        });
        setImageUrl(blog.image || '');
        setIsEditorReady(false);
        setModalVisible(true);
    };

    const handleCancel = () => {
        setModalVisible(false);
        setEditingBlog(null);
        form.resetFields();
        setImageUrl('');
        setIsEditorReady(false);
        if (editorRef) {
            editorRef.setContent('');
        }
    };

    const handleImageUpload = async (options) => {
        const { file, onSuccess, onError } = options;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await requestUploadImage(formData);
            setImageUrl(response.image);
            onSuccess();
            messageApi.success('Tải ảnh thành công');
        } catch (error) {
            onError();
            messageApi.error(error?.response?.data?.message || 'Không thể tải ảnh');
        }
    };

    const handleSubmit = async (values) => {
        if (!imageUrl) {
            messageApi.error('Vui lòng tải lên ảnh bìa');
            return;
        }

        try {
            const content = editorRef ? editorRef.getContent() : '';

            const blogData = {
                title: values.title,
                image: imageUrl,
                content,
            };

            if (editingBlog) {
                await requestUpdateBlog({ id: editingBlog.id, ...blogData });
            } else {
                await requestCreateBlog(blogData);
            }

            messageApi.success(editingBlog ? 'Cập nhật bài viết thành công' : 'Tạo bài viết thành công');
            handleCancel();
            await fetchBlogs();
        } catch (error) {
            messageApi.error(error?.response?.data?.message || 'Không thể lưu bài viết');
        }
    };

    const handleDeleteBlog = async (blog) => {
        try {
            await requestDeleteBlog(blog.id);
            messageApi.success('Đã xóa bài viết');
            fetchBlogs();
        } catch (error) {
            messageApi.error(error?.response?.data?.message || 'Không thể xóa bài viết');
        }
    };

    const handleRestoreBlog = async (blog) => {
        try {
            await requestRestoreBlog(blog.id);
            messageApi.success('Đã khôi phục bài viết về bản nháp');
            fetchBlogs();
        } catch (error) {
            messageApi.error(error?.response?.data?.message || 'Không thể khôi phục bài viết');
        }
    };

    const handlePermanentDeleteBlog = async (blog) => {
        try {
            await requestDeleteBlogPermanently(blog.id);
            messageApi.success('Đã xóa vĩnh viễn bài viết');
            fetchBlogs();
        } catch (error) {
            messageApi.error(error?.response?.data?.message || 'Không thể xóa vĩnh viễn bài viết');
        }
    };

    const handleStatusChange = async (blog, status) => {
        try {
            await requestUpdateBlogStatus(blog.id, status);
            messageApi.success('Đã cập nhật trạng thái bài viết');
            fetchBlogs();
        } catch (error) {
            messageApi.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái bài viết');
        }
    };

    const columns = [
        {
            title: 'Bài viết',
            key: 'blog',
            render: (_, record) => (
                <div className="admin-media-cell">
                    <img src={resolveAssetUrl(record.image)} alt={record.title} className="admin-thumb" />
                    <div className="admin-cell-stack">
                        <span className="admin-cell-title admin-cell-clamp-2" title={record.title}>
                            {record.title}
                        </span>
                        <span className="admin-cell-subtitle">Mã bài viết: {record.id}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 190,
            render: (_, record) => {
                if (record.deletedAt) {
                    return <AdminStatusTag domain="blog" status={record.status} deletedAt={record.deletedAt} />;
                }

                return (
                    <Select
                        value={record.status}
                        size="large"
                        style={{ width: '100%' }}
                        onChange={(value) => handleStatusChange(record, value)}
                        className={cx('status-select')}
                        disabled={getBlogSelectableStatuses(record).length <= 1}
                        options={getBlogSelectableStatuses(record)}
                    />
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 130,
            align: 'right',
            render: (_, record) => (
                <AdminIconActionGroup>
                    {record.deletedAt ? (
                        <>
                            <AdminIconAction
                                title="Khôi phục"
                                icon={<RollbackOutlined />}
                                variant="restore"
                                onClick={() => handleRestoreBlog(record)}
                            />
                            <AdminIconAction
                                title="Xóa vĩnh viễn"
                                icon={<DeleteOutlined />}
                                variant="delete"
                                onClick={() => handlePermanentDeleteBlog(record)}
                            />
                        </>
                    ) : (
                        <>
                            <AdminIconAction
                                title="Sửa"
                                icon={<EditOutlined />}
                                variant="edit"
                                onClick={() => handleEditBlog(record)}
                            />
                            <Popconfirm
                                title="Bạn có chắc chắn muốn xóa bài viết này?"
                                onConfirm={() => handleDeleteBlog(record)}
                                okText="Có"
                                cancelText="Không"
                            >
                                <AdminIconAction title="Xóa" icon={<DeleteOutlined />} variant="delete" />
                            </Popconfirm>
                        </>
                    )}
                </AdminIconActionGroup>
            ),
        },
    ];

    return (
        <div className={`${cx('wrapper')} admin-page admin-card`}>
            {contextHolder}
            <div className="admin-page-header">
                <div className="admin-page-header-main">
                    <h2 className="admin-page-title">Quản lý bài viết</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">
                        Hiển thị {pagination.total} {filters.scope === 'trash' ? 'bài viết trong thùng rác' : 'bài viết'}
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBlog}>
                        Thêm bài viết
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
                                domain: 'blog',
                                includeAll: true,
                            })}
                        />
                    )}
                    <AdminFilterSearch
                        value={filters.search}
                        allowClear
                        placeholder="Tìm theo tiêu đề hoặc nội dung"
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        onSearch={(value) => handleFilterChange({ search: value })}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={blogs}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
                className="admin-table"
                tableLayout="fixed"
                scroll={{ x: 900 }}
            />

            <Modal
                title={modalMode === 'edit' ? 'Sửa bài viết' : 'Thêm bài viết'}
                open={modalVisible}
                onCancel={handleCancel}
                footer={null}
                width={800}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input allowClear placeholder="Nhập tiêu đề" />
                    </Form.Item>

                    <Form.Item label="Ảnh bìa" required>
                        <Upload customRequest={handleImageUpload} listType="picture-card" showUploadList={false}>
                            {imageUrl ? (
                                <img
                                    src={resolveAssetUrl(imageUrl)}
                                    alt="Cover"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Tải lên</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item label="Nội dung" required>
                        <Spin spinning={!isEditorReady}>
                            {modalVisible ? (
                                <LazyTinymceEditor
                                    key={editingBlog?.id || 'create-blog'}
                                    onInit={(evt, editor) => {
                                        setEditorRef(editor);
                                        setIsEditorReady(true);
                                        editor.setContent(editingBlog?.content || '');
                                    }}
                                    init={{
                                        plugins:
                                            'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                                        toolbar:
                                            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                        height: 300,
                                        menubar: true,
                                    }}
                                    initialValue=""
                                    fallback={(
                                        <div style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
                                            <Spin />
                                        </div>
                                    )}
                                />
                            ) : null}
                        </Spin>
                    </Form.Item>

                    <Form.Item>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <Button onClick={handleCancel}>Hủy</Button>
                            <Button type="primary" htmlType="submit">
                                Lưu
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerBlogs;
