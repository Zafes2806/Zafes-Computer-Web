import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    RollbackOutlined,
    PauseCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminFilterSearch, AdminFilterSelect, AdminScopeSelect } from '../shared/AdminFilterControls';
import { AdminMetaTag, AdminStatusTag } from '../shared/AdminTag';
import { getAdminManagedStatusFilterOptions } from '../shared/adminTagOptions';
import {
    requestGetSpecDefinitions,
    requestCreateSpecDefinition,
    requestUpdateSpecDefinition,
    requestReorderSpecDefinition,
    requestDeleteSpecDefinition,
    requestDeleteSpecDefinitionPermanently,
    requestRestoreSpecDefinition,
    requestUpdateSpecDefinitionStatus,
} from '../../../../api';
import classNames from 'classnames/bind';
import styles from './ManagerSpecDefinitions.module.scss';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';
import { useComponentTypes } from '../../../../hooks/useComponentTypes';

const cx = classNames.bind(styles);

function ManagerSpecDefinitions() {
    const [form] = Form.useForm();
    const { componentTypes } = useComponentTypes({ buildPcOnly: true });
    const [definitions, setDefinitions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [optionInput, setOptionInput] = useState('');
    const [options, setOptions] = useState([]);
    const [draggedOption, setDraggedOption] = useState(null);
    const [dragOverOption, setDragOverOption] = useState(null);
    const [draggedDefinition, setDraggedDefinition] = useState(null);
    const [dragOverDefinitionId, setDragOverDefinitionId] = useState(null);
    const [filters, setFilters] = useState({
        type: 'all',
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
    const componentTypeOptions = useMemo(
        () => componentTypes.map(({ value, label }) => ({ value, label })),
        [componentTypes],
    );
    const componentTypeLabels = useMemo(
        () => componentTypes.reduce((labels, item) => ({ ...labels, [item.value]: item.label }), {}),
        [componentTypes],
    );

    const fetchDefinitions = useCallback(async (
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
            if (nextFilters.type !== 'all') {
                params.componentType = nextFilters.type;
            }
            if (nextFilters.search.trim()) {
                params.search = nextFilters.search.trim();
            }

            const res = await requestGetSpecDefinitions(params);
            if (fetchSequence !== fetchSequenceRef.current) {
                return;
            }

            setDefinitions(res.metadata || []);
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

            setDefinitions([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            message.error(error?.response?.data?.message || 'Không thể tải danh sách thuộc tính');
        } finally {
            if (fetchSequence === fetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [filters, paginationCurrent, paginationPageSize]);

    useEffect(() => {
        fetchDefinitions();
    }, [fetchDefinitions]);

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

    const handleAdd = () => {
        setEditing(null);
        form.resetFields();
        setOptions([]);
        setOptionInput('');
        setDraggedOption(null);
        setDragOverOption(null);
        setDraggedDefinition(null);
        setDragOverDefinitionId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (record) => {
        setEditing(record);
        form.setFieldsValue({
            componentType: record.componentType,
            specKey: record.specKey,
            label: record.label,
        });
        setOptions(Array.isArray(record.options) ? record.options : JSON.parse(record.options || '[]'));
        setOptionInput('');
        setDraggedOption(null);
        setDragOverOption(null);
        setDraggedDefinition(null);
        setDragOverDefinitionId(null);
        setIsModalOpen(true);
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Xóa thuộc tính',
            content: `Thuộc tính "${record.label}" sẽ chuyển vào thùng rác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteSpecDefinition(record.id);
                    await fetchDefinitions();
                    message.success('Đã xóa thuộc tính');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Lỗi khi xóa thuộc tính');
                }
            },
        });
    };

    const handleRestore = async (record) => {
        try {
            await requestRestoreSpecDefinition(record.id);
            await fetchDefinitions();
            message.success('Đã khôi phục thuộc tính về trạng thái tạm khóa');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi khôi phục thuộc tính');
        }
    };

    const handlePermanentDelete = (record) => {
        Modal.confirm({
            title: 'Xóa vĩnh viễn thuộc tính',
            content: `Thuộc tính "${record.label}" sẽ bị xóa vĩnh viễn và không thể khôi phục.`,
            okText: 'Xóa vĩnh viễn',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteSpecDefinitionPermanently(record.id);
                    await fetchDefinitions();
                    message.success('Đã xóa vĩnh viễn thuộc tính');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Lỗi khi xóa vĩnh viễn thuộc tính');
                }
            },
        });
    };

    const handleToggleStatus = (record) => {
        const nextStatus = record.status === 'inactive' ? 'active' : 'inactive';
        Modal.confirm({
            title: nextStatus === 'active' ? 'Kích hoạt thuộc tính' : 'Tạm khóa thuộc tính',
            content: `Bạn có chắc chắn muốn ${nextStatus === 'active' ? 'kích hoạt' : 'tạm khóa'} thuộc tính "${record.label}"?`,
            okText: nextStatus === 'active' ? 'Kích hoạt' : 'Tạm khóa',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestUpdateSpecDefinitionStatus(record.id, nextStatus);
                    await fetchDefinitions();
                    message.success(nextStatus === 'active' ? 'Đã kích hoạt thuộc tính' : 'Đã tạm khóa thuộc tính');
                } catch (error) {
                    message.error(error?.response?.data?.message || 'Lỗi khi cập nhật trạng thái thuộc tính');
                }
            },
        });
    };

    const handleAddOption = () => {
        const trimmed = optionInput.trim();
        if (trimmed && !options.includes(trimmed)) {
            setOptions((prevOptions) => [...prevOptions, trimmed]);
            setOptionInput('');
        }
    };

    const handleRemoveOption = (optionToRemove) => {
        setOptions((prevOptions) => prevOptions.filter((opt) => opt !== optionToRemove));
        setDraggedOption((currentOption) => (currentOption === optionToRemove ? null : currentOption));
        setDragOverOption((currentOption) => (currentOption === optionToRemove ? null : currentOption));
    };

    const reorderOptions = (sourceOption, targetOption) => {
        if (!sourceOption || !targetOption || sourceOption === targetOption) {
            return;
        }

        setOptions((prevOptions) => {
            const sourceIndex = prevOptions.indexOf(sourceOption);
            const targetIndex = prevOptions.indexOf(targetOption);

            if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
                return prevOptions;
            }

            const nextOptions = [...prevOptions];
            const [movedOption] = nextOptions.splice(sourceIndex, 1);
            nextOptions.splice(targetIndex, 0, movedOption);
            return nextOptions;
        });
    };

    const isInteractiveDragTarget = (target) => (
        typeof target?.closest === 'function'
        && target.closest('button, a, input, textarea, select, [role="button"], .ant-btn, .ant-tag-close-icon')
    );

    const handleOptionDragStart = (event, option) => {
        if (isInteractiveDragTarget(event.target)) {
            event.preventDefault();
            return;
        }

        setDraggedOption(option);
        setDragOverOption(null);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', option);
    };

    const handleOptionDragOver = (event, option) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverOption(option);
    };

    const handleOptionDragLeave = (event, option) => {
        const relatedTarget = event.relatedTarget;
        if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
            return;
        }

        setDragOverOption((currentOption) => (currentOption === option ? null : currentOption));
    };

    const handleOptionDrop = (event, targetOption) => {
        event.preventDefault();
        const sourceOption = draggedOption || event.dataTransfer.getData('text/plain');
        reorderOptions(sourceOption, targetOption);
        setDraggedOption(null);
        setDragOverOption(null);
    };

    const handleOptionDragEnd = () => {
        setDraggedOption(null);
        setDragOverOption(null);
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const data = {
                ...values,
                options,
            };

            if (editing) {
                await requestUpdateSpecDefinition({ id: editing.id, ...data });
                message.success('Cập nhật thuộc tính thành công');
            } else {
                await requestCreateSpecDefinition(data);
                message.success('Thêm thuộc tính thành công');
            }

            setIsModalOpen(false);
            fetchDefinitions();
        } catch (error) {
            if (error?.errorFields) {
                return;
            }
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const canDragDefinition = (record) => filters.scope !== 'trash' && !record.deletedAt;

    const clearRowDragState = () => {
        setDraggedDefinition(null);
        setDragOverDefinitionId(null);
    };

    const handleRowDragStart = (event, record) => {
        if (!canDragDefinition(record)) {
            return;
        }

        if (isInteractiveDragTarget(event.target)) {
            event.preventDefault();
            return;
        }

        setDraggedDefinition({
            id: record.id,
            componentType: record.componentType,
        });
        setDragOverDefinitionId(record.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(record.id));
    };

    const handleRowDragEnter = (record) => {
        if (!draggedDefinition || record.id === draggedDefinition.id) {
            return;
        }

        if (draggedDefinition.componentType !== record.componentType) {
            return;
        }

        if (!canDragDefinition(record)) {
            return;
        }

        setDragOverDefinitionId(record.id);
    };

    const handleRowDragOver = (event, record) => {
        if (!draggedDefinition || !canDragDefinition(record)) {
            return;
        }

        if (draggedDefinition.componentType !== record.componentType) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const handleRowDrop = async (event, record) => {
        event.preventDefault();

        if (!draggedDefinition) {
            clearRowDragState();
            return;
        }

        if (draggedDefinition.id === record.id) {
            clearRowDragState();
            return;
        }

        if (draggedDefinition.componentType !== record.componentType) {
            message.error('Chỉ có thể sắp xếp trong cùng loại linh kiện');
            clearRowDragState();
            return;
        }

        try {
            const result = await requestReorderSpecDefinition({
                sourceId: draggedDefinition.id,
                targetId: record.id,
                status: filters.status,
            });

            await fetchDefinitions(
                { current: pagination.current, pageSize: pagination.pageSize },
                filters,
            );
            message.success(result?.message || 'Đã cập nhật thứ tự thuộc tính');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể cập nhật thứ tự thuộc tính');
        } finally {
            clearRowDragState();
        }
    };

    const handleRowDragEnd = () => {
        clearRowDragState();
    };

    const columns = [
        {
            title: 'Thuộc tính',
            key: 'definition',
            width: 280,
            render: (_, record) => (
                <div className="admin-cell-stack">
                    <span className={cx('definition-title', 'admin-cell-title', 'admin-cell-clamp-2')} title={record.label}>
                        {record.label}
                    </span>
                    <AdminMetaTag variant="info">{componentTypeLabels[record.componentType] || record.componentType}</AdminMetaTag>
                </div>
            ),
        },
        {
            title: 'Các giá trị',
            dataIndex: 'options',
            key: 'options',
            width: 360,
            render: (opts) => {
                const parsedOpts = Array.isArray(opts) ? opts : JSON.parse(opts || '[]');
                return (
                    <div className={cx('options-cell')}>
                        {parsedOpts.slice(0, 4).map((opt) => (
                            <AdminMetaTag key={opt} variant="info">{opt}</AdminMetaTag>
                        ))}
                        {parsedOpts.length > 4 && (
                            <AdminMetaTag variant="neutral">+{parsedOpts.length - 4}</AdminMetaTag>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 170,
            render: (_, record) => <AdminStatusTag domain="spec" status={record.status} deletedAt={record.deletedAt} />,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 130,
            align: 'right',
            render: (_, record) => (
                <AdminIconActionGroup className={cx('action-group')}>
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
                                onClick={() => handleEdit(record)}
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
                    <h2 className="admin-page-title">Quản lý thuộc tính linh kiện</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">
                        Hiển thị {pagination.total} {filters.scope === 'trash' ? 'thuộc tính linh kiện trong thùng rác' : 'thuộc tính linh kiện'}
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Thêm thuộc tính linh kiện
                    </Button>
                </div>
            </div>

            <div className="admin-toolbar">
                <div className="admin-toolbar-group admin-toolbar-group-fluid">
                    <AdminScopeSelect
                        value={filters.scope}
                        onChange={(value) => handleFilterChange({ scope: value })}
                    />
                    <AdminFilterSelect
                        value={filters.type}
                        onChange={(value) => handleFilterChange({ type: value })}
                        placeholder="Lọc theo loại linh kiện"
                        options={[
                            { value: 'all', label: 'Tất cả loại linh kiện' },
                            ...componentTypeOptions,
                        ]}
                    />
                    {filters.scope !== 'trash' && (
                        <AdminFilterSelect
                            value={filters.status}
                            onChange={(value) => handleFilterChange({ status: value })}
                            options={getAdminManagedStatusFilterOptions({
                                domain: 'spec',
                                includeAll: true,
                            })}
                        />
                    )}
                    <AdminFilterSearch
                        value={filters.search}
                        allowClear
                        placeholder="Tìm theo tên hiển thị hoặc mã thuộc tính"
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        onSearch={(value) => handleFilterChange({ search: value })}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={definitions}
                rowKey="id"
                loading={loading}
                className="admin-table"
                tableLayout="fixed"
                scroll={{ x: 920 }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
                rowClassName={(record) => cx('draggable-row', {
                    'row-dragging': draggedDefinition?.id === record.id,
                    'row-drag-over': dragOverDefinitionId === record.id && draggedDefinition?.id !== record.id,
                    'drag-disabled': !canDragDefinition(record),
                })}
                onRow={(record) => ({
                    draggable: canDragDefinition(record),
                    onDragStart: (event) => handleRowDragStart(event, record),
                    onDragEnter: () => handleRowDragEnter(record),
                    onDragOver: (event) => handleRowDragOver(event, record),
                    onDrop: (event) => handleRowDrop(event, record),
                    onDragEnd: handleRowDragEnd,
                })}
            />

            <Modal
                title={editing ? 'Sửa thuộc tính' : 'Thêm thuộc tính mới'}
                open={isModalOpen}
                onOk={handleModalOk}
                okText="Lưu"
                cancelText="Hủy"
                onCancel={() => setIsModalOpen(false)}
                width={600}
            >
                <Form form={form} layout="vertical" className={cx('modal-form')}>
                    <Form.Item
                        name="componentType"
                        label="Loại linh kiện"
                        rules={[{ required: true, message: 'Vui lòng chọn loại linh kiện!' }]}
                    >
                        <Select
                            disabled={!!editing}
                            className={cx('modal-select')}
                            options={componentTypeOptions}
                        />
                    </Form.Item>

                    <Form.Item
                        name="specKey"
                        label="Mã thuộc tính"
                        rules={[{ required: true, message: 'Vui lòng nhập mã thuộc tính!' }]}
                    >
                        <Input allowClear disabled={!!editing} placeholder="brand, socket, cores, vram..." />
                    </Form.Item>

                    <Form.Item
                        name="label"
                        label="Tên hiển thị"
                        rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
                    >
                        <Input allowClear placeholder="Hãng, Socket, Số nhân, VRAM..." />
                    </Form.Item>

                    <Form.Item label="Danh sách giá trị">
                        <div className={cx('option-input-row')}>
                            <Input
                                allowClear
                                value={optionInput}
                                onChange={(e) => setOptionInput(e.target.value)}
                                onPressEnter={handleAddOption}
                                placeholder="Nhập giá trị rồi nhấn Enter hoặc nút Thêm"
                                style={{ flex: 1 }}
                            />
                            <Button onClick={handleAddOption} type="dashed">
                                Thêm
                            </Button>
                        </div>
                        <div className={cx('selected-options')} role="list">
                            {options.map((opt) => (
                                <span
                                    key={opt}
                                    draggable
                                    role="listitem"
                                    title="Kéo để đổi thứ tự hiển thị"
                                    className={cx('option-drag-item', {
                                        dragging: draggedOption === opt,
                                        'drag-over': dragOverOption === opt && draggedOption !== opt,
                                    })}
                                    onDragStart={(event) => handleOptionDragStart(event, opt)}
                                    onDragOver={(event) => handleOptionDragOver(event, opt)}
                                    onDragLeave={(event) => handleOptionDragLeave(event, opt)}
                                    onDrop={(event) => handleOptionDrop(event, opt)}
                                    onDragEnd={handleOptionDragEnd}
                                >
                                    <AdminMetaTag
                                        variant="info"
                                        closable
                                        className={cx('option-tag')}
                                        onClose={() => handleRemoveOption(opt)}
                                    >
                                        {opt}
                                    </AdminMetaTag>
                                </span>
                            ))}
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerSpecDefinitions;
