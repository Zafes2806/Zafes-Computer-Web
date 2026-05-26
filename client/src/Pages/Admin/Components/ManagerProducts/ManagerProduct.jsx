import { Button, Form, Modal, message } from 'antd';
import {
    InboxOutlined,
    LockOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';

import styles from './ManagerProduct.module.scss';
import { getBaseComponentType } from '../../../../constants/componentTypes';
import { resolveAssetUrl } from '../../../../lib/assetUrl';
import {
    requestCreateProduct,
    requestDeleteProduct,
    requestDeleteProductPermanently,
    requestGetCategory,
    requestGetProductById,
    requestGetProducts,
    requestGetSpecDefinitions,
    requestRestoreProduct,
    requestUpdateProduct,
    requestUpdateProductStatus,
    requestUploadImages,
} from '../../../../api';
import AdminProductDetailModal from '../shared/AdminProductDetailModal';
import { getAdminManagedStatusFilterOptions, getAdminStatusFormOptions } from '../shared/adminTagOptions';
import {
    buildProductDetailFooter,
    getPcConfigurationFormValues,
    isDeletedProduct,
    isInactiveProduct,
} from '../shared/adminProductDetail';
import ProductFilters from './ProductFilters';
import ProductFormModal from './ProductFormModal';
import ProductTable from './ProductTable';
import { useComponentTypes } from '../../../../hooks/useComponentTypes';

const cx = classNames.bind(styles);

const DETAIL_ACTION_STYLES = Object.freeze({
    activate: { color: '#2f855a', borderColor: '#2f855a', background: 'transparent', boxShadow: 'none' },
    deactivate: { color: '#64748b', borderColor: '#64748b', background: 'transparent', boxShadow: 'none' },
    edit: { color: '#1677ff', borderColor: '#1677ff', background: 'transparent', boxShadow: 'none' },
    restore: { color: '#1677ff', borderColor: '#1677ff', background: 'transparent', boxShadow: 'none' },
    delete: { color: '#d84b63', borderColor: '#d84b63', background: 'transparent', boxShadow: 'none' },
});

const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.message?.trim() || error?.message || fallback;

const CATEGORY_STATUS_SORT_ORDER = Object.freeze({
    active: 0,
    inactive: 1,
    deleted: 2,
});

function getCategoryLifecycleStatus(category) {
    if (category?.deletedAt) {
        return 'deleted';
    }

    return category?.status || 'active';
}

function getCategoryLifecycleLabel(category) {
    const status = getCategoryLifecycleStatus(category);

    if (status === 'deleted') {
        return 'Thùng rác';
    }

    if (status === 'inactive') {
        return 'Tạm khóa';
    }

    return '';
}

function getCategoryLifecycleIcon(category) {
    const status = getCategoryLifecycleStatus(category);

    if (status === 'deleted') {
        return <InboxOutlined />;
    }

    if (status === 'inactive') {
        return <LockOutlined />;
    }

    return null;
}

function sortAdminCategories(categories = []) {
    return [...categories].sort((left, right) => {
        const leftStatusOrder = CATEGORY_STATUS_SORT_ORDER[getCategoryLifecycleStatus(left)] ?? 99;
        const rightStatusOrder = CATEGORY_STATUS_SORT_ORDER[getCategoryLifecycleStatus(right)] ?? 99;

        if (leftStatusOrder !== rightStatusOrder) {
            return leftStatusOrder - rightStatusOrder;
        }

        return String(left?.name || '').localeCompare(String(right?.name || ''), 'vi', {
            sensitivity: 'base',
        });
    });
}

function ManagerProduct() {
    const { componentTypes: productComponentTypes } = useComponentTypes({ productOnly: true });
    const [searchParams] = useSearchParams();
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [detailProduct, setDetailProduct] = useState(null);
    const [detailReviewCount, setDetailReviewCount] = useState(0);
    const [detailLoading, setDetailLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [editorContent, setEditorContent] = useState('');
    const [productType, setProductType] = useState('pc');
    const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
    const [dataScope, setDataScope] = useState(searchParams.get('scope') === 'trash' ? 'trash' : 'managed');
    const [componentTypeFilter, setComponentTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockStatusFilter, setStockStatusFilter] = useState('all');
    const [productStatusFilter, setProductStatusFilter] = useState(
        ['active', 'inactive', 'all'].includes(searchParams.get('status')) ? searchParams.get('status') : 'active',
    );
    const [specDefinitions, setSpecDefinitions] = useState([]);
    const [specValues, setSpecValues] = useState({});
    const [products, setProducts] = useState([]);
    const [adminCategories, setAdminCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const productFetchSequenceRef = useRef(0);
    const categoryFetchSequenceRef = useRef(0);
    const selectedCategoryId = Form.useWatch('category', form);
    const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;

    const fetchProducts = useCallback(async () => {
        const fetchSequence = productFetchSequenceRef.current + 1;
        productFetchSequenceRef.current = fetchSequence;

        setLoading(true);
        try {
            const response = await requestGetProducts({
                page: paginationCurrent,
                limit: paginationPageSize,
                includeDeleted: dataScope === 'trash',
                status: dataScope === 'trash' ? 'deleted' : productStatusFilter,
                ...(searchKeyword.trim() ? { search: searchKeyword.trim() } : {}),
                ...(componentTypeFilter !== 'all' ? { componentType: componentTypeFilter } : {}),
                ...(categoryFilter !== 'all' ? { categoryId: categoryFilter } : {}),
                ...(dataScope !== 'trash' && stockStatusFilter !== 'all' ? { stockStatus: stockStatusFilter } : {}),
            });

            if (fetchSequence !== productFetchSequenceRef.current) {
                return;
            }

            setProducts(Array.isArray(response.metadata) ? response.metadata : []);
            setPagination((prev) => ({
                ...prev,
                current: response.pagination?.page || prev.current,
                pageSize: response.pagination?.limit || prev.pageSize,
                total: response.pagination?.totalItems || 0,
            }));
        } catch (error) {
            if (fetchSequence !== productFetchSequenceRef.current) {
                return;
            }

            setProducts([]);
            setPagination((prev) => ({
                ...prev,
                total: 0,
            }));
            message.error(error?.response?.data?.message || 'Không thể tải danh sách sản phẩm');
        } finally {
            if (fetchSequence === productFetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, [
        categoryFilter,
        componentTypeFilter,
        dataScope,
        paginationCurrent,
        paginationPageSize,
        productStatusFilter,
        searchKeyword,
        stockStatusFilter,
    ]);

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
            setAdminCategories(sortAdminCategories(Array.isArray(response.metadata) ? response.metadata : []));
        } catch (error) {
            if (fetchSequence !== categoryFetchSequenceRef.current) {
                return;
            }

            setAdminCategories([]);
            message.error(error?.response?.data?.message || 'Không thể tải danh mục quản trị');
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        fetchAdminCategories();
    }, [fetchAdminCategories]);

    useEffect(() => {
        if (productType && productType !== 'pc') {
            const fetchSpecs = async () => {
                try {
                    const response = await requestGetSpecDefinitions({ componentType: productType });
                    setSpecDefinitions(response.metadata || []);
                } catch {
                    setSpecDefinitions([]);
                }
            };

            fetchSpecs();
            return;
        }

        setSpecDefinitions([]);
        setSpecValues({});
    }, [productType]);

    const productStatusOptions = [
        ...getAdminManagedStatusFilterOptions({
            domain: 'product',
            includeAll: true,
        }),
    ];

    const handleSearch = (value) => {
        setLoading(true);
        setSearchKeyword(value);
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
    };

    const handleProductStatusFilterChange = (value) => {
        setLoading(true);
        setProductStatusFilter(value);
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
    };

    const handleDataScopeChange = (value) => {
        setLoading(true);
        setDataScope(value);
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
    };

    const handleComponentTypeFilterChange = (value) => {
        setLoading(true);
        setComponentTypeFilter(value);
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
    };

    const handleCategoryFilterChange = (value) => {
        setLoading(true);
        setCategoryFilter(value);
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
    };

    const handleStockStatusFilterChange = (value) => {
        setLoading(true);
        setStockStatusFilter(value);
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
    };

    const handleTableChange = (nextPagination) => {
        setLoading(true);
        setPagination((prev) => ({
            ...prev,
            current: nextPagination.current,
            pageSize: nextPagination.pageSize,
        }));
    };

    const getCategoryOptionLabel = (category) => category?.name || 'Chưa phân loại';

    const renderCategorySelectLabel = (category) => {
        const lifecycleLabel = getCategoryLifecycleLabel(category);
        const lifecycleIcon = getCategoryLifecycleIcon(category);

        return (
            <span className={cx('category-option-label')}>
                <span className={cx('category-option-name')}>{getCategoryOptionLabel(category)}</span>
                {lifecycleLabel && (
                    <span className={cx('category-option-status')}>
                        <span className={cx('category-option-icon')}>{lifecycleIcon}</span>
                        {lifecycleLabel}
                    </span>
                )}
            </span>
        );
    };

    const getCategoryById = (categoryId) => adminCategories.find((item) => item.id === categoryId) || null;

    const getCategoryName = (categoryId) => getCategoryOptionLabel(getCategoryById(categoryId));

    const selectedCategory = getCategoryById(selectedCategoryId);

    const categoryFilterOptions = [
        { value: 'all', label: 'Tất cả danh mục' },
        ...adminCategories.map((item) => ({
            value: item.id,
            label: renderCategorySelectLabel(item),
        })),
    ];

    const categoryFormOptions = adminCategories.map((item) => ({
        value: item.id,
        label: renderCategorySelectLabel(item),
        disabled: Boolean(item.deletedAt),
    }));

    const productStatusFormOptions = getAdminStatusFormOptions({
        domain: 'product',
        values: ['active', 'inactive'],
    }).map((option) => (
        option.value === 'active' && selectedCategory && (selectedCategory.deletedAt || selectedCategory.status !== 'active')
            ? {
                ...option,
                disabled: true,
            }
            : option
    ));

    const resetProductForm = () => {
        setEditingProduct(null);
        setProductType('pc');
        setSpecValues({});
        setSpecDefinitions([]);
        setFileList([]);
        setEditorContent('');
        form.resetFields();
    };

    const handleAdd = () => {
        resetProductForm();
        form.setFieldsValue({
            componentType: 'pc',
            discount: 0,
            status: 'active',
            pcConfiguration: getPcConfigurationFormValues(),
        });
        setIsModalOpen(true);
    };

    const handleEdit = async (record) => {
        setEditingProduct(record);
        const normalizedComponentType = getBaseComponentType(record.componentType || 'pc');
        setProductType(normalizedComponentType);

        form.setFieldsValue({
            name: record.name,
            price: record.price,
            discount: record.discount || 0,
            stock: record.stock,
            category: record.categoryId,
            description: record.description,
            pcConfiguration: getPcConfigurationFormValues(record.pcConfiguration),
            componentType: normalizedComponentType,
            status: record.status || 'active',
        });

        if (record.images) {
            const imageList = Array.isArray(record.images) ? record.images : record.images.split(',');
            setFileList(
                imageList.map((image, index) => ({
                    uid: `-${index}`,
                    name: `image-${index}`,
                    status: 'done',
                    url: resolveAssetUrl(image),
                    serverPath: image,
                })),
            );
        } else {
            setFileList([]);
        }

        setEditorContent(record.description || '');
        setIsModalOpen(true);

        if (normalizedComponentType !== 'pc') {
            try {
                const response = await requestGetProductById(record.id, { includeDeleted: true });
                const specs = response.metadata?.product?.specs || [];
                const values = {};

                specs.forEach((spec) => {
                    values[spec.specKey] = spec.specValue;
                });

                setSpecValues(values);
            } catch {
                setSpecValues({});
            }
            return;
        }

        setSpecValues({});
    };

    const handleCloseProductModal = () => {
        setIsModalOpen(false);
        resetProductForm();
    };

    const handleCategoryFieldChange = (categoryId) => {
        const nextCategory = getCategoryById(categoryId);
        if (!nextCategory || nextCategory.status === 'active') {
            return;
        }

        if (form.getFieldValue('status') === 'active') {
            form.setFieldsValue({ status: 'inactive' });
            message.info('Danh mục đang tạm khóa nên sản phẩm được chuyển về trạng thái tạm khóa.');
        }
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Xóa sản phẩm',
            content: `Sản phẩm "${record.name}" sẽ bị ẩn khỏi quản trị hằng ngày và trang bán hàng. Bạn vẫn có thể khôi phục lại sau.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteProduct(record.id);
                    await fetchProducts();
                    message.success('Đã xóa sản phẩm');
                } catch (error) {
                    message.error(getApiErrorMessage(error, 'Không thể xóa sản phẩm'));
                }
            },
        });
    };

    const handleChangeProductStatus = (record, nextStatus) => {
        const actionLabel = nextStatus === 'active' ? 'kích hoạt' : 'tạm khóa';
        const successLabel = nextStatus === 'active' ? 'Đã kích hoạt sản phẩm' : 'Đã chuyển sản phẩm sang tạm khóa';
        const content =
            nextStatus === 'active'
                ? `Sản phẩm "${record.name}" sẽ hiển thị lại cho khách hàng và có thể tham gia bán hàng.`
                : `Sản phẩm "${record.name}" sẽ bị ẩn khỏi trang bán hàng nhưng vẫn giữ nguyên dữ liệu để quản trị.`;

        Modal.confirm({
            title: nextStatus === 'active' ? 'Kích hoạt sản phẩm' : 'Tạm khóa sản phẩm',
            content,
            okText: actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1),
            cancelText: 'Hủy',
            onOk: async () => {
                const response = await requestUpdateProductStatus(record.id, nextStatus);
                await fetchProducts();

                if (detailProduct?.id === record.id) {
                    setDetailProduct(response.metadata || { ...record, status: nextStatus });
                }

                message.success(successLabel);
            },
        });
    };

    const handleRestore = (record) => {
        Modal.confirm({
            title: 'Khôi phục sản phẩm từ thùng rác',
            content: `Sản phẩm "${record.name}" sẽ được khôi phục về trạng thái tạm khóa để bạn kiểm tra trước khi mở bán lại.`,
            okText: 'Khôi phục',
            cancelText: 'Hủy',
            onOk: async () => {
                const response = await requestRestoreProduct(record.id);
                await fetchProducts();

                if (detailProduct?.id === record.id) {
                    setDetailProduct(response.metadata || { ...record, deletedAt: null, status: 'inactive' });
                }

                message.success('Đã khôi phục sản phẩm về trạng thái tạm khóa');
            },
        });
    };

    const handlePermanentDelete = (record) => {
        Modal.confirm({
            title: 'Xóa vĩnh viễn sản phẩm',
            content: `Hành động này sẽ xóa hẳn sản phẩm "${record.name}" và không thể khôi phục. Nếu sản phẩm đã phát sinh đơn hàng, hệ thống sẽ chặn xóa vĩnh viễn để giữ lịch sử mua hàng, hóa đơn và báo cáo.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteProductPermanently(record.id);
                    await fetchProducts();

                    if (detailProduct?.id === record.id) {
                        handleCloseDetailModal();
                    }

                    message.success('Đã xóa vĩnh viễn sản phẩm');
                } catch (error) {
                    const errorMessage = getApiErrorMessage(error, 'Không thể xóa vĩnh viễn sản phẩm');
                    const content = errorMessage.includes('đơn hàng')
                        ? 'Không thể xóa vĩnh viễn sản phẩm đã phát sinh trong đơn hàng'
                        : errorMessage;

                    Modal.warning({
                        title: 'Không thể xóa vĩnh viễn sản phẩm',
                        content,
                        okText: 'Đã hiểu',
                    });
                }
            },
        });
    };

    const handleViewProduct = async (record) => {
        setIsDetailModalOpen(true);
        setDetailLoading(true);
        setDetailProduct(record);
        setDetailReviewCount(0);

        try {
            const response = await requestGetProductById(record.id, { includeDeleted: true });
            setDetailProduct(response.metadata?.product || record);
            setDetailReviewCount(Array.isArray(response.metadata?.reviews) ? response.metadata.reviews.length : 0);
        } catch (error) {
            setDetailProduct(record);
            message.error(error?.response?.data?.message || 'Không thể tải chi tiết sản phẩm');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setDetailProduct(null);
        setDetailReviewCount(0);
        setDetailLoading(false);
    };

    const handleSpecValueChange = (specKey, value) => {
        setSpecValues((prev) => ({
            ...prev,
            [specKey]: value,
        }));
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const selectedProductType = values.componentType || productType || 'pc';
            const selectedProductCategory = getCategoryById(values.category);
            let imageUrls = [];

            if (!selectedProductCategory) {
                message.error('Danh mục không còn tồn tại. Hãy tải lại danh sách và chọn lại danh mục.');
                return;
            }

            if (selectedProductCategory.deletedAt) {
                message.error('Không thể gán sản phẩm vào danh mục đã nằm trong thùng rác.');
                return;
            }

            if (values.status === 'active' && selectedProductCategory.status !== 'active') {
                message.error('Không thể mở bán sản phẩm khi danh mục đang tạm khóa. Hãy kích hoạt danh mục hoặc lưu sản phẩm ở trạng thái tạm khóa.');
                return;
            }

            const newImages = fileList.filter((file) => file.originFileObj);
            if (newImages.length > 0) {
                const formData = new FormData();
                newImages.forEach((file) => {
                    formData.append('images', file.originFileObj);
                });

                const uploadResponse = await requestUploadImages(formData);
                const existingImages = fileList
                    .filter((file) => !file.originFileObj)
                    .map((file) => file.serverPath || file.url);

                imageUrls = [...existingImages, ...uploadResponse.images];
            } else {
                imageUrls = fileList.map((file) => file.serverPath || file.url);
            }

            const payload = {
                ...values,
                description: editorContent,
                images: imageUrls.join(','),
                componentType: selectedProductType,
                category: values.category,
                pcConfiguration:
                    selectedProductType === 'pc' ? getPcConfigurationFormValues(values.pcConfiguration) : undefined,
                specs:
                    selectedProductType !== 'pc'
                        ? specDefinitions
                              .map((definition) => ({
                                  specKey: definition.specKey,
                                  specValue: specValues[definition.specKey] || '',
                              }))
                              .filter((spec) => spec.specValue)
                        : undefined,
            };

            if (editingProduct) {
                await requestUpdateProduct({
                    ...payload,
                    id: editingProduct.id,
                });
            } else {
                await requestCreateProduct(payload);
            }

            const successMessage = `${editingProduct ? 'Cập nhật' : 'Thêm'} sản phẩm thành công`;
            await fetchProducts();
            handleCloseProductModal();
            message.success(successMessage);
        } catch (error) {
            if (error?.errorFields) {
                message.error('Vui lòng kiểm tra lại các trường bắt buộc');
                return;
            }

            message.error(error?.response?.data?.message || 'Không thể lưu sản phẩm');
        }
    };

    return (
        <div className={`${cx('wrapper')} admin-page admin-card`}>
            <div className={`${cx('header')} admin-page-header`}>
                <div className="admin-page-header-main">
                    <h2 className="admin-page-title">Quản lý sản phẩm</h2>
                </div>
                <div className="admin-page-header-actions">
                    <div className="admin-page-summary">
                        Hiển thị {pagination.total} {dataScope === 'trash' ? 'sản phẩm trong thùng rác' : 'sản phẩm'}
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Thêm sản phẩm
                    </Button>
                </div>
            </div>

            <ProductFilters
                dataScope={dataScope}
                productStatusFilter={productStatusFilter}
                componentTypeFilter={componentTypeFilter}
                categoryFilter={categoryFilter}
                stockStatusFilter={stockStatusFilter}
                searchKeyword={searchKeyword}
                productStatusOptions={productStatusOptions}
                componentTypeFilterOptions={[
                    { value: 'all', label: 'Tất cả loại sản phẩm' },
                    ...productComponentTypes.map(({ value, label }) => ({ value, label })),
                ]}
                categoryFilterOptions={categoryFilterOptions}
                onDataScopeChange={handleDataScopeChange}
                onProductStatusFilterChange={handleProductStatusFilterChange}
                onComponentTypeFilterChange={handleComponentTypeFilterChange}
                onCategoryFilterChange={handleCategoryFilterChange}
                onStockStatusFilterChange={handleStockStatusFilterChange}
                onSearch={handleSearch}
            />

            <ProductTable
                products={products}
                loading={loading}
                pagination={pagination}
                getCategoryName={getCategoryName}
                onTableChange={handleTableChange}
                onViewProduct={handleViewProduct}
                onEdit={handleEdit}
                onChangeProductStatus={handleChangeProductStatus}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
            />

            <ProductFormModal
                form={form}
                open={isModalOpen}
                editingProduct={editingProduct}
                productType={productType}
                selectedCategory={selectedCategory}
                categoryFormOptions={categoryFormOptions}
                productStatusFormOptions={productStatusFormOptions}
                editorContent={editorContent}
                fileList={fileList}
                specDefinitions={specDefinitions}
                specValues={specValues}
                productTypeOptions={productComponentTypes.map(({ value, label }) => ({ value, label }))}
                onSubmit={handleModalOk}
                onCancel={handleCloseProductModal}
                onProductTypeChange={setProductType}
                onCategoryChange={handleCategoryFieldChange}
                onEditorChange={(content) => {
                    setEditorContent(content);
                    form.setFieldsValue({ description: content });
                }}
                onFileListChange={setFileList}
                onSpecValueChange={handleSpecValueChange}
            />

            <AdminProductDetailModal
                open={isDetailModalOpen}
                loading={detailLoading}
                product={detailProduct}
                reviewCount={detailReviewCount}
                onClose={handleCloseDetailModal}
                getCategoryName={getCategoryName}
                footer={
                    detailProduct
                        ? buildProductDetailFooter(
                              [
                                  !isDeletedProduct(detailProduct) && (
                                      <Button
                                          key="status"
                                          type="default"
                                          style={
                                              isInactiveProduct(detailProduct)
                                                  ? DETAIL_ACTION_STYLES.activate
                                                  : DETAIL_ACTION_STYLES.deactivate
                                          }
                                          className={`admin-action-button detail-action-button ${
                                              isInactiveProduct(detailProduct)
                                                  ? 'admin-action-activate'
                                                  : 'admin-action-deactivate'
                                          }`}
                                          onClick={() =>
                                              handleChangeProductStatus(
                                                  detailProduct,
                                                  isInactiveProduct(detailProduct) ? 'active' : 'inactive',
                                              )
                                          }
                                      >
                                          {isInactiveProduct(detailProduct) ? 'Kích hoạt' : 'Tạm khóa'}
                                      </Button>
                                  ),
                                  !isDeletedProduct(detailProduct) && (
                                      <Button
                                          key="edit"
                                          type="default"
                                          style={DETAIL_ACTION_STYLES.edit}
                                          className="admin-action-button detail-action-button admin-action-edit"
                                          onClick={() => {
                                              handleCloseDetailModal();
                                              handleEdit(detailProduct);
                                          }}
                                      >
                                          Sửa
                                      </Button>
                                  ),
                                  isDeletedProduct(detailProduct) && (
                                      <Button
                                          key="restore"
                                          type="default"
                                          style={DETAIL_ACTION_STYLES.restore}
                                          className="admin-action-button detail-action-button admin-action-restore"
                                          onClick={() => handleRestore(detailProduct)}
                                      >
                                          Khôi phục
                                      </Button>
                                  ),
                                  isDeletedProduct(detailProduct) && (
                                      <Button
                                          key="permanent-delete"
                                          type="default"
                                          style={DETAIL_ACTION_STYLES.delete}
                                          className="admin-action-button detail-action-button admin-action-delete"
                                          onClick={() => handlePermanentDelete(detailProduct)}
                                      >
                                          Xóa vĩnh viễn
                                      </Button>
                                  ),
                                  !isDeletedProduct(detailProduct) && (
                                      <Button
                                          key="delete"
                                          type="default"
                                          style={DETAIL_ACTION_STYLES.delete}
                                          className="admin-action-button detail-action-button admin-action-delete"
                                          onClick={() => handleDelete(detailProduct)}
                                      >
                                          Xóa
                                      </Button>
                                  ),
                              ],
                              handleCloseDetailModal,
                          )
                        : buildProductDetailFooter([], handleCloseDetailModal)
                }
            />
        </div>
    );
}

export default ManagerProduct;
