import { Table } from 'antd';
import {
    CheckCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    PauseCircleOutlined,
    RollbackOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';

import styles from './ManagerProduct.module.scss';
import { getFirstResolvedImage } from '../../../../lib/assetUrl';
import { AdminMetaTag, AdminStatusTag, AdminStockTag } from '../shared/AdminTag';
import { AdminIconAction, AdminIconActionGroup } from '../shared/AdminIconAction';
import { getProductTypeLabel, isDeletedProduct, isInactiveProduct } from '../shared/adminProductDetail';

const cx = classNames.bind(styles);

function ProductTable({
    products,
    loading,
    pagination,
    getCategoryName,
    onTableChange,
    onViewProduct,
    onEdit,
    onChangeProductStatus,
    onDelete,
    onRestore,
    onPermanentDelete,
}) {
    const columns = [
        {
            title: 'Ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 132,
            render: (images, record) => (
                <button
                    type="button"
                    className={cx('product-thumbnail-button')}
                    onClick={(event) => {
                        event.stopPropagation();
                        onViewProduct(record);
                    }}
                    aria-label={`Xem chi tiết ${record.name}`}
                >
                    <img src={getFirstResolvedImage(images)} alt={record.name} className={cx('product-thumbnail')} />
                </button>
            ),
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (name, record) => (
                <button
                    type="button"
                    className={cx('product-summary-button')}
                    onClick={(event) => {
                        event.stopPropagation();
                        onViewProduct(record);
                    }}
                    aria-label={`Xem chi tiết ${name}`}
                >
                    <div className={cx('product-summary')}>
                        <span className={cx('product-name-cell')} title={name}>
                            {name}
                        </span>
                        <div className={cx('product-meta')}>
                            <AdminMetaTag variant="info">{getProductTypeLabel(record.componentType)}</AdminMetaTag>
                            <AdminMetaTag variant="category">{getCategoryName(record.categoryId)}</AdminMetaTag>
                            <AdminStockTag stock={record.stock} />
                        </div>
                    </div>
                </button>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 160,
            render: (_, record) => <AdminStatusTag domain="product" status={record.status} deletedAt={record.deletedAt} />,
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            width: 180,
            align: 'right',
            render: (price) => <span className={cx('price-cell')}>{Number(price).toLocaleString('vi-VN')} VNĐ</span>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 130,
            align: 'right',
            render: (_, record) => {
                const isDeleted = isDeletedProduct(record);

                return (
                    <AdminIconActionGroup
                        className={cx('action-group')}
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        {isDeleted ? (
                            <>
                                <AdminIconAction
                                    title="Khôi phục"
                                    icon={<RollbackOutlined />}
                                    variant="restore"
                                    onClick={() => onRestore(record)}
                                />
                                <AdminIconAction
                                    title="Xóa vĩnh viễn"
                                    icon={<DeleteOutlined />}
                                    variant="delete"
                                    onClick={() => onPermanentDelete(record)}
                                />
                            </>
                        ) : (
                            <>
                                <AdminIconAction
                                    title="Sửa"
                                    icon={<EditOutlined />}
                                    variant="edit"
                                    onClick={() => onEdit(record)}
                                />
                                <AdminIconAction
                                    title={isInactiveProduct(record) ? 'Kích hoạt' : 'Tạm khóa'}
                                    icon={isInactiveProduct(record) ? <CheckCircleOutlined /> : <PauseCircleOutlined />}
                                    variant={isInactiveProduct(record) ? 'activate' : 'deactivate'}
                                    onClick={() =>
                                        onChangeProductStatus(record, isInactiveProduct(record) ? 'active' : 'inactive')
                                    }
                                />
                                <AdminIconAction
                                    title="Xóa"
                                    icon={<DeleteOutlined />}
                                    variant="delete"
                                    onClick={() => onDelete(record)}
                                />
                            </>
                        )}
                    </AdminIconActionGroup>
                );
            },
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={products}
            rowKey="id"
            loading={loading}
            className="admin-table"
            tableLayout="fixed"
            scroll={{ x: 960 }}
            rowClassName={() => cx('clickable-row')}
            onRow={(record) => ({
                onClick: () => onViewProduct(record),
            })}
            onChange={onTableChange}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
            }}
        />
    );
}

export default ProductTable;
