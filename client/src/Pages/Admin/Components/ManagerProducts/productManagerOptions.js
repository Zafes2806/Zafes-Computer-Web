export const PRODUCT_STOCK_STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả tồn kho' },
    { value: 'in_stock', label: 'Còn hàng' },
    { value: 'low_stock', label: 'Sắp hết hàng' },
    { value: 'out_of_stock', label: 'Hết hàng' },
];

export const PRODUCT_PC_CONFIGURATION_ROWS = [
    [
        { key: 'cpu', label: 'CPU' },
        { key: 'motherboard', label: 'Mainboard' },
    ],
    [
        { key: 'ram', label: 'RAM' },
        { key: 'storage', label: 'Ổ cứng' },
    ],
    [
        { key: 'gpu', label: 'Card đồ họa' },
        { key: 'power', label: 'Nguồn' },
    ],
    [
        { key: 'computerCase', label: 'Case' },
        { key: 'cooler', label: 'Tản nhiệt' },
    ],
];

export const PRODUCT_EDITOR_INIT = {
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar:
        'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
    content_style:
        "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.4; margin: 1rem; } table { border-collapse: collapse; }",
};
