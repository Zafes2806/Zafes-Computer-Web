const { Op } = require('sequelize');

const { connect } = require('../config/index');
const { normalizeComponentType, getComponentTypeQueryValues } = require('../constants/componentTypes');
const {
    SPEC_DEFINITION_STATUS,
    normalizeSpecDefinitionStatus,
} = require('../constants/specDefinitionStatus');
const { BadRequestError } = require('../core/error.response');
const SpecDefinition = require('../models/specDefinition.model');
const { buildPaginationMeta } = require('../utils/pagination');

function toDefinitionResponse(definition) {
    if (!definition) {
        return definition;
    }

    const rawDefinition = typeof definition.toJSON === 'function' ? definition.toJSON() : definition;
    const { displayOrder, ...definitionWithoutSortOrder } = rawDefinition;
    return {
        ...definitionWithoutSortOrder,
        componentType: normalizeComponentType(definitionWithoutSortOrder.componentType),
    };
}

async function getNextDisplayOrder(componentType) {
    const maxDisplayOrder = await SpecDefinition.max('displayOrder', {
        where: { componentType },
        paranoid: false,
    });
    const numericMax = Number(maxDisplayOrder);

    return Number.isFinite(numericMax) && numericMax >= 0 ? numericMax + 1 : 1;
}

function normalizeReorderStatus(status) {
    const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : 'all';
    return normalizedStatus === 'all' ? 'all' : normalizeSpecDefinitionStatus(normalizedStatus);
}

function normalizeOptions(options) {
    if (options === undefined) {
        return undefined;
    }

    const normalizedOptions = Array.isArray(options)
        ? options
        : typeof options === 'string'
            ? (() => {
                try {
                    const parsed = JSON.parse(options);
                    return Array.isArray(parsed) ? parsed : null;
                } catch (error) {
                    return null;
                }
            })()
            : null;

    if (!normalizedOptions) {
        throw new BadRequestError('Danh sách giá trị không hợp lệ');
    }

    return [...new Set(
        normalizedOptions
            .map((option) => (typeof option === 'string' ? option.trim() : ''))
            .filter(Boolean),
    )];
}

function buildListScope(query = {}, adminScope = false) {
    const normalizedComponentType = normalizeComponentType(query.componentType);
    const includeDeleted = adminScope && (query.includeDeleted === true || query.includeDeleted === 'true');
    const status = adminScope ? query.status || SPEC_DEFINITION_STATUS.ACTIVE : SPEC_DEFINITION_STATUS.ACTIVE;
    const search = query.search?.trim();
    const where = {};

    if (normalizedComponentType) {
        const queryValues = getComponentTypeQueryValues(normalizedComponentType);
        where.componentType = queryValues.length === 1 ? queryValues[0] : { [Op.in]: queryValues };
    }

    if (search) {
        where[Op.or] = [
            { label: { [Op.like]: `%${search}%` } },
            { specKey: { [Op.like]: `%${search}%` } },
        ];
    }

    if (status === 'deleted') {
        where.deletedAt = { [Op.ne]: null };
    } else if (status === 'all') {
        if (!includeDeleted) {
            where.deletedAt = null;
        }
    } else {
        where.deletedAt = null;
        where.status = normalizeSpecDefinitionStatus(status);
    }

    return {
        where,
        paranoid: !(includeDeleted || status === 'deleted'),
    };
}

async function getAll(query = {}, pagination = null, { adminScope = false } = {}) {
    const listScope = buildListScope(query, adminScope);
    const queryOptions = {
        ...listScope,
        order: [
            ['componentType', 'ASC'],
            ['displayOrder', 'ASC'],
            ['id', 'ASC'],
        ],
    };

    if (!pagination) {
        const definitions = await SpecDefinition.findAll(queryOptions);
        return {
            items: definitions.map(toDefinitionResponse),
            pagination: null,
        };
    }

    const { count, rows } = await SpecDefinition.findAndCountAll({
        ...queryOptions,
        limit: pagination.limit,
        offset: pagination.offset,
    });

    return {
        items: rows.map(toDefinitionResponse),
        pagination: buildPaginationMeta(count, pagination),
    };
}

async function create(payload) {
    const normalizedComponentType = normalizeComponentType(payload.componentType);
    const specKey = payload.specKey?.trim();
    const label = payload.label?.trim();
    const options = normalizeOptions(payload.options) || [];

    if (!normalizedComponentType || !specKey || !label) {
        throw new BadRequestError('componentType, specKey và label là bắt buộc');
    }

    const existingDefinition = await SpecDefinition.findOne({
        where: {
            componentType: {
                [Op.in]: getComponentTypeQueryValues(normalizedComponentType),
            },
            specKey,
        },
        paranoid: false,
    });

    if (existingDefinition) {
        throw new BadRequestError(`Thuộc tính "${specKey}" đã tồn tại cho loại "${normalizedComponentType}"`);
    }

    const definition = await SpecDefinition.create({
        componentType: normalizedComponentType,
        specKey,
        label,
        options,
        displayOrder: await getNextDisplayOrder(normalizedComponentType),
        status: normalizeSpecDefinitionStatus(payload.status),
    });

    return toDefinitionResponse(definition);
}

