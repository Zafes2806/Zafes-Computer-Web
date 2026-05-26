const ComponentType = require('../models/componentType.model');
const { normalizeComponentType } = require('../constants/componentTypes');

function createComponentTypeValidator({
    allowPc = true,
    requireBuildPcAllowed = false,
    requireProductType = true,
    requireActive = true,
} = {}) {
    return async (value) => {
        const code = normalizeComponentType(value);
        if (!code) {
            throw new Error('Loại linh kiện không hợp lệ');
        }
        if (!allowPc && code === 'pc') {
            throw new Error('Loại sản phẩm không hợp lệ');
        }

        const componentType = await ComponentType.findByPk(code);
        if (!componentType) {
            throw new Error('Loại linh kiện không hợp lệ');
        }
        if (requireActive && componentType.status !== 'active') {
            throw new Error('Loại linh kiện đang tạm khóa');
        }
        if (requireProductType && !componentType.isProductType) {
            throw new Error('Loại linh kiện không được dùng cho sản phẩm');
        }
        if (requireBuildPcAllowed && !componentType.isBuildPcAllowed) {
            throw new Error('Loại linh kiện không được dùng cho Build PC');
        }

        return true;
    };
}

module.exports = {
    createComponentTypeValidator,
};
