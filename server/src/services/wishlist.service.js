const { Op } = require('sequelize');
const modelUserWatchProduct = require('../models/userWatchProduct.model');
const modelProducts = require('../models/products.model');
const { PRODUCT_STATUS } = require('../constants/productStatus');
const { getProductBaseInclude } = require('../utils/productQuery');
const { getPlainProductsWithPcConfiguration } = require('../utils/pcConfiguration');

const MAX_RECENT_VIEWED_PRODUCTS = 24;
const RECENT_VIEWED_PRODUCT_TTL_DAYS = 60;

function getExpiredViewedProductCutoff() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENT_VIEWED_PRODUCT_TTL_DAYS);
    return cutoff;
}

async function deleteExpiredProductWatches(userId) {
    await modelUserWatchProduct.destroy({
        where: {
            userId,
            updatedAt: {
                [Op.lt]: getExpiredViewedProductCutoff(),
            },
        },
    });
}

async function deleteDuplicateProductWatches(userId) {
    const watchItems = await modelUserWatchProduct.findAll({
        where: { userId },
        attributes: ['id', 'productId'],
        order: [
            ['updatedAt', 'DESC'],
            ['createdAt', 'DESC'],
        ],
    });
    const seenProductIds = new Set();
    const duplicateIds = [];

    watchItems.forEach((item) => {
        if (seenProductIds.has(item.productId)) {
            duplicateIds.push(item.id);
            return;
        }

        seenProductIds.add(item.productId);
    });

    if (duplicateIds.length === 0) {
        return;
    }

    await modelUserWatchProduct.destroy({
        where: {
            id: {
                [Op.in]: duplicateIds,
            },
        },
    });
}

async function limitProductWatches(userId) {
    const watchItems = await modelUserWatchProduct.findAll({
        where: { userId },
        attributes: ['id'],
        order: [
            ['updatedAt', 'DESC'],
            ['createdAt', 'DESC'],
        ],
    });
    const overflowIds = watchItems.slice(MAX_RECENT_VIEWED_PRODUCTS).map((item) => item.id);

    if (overflowIds.length === 0) {
        return;
    }

    await modelUserWatchProduct.destroy({
        where: {
            id: {
                [Op.in]: overflowIds,
            },
        },
    });
}

async function createProductWatch(userId, productId) {
    await deleteExpiredProductWatches(userId);

    const existingWatchItems = await modelUserWatchProduct.findAll({
        where: { userId, productId },
        order: [
            ['updatedAt', 'DESC'],
            ['createdAt', 'DESC'],
        ],
    });

    let watchItem;

    if (existingWatchItems.length > 0) {
        [watchItem] = existingWatchItems;
        await watchItem.update({ updatedAt: new Date() });

        const duplicateIds = existingWatchItems.slice(1).map((item) => item.id);
        if (duplicateIds.length > 0) {
            await modelUserWatchProduct.destroy({
                where: {
                    id: {
                        [Op.in]: duplicateIds,
                    },
                },
            });
        }
    } else {
        watchItem = await modelUserWatchProduct.create({ userId, productId });
    }

    await deleteDuplicateProductWatches(userId);
    await limitProductWatches(userId);
    return watchItem;
}

async function getProductWatch(userId) {
    await deleteExpiredProductWatches(userId);
    await deleteDuplicateProductWatches(userId);
    await limitProductWatches(userId);

    const products = await modelUserWatchProduct.findAll({
        where: { userId },
        include: [{ model: modelProducts, include: getProductBaseInclude() }],
        order: [
            ['updatedAt', 'DESC'],
            ['createdAt', 'DESC'],
        ],
        limit: MAX_RECENT_VIEWED_PRODUCTS,
    });
    const uniqueProductIds = new Set();
    const data = products
        .map((item) => item.product)
        .filter((product) => {
            if (!product || (product.status !== PRODUCT_STATUS.ACTIVE && product.status != null)) {
                return false;
            }

            if (uniqueProductIds.has(product.id)) {
                return false;
            }

            uniqueProductIds.add(product.id);
            return true;
        });
    return getPlainProductsWithPcConfiguration(data);
}

module.exports = {
    createProductWatch,
    getProductWatch,
};
