const { getPlainProductWithPcConfiguration } = require('./pcConfiguration');

function normalizeSnapshotSpecs(specs = []) {
    if (!Array.isArray(specs)) {
        return [];
    }

    return specs
        .filter((item) => item?.specKey && item?.specValue)
        .map((item) => ({
            specKey: item.specKey,
            specValue: item.specValue,
        }));
}

function parseOrderItemProductSnapshot(snapshot) {
    if (!snapshot) {
        return null;
    }

    if (typeof snapshot === 'string') {
        try {
            return JSON.parse(snapshot);
        } catch (error) {
            return null;
        }
    }

    return typeof snapshot === 'object' ? snapshot : null;
}

function buildOrderItemProductSnapshot(product, { unitPrice } = {}) {
    const plainProduct = getPlainProductWithPcConfiguration(product);

    return {
        snapshotVersion: 1,
        id: plainProduct.id,
        name: plainProduct.name,
        price: Number(plainProduct.price) || 0,
        discount: Number(plainProduct.discount) || 0,
        unitPrice: Number(unitPrice) || 0,
        images: plainProduct.images,
        description: plainProduct.description || '',
        categoryId: plainProduct.categoryId || null,
        categoryName: plainProduct.category?.name || null,
        categoryStatus: plainProduct.category?.status || null,
        componentType: plainProduct.componentType || null,
        status: plainProduct.status || null,
        specs: normalizeSnapshotSpecs(plainProduct.specs),
        pcConfiguration: plainProduct.pcConfiguration || null,
    };
}

function getOrderItemProductDetails(item, { orderDate } = {}) {
    const snapshot = parseOrderItemProductSnapshot(item?.productSnapshot);
    const quantity = Number(item?.quantity) || 0;
    const unitPrice = Number(item?.unitPrice ?? snapshot?.unitPrice ?? 0) || 0;
    const originalPrice = snapshot?.price != null ? Number(snapshot.price) || 0 : unitPrice;
    const images = snapshot?.images || item?.productImages || item?.product?.images || '';

    return {
        id: snapshot?.id || item?.productId || item?.product?.id || null,
        name: snapshot?.name || item?.productName || item?.product?.name || 'Sản phẩm',
        image: images,
        images,
        unitPrice,
        price: unitPrice,
        originalPrice,
        discount: Number(item?.discount ?? snapshot?.discount ?? 0) || 0,
        quantity,
        lineTotal: Number(item?.lineTotal ?? unitPrice * quantity) || 0,
        componentType: snapshot?.componentType || item?.product?.componentType || null,
        categoryId: snapshot?.categoryId ?? item?.product?.categoryId ?? null,
        categoryName: snapshot?.categoryName || null,
        description: snapshot?.description || '',
        specs: normalizeSnapshotSpecs(snapshot?.specs),
        pcConfiguration: snapshot?.pcConfiguration || null,
        status: snapshot?.status || null,
        detailSource: snapshot ? 'order_snapshot' : 'legacy_order_item',
        snapshotTakenAt: orderDate || null,
    };
}

module.exports = {
    buildOrderItemProductSnapshot,
    getOrderItemProductDetails,
    parseOrderItemProductSnapshot,
};