async function update(id, payload) {
    const definition = await SpecDefinition.findByPk(id);
    if (!definition) {
        throw new BadRequestError('Không tìm thấy thuộc tính');
    }

    const updateData = {};
    if (payload.label !== undefined) {
        updateData.label = payload.label?.trim();
        if (!updateData.label) {
            throw new BadRequestError('Tên hiển thị không được để trống');
        }
    }
    if (payload.options !== undefined) {
        updateData.options = normalizeOptions(payload.options);
    }

    await definition.update(updateData);
    return toDefinitionResponse(definition);
}

async function reorder({ sourceId, targetId, status = 'all' }) {
    const reorderStatus = normalizeReorderStatus(status);

    return connect.transaction(async (transaction) => {
        const [source, target] = await Promise.all([
            SpecDefinition.findByPk(sourceId, { transaction, paranoid: false }),
            SpecDefinition.findByPk(targetId, { transaction, paranoid: false }),
        ]);

        if (!source || !target) {
            throw new BadRequestError('Không tìm thấy thuộc tính');
        }

        if (source.deletedAt || target.deletedAt) {
            throw new BadRequestError('Không thể sắp xếp thuộc tính trong thùng rác');
        }

        if (source.componentType !== target.componentType) {
            throw new BadRequestError('Chỉ có thể sắp xếp trong cùng loại linh kiện');
        }

        if (source.id === target.id) {
            return {
                changed: false,
                definitions: [toDefinitionResponse(source)],
            };
        }

        const where = {
            componentType: source.componentType,
            deletedAt: null,
        };
        if (reorderStatus !== 'all') {
            where.status = reorderStatus;
        }

        const definitions = await SpecDefinition.findAll({
            where,
            order: [
                ['displayOrder', 'ASC'],
                ['id', 'ASC'],
            ],
            transaction,
        });

        const orderedIds = definitions.map((definition) => definition.id);
        const sourceIndex = orderedIds.indexOf(source.id);
        const targetIndex = orderedIds.indexOf(target.id);

        if (sourceIndex < 0 || targetIndex < 0) {
            throw new BadRequestError('Không thể sắp xếp thuộc tính');
        }

        const nextOrderedIds = [...orderedIds];
        const [movedId] = nextOrderedIds.splice(sourceIndex, 1);
        const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        nextOrderedIds.splice(adjustedTargetIndex, 0, movedId);

        const definitionMap = new Map(definitions.map((definition) => [definition.id, definition]));
        let changed = false;

        for (let index = 0; index < nextOrderedIds.length; index += 1) {
            const definition = definitionMap.get(nextOrderedIds[index]);
            const nextDisplayOrder = index + 1;

            if (definition.displayOrder !== nextDisplayOrder) {
                changed = true;
                await definition.update({ displayOrder: nextDisplayOrder }, { transaction });
                definition.displayOrder = nextDisplayOrder;
            }
        }

        return {
            changed,
            definitions: nextOrderedIds.map((id) => toDefinitionResponse(definitionMap.get(id))),
        };
    });
}

async function updateStatus(id, status) {
    const definition = await SpecDefinition.findByPk(id);
    if (!definition) {
        throw new BadRequestError('Không tìm thấy thuộc tính');
    }

    const nextStatus = normalizeSpecDefinitionStatus(status);
    if (definition.status === nextStatus) {
        return { changed: false, definition: toDefinitionResponse(definition) };
    }

    await definition.update({ status: nextStatus });
    return { changed: true, definition: toDefinitionResponse(definition) };
}

async function deleteDefinition(id) {
    const definition = await SpecDefinition.findByPk(id);
    if (!definition) {
        throw new BadRequestError('Không tìm thấy thuộc tính');
    }

    await connect.transaction(async (transaction) => {
        if (definition.status !== SPEC_DEFINITION_STATUS.INACTIVE) {
            await definition.update({ status: SPEC_DEFINITION_STATUS.INACTIVE }, { transaction });
        }

        await definition.destroy({ transaction });
    });
}

async function restore(id) {
    const definition = await SpecDefinition.findByPk(id, { paranoid: false });
    if (!definition) {
        throw new BadRequestError('Không tìm thấy thuộc tính');
    }

    if (!definition.deletedAt) {
        return {
            restored: false,
            definition: toDefinitionResponse(definition),
        };
    }

    await definition.restore();
    await definition.update({ status: SPEC_DEFINITION_STATUS.INACTIVE });
    return {
        restored: true,
        definition: toDefinitionResponse(definition),
    };
}

async function permanentlyDelete(id) {
    const definition = await SpecDefinition.findByPk(id, { paranoid: false });
    if (!definition) {
        throw new BadRequestError('Không tìm thấy thuộc tính');
    }
    if (!definition.deletedAt) {
        throw new BadRequestError('Chỉ có thể xóa vĩnh viễn thuộc tính đang ở trong thùng rác');
    }

    await definition.destroy({ force: true });
}

module.exports = {
    create,
    deleteDefinition,
    getAll,
    permanentlyDelete,
    restore,
    toDefinitionResponse,
    update,
    updateStatus,
    reorder,
};

