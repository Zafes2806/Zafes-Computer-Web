function parsePaginationQuery(query = {}, { defaultLimit = 20, maxLimit = 100, alwaysPaginate = false } = {}) {
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    if (!hasPagination && !alwaysPaginate) {
        return null;
    }

    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));

    return {
        page,
        limit,
        offset: (page - 1) * limit,
    };
}

function buildPaginationMeta(totalItems, pagination) {
    if (!pagination) {
        return null;
    }

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pagination.limit);

    return {
        totalItems,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
        hasPreviousPage: pagination.page > 1,
        hasNextPage: pagination.page < totalPages,
    };
}

function paginateArray(items, pagination) {
    if (!pagination) {
        return {
            items,
            pagination: null,
        };
    }

    return {
        items: items.slice(pagination.offset, pagination.offset + pagination.limit),
        pagination: buildPaginationMeta(items.length, pagination),
    };
}

module.exports = {
    parsePaginationQuery,
    buildPaginationMeta,
    paginateArray,
};
