const COMPONENT_TYPE_DEFINITIONS = Object.freeze([
    { code: 'cpu', name: 'CPU', isBuildPcAllowed: true },
    { code: 'mainboard', name: 'Bo mạch chủ', isBuildPcAllowed: true },
    { code: 'ram', name: 'RAM', isBuildPcAllowed: true },
    { code: 'ssd', name: 'SSD', isBuildPcAllowed: true },
    { code: 'hdd', name: 'Ổ cứng HDD', isBuildPcAllowed: true },
    { code: 'vga', name: 'Card đồ họa', isBuildPcAllowed: true },
    { code: 'power', name: 'Nguồn máy tính', isBuildPcAllowed: true },
    { code: 'case', name: 'Vỏ case', isBuildPcAllowed: true },
    { code: 'cooler', name: 'Tản nhiệt', isBuildPcAllowed: true },
    { code: 'monitor', name: 'Màn hình', isBuildPcAllowed: true },
    { code: 'keyboard', name: 'Bàn phím', isBuildPcAllowed: true },
    { code: 'mouse', name: 'Chuột', isBuildPcAllowed: true },
    { code: 'headset', name: 'Tai nghe', isBuildPcAllowed: true },
    { code: 'pc', name: 'PC nguyên bộ', isBuildPcAllowed: false },
]);

const COMPONENT_TYPES = Object.freeze(COMPONENT_TYPE_DEFINITIONS.map((definition) => definition.code));

const PRODUCT_COMPONENT_TYPES = COMPONENT_TYPES;

const BUILD_PC_COMPONENT_TYPES = Object.freeze(
    COMPONENT_TYPE_DEFINITIONS
        .filter((definition) => definition.isBuildPcAllowed)
        .map((definition) => definition.code),
);

function normalizeComponentType(componentType) {
    if (!componentType || typeof componentType !== 'string') {
        return componentType;
    }

    return componentType.trim().toLowerCase();
}

function getComponentTypeQueryValues(componentType) {
    const normalized = normalizeComponentType(componentType);
    if (!normalized) {
        return [];
    }

    return [normalized];
}

function isBuildPcComponentType(componentType) {
    const normalized = normalizeComponentType(componentType);
    return BUILD_PC_COMPONENT_TYPES.includes(normalized);
}

module.exports = {
    COMPONENT_TYPE_DEFINITIONS,
    COMPONENT_TYPES,
    PRODUCT_COMPONENT_TYPES,
    BUILD_PC_COMPONENT_TYPES,
    normalizeComponentType,
    getComponentTypeQueryValues,
    isBuildPcComponentType,
};
