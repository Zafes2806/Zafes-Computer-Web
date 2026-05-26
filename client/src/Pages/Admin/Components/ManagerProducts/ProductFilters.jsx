import classNames from 'classnames/bind';

import styles from './ManagerProduct.module.scss';
import {
    AdminFilterSearch,
    AdminFilterSelect,
    AdminScopeSelect,
    AdminWideFilterSelect,
} from '../shared/AdminFilterControls';
import { PRODUCT_STOCK_STATUS_OPTIONS } from './productManagerOptions';

const cx = classNames.bind(styles);

function ProductFilters({
    dataScope,
    productStatusFilter,
    componentTypeFilter,
    categoryFilter,
    stockStatusFilter,
    searchKeyword,
    productStatusOptions,
    componentTypeFilterOptions,
    categoryFilterOptions,
    onDataScopeChange,
    onProductStatusFilterChange,
    onComponentTypeFilterChange,
    onCategoryFilterChange,
    onStockStatusFilterChange,
    onSearch,
}) {
    return (
        <div className={`${cx('search-container')} admin-toolbar`}>
            <div className="admin-toolbar-group admin-toolbar-group-fluid">
                <AdminScopeSelect value={dataScope} onChange={onDataScopeChange} />
                {dataScope !== 'trash' && (
                    <AdminFilterSelect
                        value={productStatusFilter}
                        onChange={onProductStatusFilterChange}
                        options={productStatusOptions}
                    />
                )}
                <AdminWideFilterSelect
                    value={componentTypeFilter}
                    onChange={onComponentTypeFilterChange}
                    options={componentTypeFilterOptions}
                />
                <AdminWideFilterSelect
                    value={categoryFilter}
                    onChange={onCategoryFilterChange}
                    options={categoryFilterOptions}
                />
                {dataScope !== 'trash' && (
                    <AdminFilterSelect
                        value={stockStatusFilter}
                        onChange={onStockStatusFilterChange}
                        options={PRODUCT_STOCK_STATUS_OPTIONS}
                    />
                )}
                <AdminFilterSearch
                    placeholder="Tìm theo tên sản phẩm..."
                    allowClear
                    enterButton
                    value={searchKeyword}
                    onSearch={onSearch}
                    onChange={(event) => onSearch(event.target.value)}
                />
            </div>
        </div>
    );
}

export default ProductFilters;
