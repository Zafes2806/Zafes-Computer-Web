export const COMPONENT_TYPE_DEFINITIONS = [
    {
        value: 'cpu',
        label: 'CPU',
        buildPcLabel: 'CPU',
        buttonText: 'Chọn CPU',
        description: 'Lọc theo hãng, socket, số nhân và số luồng.',
        isBuildPcAllowed: true,
    },
    {
        value: 'mainboard',
        label: 'Bo mạch chủ',
        buildPcLabel: 'Mainboard',
        buttonText: 'Chọn Mainboard',
        description: 'Lọc theo socket, chipset và kích thước bo mạch.',
        isBuildPcAllowed: true,
    },
    {
        value: 'ram',
        label: 'RAM',
        buildPcLabel: 'RAM',
        buttonText: 'Chọn RAM',
        description: 'Lọc theo loại RAM, dung lượng và bus.',
        isBuildPcAllowed: true,
    },
    {
        value: 'ssd',
        label: 'SSD',
        buildPcLabel: 'SSD',
        buttonText: 'Chọn SSD',
        description: 'Lọc theo dung lượng và giao tiếp SSD.',
        isBuildPcAllowed: true,
    },
    {
        value: 'hdd',
        label: 'Ổ cứng HDD',
        buildPcLabel: 'HDD',
        buttonText: 'Chọn HDD',
        description: 'Lọc theo dung lượng và hãng sản xuất.',
        isBuildPcAllowed: true,
    },
    {
        value: 'vga',
        label: 'Card đồ họa',
        buildPcLabel: 'VGA',
        buttonText: 'Chọn VGA',
        description: 'Lọc theo hãng, dòng chip và dung lượng VRAM.',
        isBuildPcAllowed: true,
    },
    {
        value: 'power',
        label: 'Nguồn máy tính',
        buildPcLabel: 'Nguồn',
        buttonText: 'Chọn Nguồn',
        description: 'Lọc theo công suất và chuẩn 80 Plus.',
        isBuildPcAllowed: true,
    },
    {
        value: 'case',
        label: 'Vỏ case',
        buildPcLabel: 'Vỏ Case',
        buttonText: 'Chọn Vỏ Case',
        description: 'Lọc theo kích thước và dòng sản phẩm.',
        isBuildPcAllowed: true,
    },
    {
        value: 'cooler',
        label: 'Tản nhiệt',
        buildPcLabel: 'Tản nhiệt',
        buttonText: 'Chọn Tản nhiệt',
        description: 'Lọc theo loại tản nhiệt và thương hiệu.',
        isBuildPcAllowed: true,
    },
    {
        value: 'monitor',
        label: 'Màn hình',
        buildPcLabel: 'Màn Hình',
        buttonText: 'Chọn Màn Hình',
        description: 'Lọc theo kích thước và tần số quét.',
        isBuildPcAllowed: true,
    },
    {
        value: 'keyboard',
        label: 'Bàn phím',
        buildPcLabel: 'Bàn Phím',
        buttonText: 'Chọn Bàn Phím',
        description: 'Lọc theo switch và thương hiệu.',
        isBuildPcAllowed: true,
    },
    {
        value: 'mouse',
        label: 'Chuột',
        buildPcLabel: 'Chuột',
        buttonText: 'Chọn Chuột',
        description: 'Lọc theo form và DPI.',
        isBuildPcAllowed: true,
    },
    {
        value: 'headset',
        label: 'Tai nghe',
        buildPcLabel: 'Tai Nghe',
        buttonText: 'Chọn Tai Nghe',
        description: 'Lọc theo kiểu kết nối và thương hiệu.',
        isBuildPcAllowed: true,
    },
    {
        value: 'pc',
        label: 'PC nguyên bộ',
        buildPcLabel: 'PC nguyên bộ',
        buttonText: 'Chọn PC',
        description: 'PC nguyên bộ cấu hình sẵn.',
        isBuildPcAllowed: false,
    },
];

export const COMPONENT_TYPE_LABELS = COMPONENT_TYPE_DEFINITIONS.reduce((labels, item) => {
    labels[item.value] = item.label;
    return labels;
}, {});

export const PRODUCT_COMPONENT_TYPE_OPTIONS = COMPONENT_TYPE_DEFINITIONS.map(({ value, label }) => ({ value, label }));

export const BUILD_PC_COMPONENT_TYPE_OPTIONS = COMPONENT_TYPE_DEFINITIONS.filter((item) => item.isBuildPcAllowed);

export const COMPONENT_TYPE_OPTIONS = BUILD_PC_COMPONENT_TYPE_OPTIONS.map(({ value, label, description }) => ({
    value,
    label,
    description,
}));

export const COMPONENT_TYPE_ORDER = COMPONENT_TYPE_DEFINITIONS.map((item) => item.value);

export function normalizeComponentTypeItem(item = {}) {
    const value = item.value || item.code;
    const label = item.label || item.name || value;
    const fallback = COMPONENT_TYPE_DEFINITIONS.find((definition) => definition.value === value) || {};

    return {
        ...fallback,
        ...item,
        value,
        code: value,
        label,
        name: item.name || label,
        buildPcLabel: item.buildPcLabel || fallback.buildPcLabel || label,
        buttonText: item.buttonText || fallback.buttonText || `Chọn ${label}`,
        description: item.description || fallback.description || '',
        isProductType: item.isProductType !== false,
        isBuildPcAllowed: Boolean(item.isBuildPcAllowed),
    };
}

export function normalizeComponentTypeList(items = [], { buildPcOnly = false, productOnly = false } = {}) {
    const normalized = (Array.isArray(items) && items.length ? items : COMPONENT_TYPE_DEFINITIONS)
        .map(normalizeComponentTypeItem)
        .filter((item) => (buildPcOnly ? item.isBuildPcAllowed : true))
        .filter((item) => (productOnly ? item.isProductType !== false : true));

    return normalized.sort((a, b) => {
        const orderA = COMPONENT_TYPE_ORDER.indexOf(a.value);
        const orderB = COMPONENT_TYPE_ORDER.indexOf(b.value);
        const resolvedA = orderA === -1 ? COMPONENT_TYPE_ORDER.length : orderA;
        const resolvedB = orderB === -1 ? COMPONENT_TYPE_ORDER.length : orderB;
        if (resolvedA !== resolvedB) return resolvedA - resolvedB;
        return String(a.label).localeCompare(String(b.label), 'vi');
    });
}

export function getBaseComponentType(type = '') {
    return type.includes(':') ? type.split(':')[0] : type;
}

export function isKnownComponentType(type = '') {
    return COMPONENT_TYPE_ORDER.includes(getBaseComponentType(type));
}

export function getComponentTypeMeta(type = '') {
    return COMPONENT_TYPE_OPTIONS.find((item) => item.value === getBaseComponentType(type));
}
