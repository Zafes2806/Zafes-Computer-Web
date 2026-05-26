const { connect } = require('../config/index');
const { Op } = require('sequelize');

const { BadRequestError } = require('../core/error.response');
const ComponentType = require('../models/componentType.model');
const Product = require('../models/products.model');
const SpecDefinition = require('../models/specDefinition.model');
const BuildPcCart = require('../models/buildPcCart.model');
const { buildPaginationMeta } = require('../utils/pagination');
const { normalizeComponentType } = require('../constants/componentTypes');
const {
    COMPONENT_TYPE_STATUS,
    normalizeComponentTypeStatus,
} = require('../constants/componentTypeStatus');

const DEFAULT_COMPONENT_TYPE_ORDER = [
    'cpu',
    'mainboard',
    'ram',
    'ssd',
    'hdd',
    'vga',
    'power',
    'case',
    'cooler',
    'monitor',
    'keyboard',
    'mouse',
    'headset',
    'pc',
];

function getOrderIndex(code) {
    const index = DEFAULT_COMPONENT_TYPE_ORDER.indexOf(code);
    return index === -1 ? DEFAULT_COMPONENT_TYPE_ORDER.length : index;
}

function sortComponentTypes(items = []) {
    return [...items].sort((a, b) => {
        const orderDiff = getOrderIndex(a.code) - getOrderIndex(b.code);
        if (orderDiff !== 0) return orderDiff;
        return String(a.name).localeCompare(String(b.name), 'vi');
    });
}

function toComponentTypeResponse(componentType) {
    if (!componentType) return componentType;
    const raw = typeof componentType.toJSON === 'function' ? componentType.toJSON() : componentType;
    return {
        code: normalizeComponentType(raw.code),
        name: raw.name,
        isProductType: Boolean(raw.isProductType),
        isBuildPcAllowed: Boolean(raw.isBuildPcAllowed),
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt || null,
    };
}

function buildListScope(query = {}, adminScope = false) {
    const includeDeleted = adminScope && (query.includeDeleted === true || query.includeDeleted === 'true');
    const status = adminScope ? query.status || COMPONENT_TYPE_STATUS.ACTIVE : COMPONENT_TYPE_STATUS.ACTIVE;
    const search = query.search?.trim();
    const where = {};

    if (query.buildPcOnly === true || query.buildPcOnly === 'true') {
        where.isBuildPcAllowed = true;
    }

    if (query.productOnly === true || query.productOnly === 'true') {
        where.isProductType = true;
    }

    if (search) {
        where[Op.or] = [
            { code: { [Op.like]: `%${search}%` } },
            { name: { [Op.like]: `%${search}%` } },
        ];
    }

    if (status === 'deleted') {
        where.deletedAt = { [Op.ne]: null };
    } else if (status === 'all') {
        if (!includeDeleted) where.deletedAt = null;
    } else {
        where.deletedAt = null;
        where.status = normalizeComponentTypeStatus(status);
    }

    return {
        where,
        paranoid: !(includeDeleted || status === 'deleted'),
    };
}

async function getAll(query = {}, pagination = null, { adminScope = false } = {}) {
    const scope = buildListScope(query, adminScope);
    const queryOptions = {
        ...scope,
        order: [['name', 'ASC'], ['code', 'ASC']],
    };

    if (!pagination) {
        const rows = await ComponentType.findAll(queryOptions);
        return {
            items: sortComponentTypes(rows.map(toComponentTypeResponse)),
            pagination: null,
        };
    }

    const { count, rows } = await ComponentType.findAndCountAll({
        ...queryOptions,
        limit: pagination.limit,
        offset: pagination.offset,
    });

    return {
        items: sortComponentTypes(rows.map(toComponentTypeResponse)),
        pagination: buildPaginationMeta(count, pagination),
    };
}

function normalizePayload(payload = {}) {
    const code = normalizeComponentType(payload.code);
    const name = payload.name?.trim();
    if (!code || !/^[a-z0-9_-]{2,50}$/.test(code)) {
        throw new BadRequestError('Mã loại linh kiện không hợp lệ');
    }
    if (!name) {
        throw new BadRequestError('Tên loại linh kiện không được để trống');
    }

    return {
        code,
        name,
        isProductType: true,
        isBuildPcAllowed: payload.isBuildPcAllowed !== false,
        status: normalizeComponentTypeStatus(payload.status),
    };
}

