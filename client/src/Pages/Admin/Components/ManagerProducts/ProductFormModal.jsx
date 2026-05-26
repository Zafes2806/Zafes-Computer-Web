import { Form, Input, InputNumber, Modal, Select, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';

import styles from './ManagerProduct.module.scss';
import LazyTinymceEditor from '../../../../Components/LazyTinymceEditor/LazyTinymceEditor';
import {
    PRODUCT_EDITOR_INIT,
    PRODUCT_PC_CONFIGURATION_ROWS,
} from './productManagerOptions';

const cx = classNames.bind(styles);

function getCategoryHelpText(category) {
    if (category?.deletedAt) {
        return 'Danh mục này đang ở trong thùng rác. Hãy chọn hoặc khôi phục một danh mục hợp lệ trước khi lưu.';
    }

    if (category && category.status !== 'active') {
        return 'Danh mục này đang tạm khóa. Bạn chỉ có thể lưu sản phẩm ở trạng thái tạm khóa.';
    }

    return null;
}

function parseSpecOptions(options) {
    if (Array.isArray(options)) {
        return options;
    }

    try {
        const parsedOptions = JSON.parse(options || '[]');
        return Array.isArray(parsedOptions) ? parsedOptions : [];
    } catch {
        return [];
    }
}

function ProductFormModal({
    form,
    open,
    editingProduct,
    productType,
    selectedCategory,
    categoryFormOptions,
    productStatusFormOptions,
    editorContent,
    fileList,
    specDefinitions,
    specValues,
    productTypeOptions,
    onSubmit,
    onCancel,
    onProductTypeChange,
    onCategoryChange,
    onEditorChange,
    onFileListChange,
    onSpecValueChange,
}) {
    const uploadProps = {
        onRemove: (file) => {
            onFileListChange(fileList.filter((item) => item.uid !== file.uid));
        },
        beforeUpload: () => false,
        onChange: (info) => {
            onFileListChange(info.fileList);
        },
        fileList,
        multiple: true,
    };

    return (
        <Modal
            title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            open={open}
            onOk={onSubmit}
            okText="Lưu"
            cancelText="Hủy"
            onCancel={onCancel}
            width={800}
            destroyOnHidden
        >
            <Form form={form} layout="vertical" className={cx('form')}>
                <Form.Item
                    name="componentType"
                    label="Loại sản phẩm"
                    rules={[{ required: true, message: 'Vui lòng chọn loại sản phẩm!' }]}
                    initialValue="pc"
                >
                    <Select options={productTypeOptions} onChange={onProductTypeChange} />
                </Form.Item>

                <div className={cx('form-row')}>
                    <Form.Item
                        name="name"
                        label="Tên sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
                    >
                        <Input allowClear />
                    </Form.Item>

                    <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}>
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="discount"
                        label="Giảm giá (%)"
                        rules={[{ required: true, message: 'Vui lòng nhập % giảm giá!' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            max={100}
                            formatter={(value) => `${value}%`}
                            parser={(value) => value?.replace('%', '')}
                        />
                    </Form.Item>
                </div>

                <div className={cx('form-row')}>
                    <Form.Item
                        name="category"
                        label="Danh mục"
                        extra={getCategoryHelpText(selectedCategory)}
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                    >
                        <Select options={categoryFormOptions} onChange={onCategoryChange} />
                    </Form.Item>

                    <Form.Item
                        name="stock"
                        label="Số lượng trong kho"
                        rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Trạng thái kinh doanh"
                        initialValue="active"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái sản phẩm!' }]}
                    >
                        <Select options={productStatusFormOptions} />
                    </Form.Item>
                </div>

                <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                >
                    {open ? (
                        <LazyTinymceEditor
                            key={editingProduct?.id || 'create-product'}
                            init={PRODUCT_EDITOR_INIT}
                            initialValue={editorContent || ''}
                            onEditorChange={onEditorChange}
                        />
                    ) : null}
                </Form.Item>

                <Form.Item
                    name="images"
                    label="Hình ảnh"
                    rules={[
                        {
                            required: !editingProduct,
                            message: 'Vui lòng tải lên ít nhất 1 hình ảnh!',
                        },
                    ]}
                >
                    <Upload {...uploadProps} listType="picture-card">
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Tải ảnh</div>
                        </div>
                    </Upload>
                </Form.Item>

                {productType === 'pc' && (
                    <>
                        {PRODUCT_PC_CONFIGURATION_ROWS.map((row) => (
                            <div key={row.map((field) => field.key).join('-')} className={cx('form-row')}>
                                {row.map((field) => (
                                    <Form.Item
                                        key={field.key}
                                        name={['pcConfiguration', field.key]}
                                        label={field.label}
                                        rules={[{ required: true }]}
                                    >
                                        <Input allowClear />
                                    </Form.Item>
                                ))}
                            </div>
                        ))}
                    </>
                )}

                {productType !== 'pc' && specDefinitions.length > 0 && (
                    <>
                        <h4 style={{ marginTop: 16, marginBottom: 8 }}>Thông số kỹ thuật</h4>
                        <div className={cx('form-row')}>
                            {specDefinitions.map((definition) => (
                                <Form.Item key={definition.specKey} label={definition.label}>
                                    <Select
                                        value={specValues[definition.specKey] || undefined}
                                        onChange={(value) => onSpecValueChange(definition.specKey, value)}
                                        placeholder={`Chọn ${definition.label}`}
                                        allowClear
                                        options={parseSpecOptions(definition.options).map((option) => ({
                                            value: option,
                                            label: option,
                                        }))}
                                    />
                                </Form.Item>
                            ))}
                        </div>
                    </>
                )}
            </Form>
        </Modal>
    );
}

export default ProductFormModal;