async function create(payload) {
    const data = normalizePayload(payload);
    const existing = await ComponentType.findByPk(data.code, { paranoid: false });
    if (existing) {
        throw new BadRequestError(`Loại linh kiện "${data.code}" đã tồn tại`);
    }

    const componentType = await ComponentType.create(data);
    return toComponentTypeResponse(componentType);
}

async function update(code, payload) {
    const componentType = await ComponentType.findByPk(normalizeComponentType(code));
    if (!componentType) {
        throw new BadRequestError('Không tìm thấy loại linh kiện');
    }

    const updateData = {};
    if (payload.name !== undefined) {
        updateData.name = payload.name?.trim();
        if (!updateData.name) throw new BadRequestError('Tên loại linh kiện không được để trống');
    }
    if (payload.isBuildPcAllowed !== undefined) updateData.isBuildPcAllowed = Boolean(payload.isBuildPcAllowed);
    if (payload.status !== undefined) updateData.status = normalizeComponentTypeStatus(payload.status);

    await componentType.update(updateData);
    return toComponentTypeResponse(componentType);
}

async function updateStatus(code, status) {
    const componentType = await ComponentType.findByPk(normalizeComponentType(code));
    if (!componentType) {
        throw new BadRequestError('Không tìm thấy loại linh kiện');
    }

    const nextStatus = normalizeComponentTypeStatus(status);
    if (componentType.status === nextStatus) {
        return { changed: false, componentType: toComponentTypeResponse(componentType) };
    }

    await componentType.update({ status: nextStatus });
    return { changed: true, componentType: toComponentTypeResponse(componentType) };
}

async function deleteComponentType(code) {
    const componentType = await ComponentType.findByPk(normalizeComponentType(code));
    if (!componentType) {
        throw new BadRequestError('Không tìm thấy loại linh kiện');
    }

    await connect.transaction(async (transaction) => {
        if (componentType.status !== COMPONENT_TYPE_STATUS.INACTIVE) {
            await componentType.update({ status: COMPONENT_TYPE_STATUS.INACTIVE }, { transaction });
        }

        await componentType.destroy({ transaction });
    });
}

async function restore(code) {
    const componentType = await ComponentType.findByPk(normalizeComponentType(code), { paranoid: false });
    if (!componentType) {
        throw new BadRequestError('Không tìm thấy loại linh kiện');
    }

    if (!componentType.deletedAt) {
        return { restored: false, componentType: toComponentTypeResponse(componentType) };
    }

    await componentType.restore();
    await componentType.update({ status: COMPONENT_TYPE_STATUS.INACTIVE });
    return { restored: true, componentType: toComponentTypeResponse(componentType) };
}

async function getUsageCounts(code) {
    const normalizedCode = normalizeComponentType(code);
    const [products, specDefinitions, buildPcCartItems] = await Promise.all([
        Product.count({ where: { componentType: normalizedCode }, paranoid: false }),
        SpecDefinition.count({ where: { componentType: normalizedCode }, paranoid: false }),
        BuildPcCart.count({ where: { componentType: normalizedCode } }),
    ]);
    return { products, specDefinitions, buildPcCartItems };
}

async function permanentlyDelete(code) {
    const componentType = await ComponentType.findByPk(normalizeComponentType(code), { paranoid: false });
    if (!componentType) {
        throw new BadRequestError('Không tìm thấy loại linh kiện');
    }
    if (!componentType.deletedAt) {
        throw new BadRequestError('Chỉ có thể xóa vĩnh viễn loại linh kiện đang ở trong thùng rác');
    }

    const usage = await getUsageCounts(componentType.code);
    if (usage.products || usage.specDefinitions || usage.buildPcCartItems) {
        throw new BadRequestError('Không thể xóa vĩnh viễn loại linh kiện đang được sử dụng');
    }

    await componentType.destroy({ force: true });
}

module.exports = {
    create,
    deleteComponentType,
    getAll,
    getUsageCounts,
    permanentlyDelete,
    restore,
    toComponentTypeResponse,
    update,
    updateStatus,
};
