const { Op } = require('sequelize');
const { BadRequestError } = require('../core/error.response');
const modelProducts = require('../models/products.model');
const modelBuildPcCart = require('../models/buildPcCart.model');
const ComponentType = require('../models/componentType.model');
const { getDiscountedPrice } = require('../utils/pricing');
const { normalizeComponentType } = require('../constants/componentTypes');
const { getProductAvailabilityBaseInclude } = require('../utils/productQuery');
const { getPlainProductWithPcConfiguration } = require('../utils/pcConfiguration');
const { ensureProductIsSellable, isProductSellable } = require('../utils/productVisibility');
const { connect } = require('../config/index');

async function getBuildPcProductOrThrow(productId, transaction) {
    const product = await modelProducts.findOne({
        where: { id: productId },
        include: getProductAvailabilityBaseInclude(),
        transaction,
    });
    ensureProductIsSellable(product);

    const componentType = normalizeComponentType(product.componentType);
    const componentTypeMeta = await ComponentType.findByPk(componentType, { transaction });
    if (!componentTypeMeta || componentTypeMeta.status !== 'active' || !componentTypeMeta.isBuildPcAllowed) {
        throw new BadRequestError('Sản phẩm này không được phép thêm vào giỏ build PC');
    }

    return product;
}

async function buildPcCart(userId, { productId, quantity }) {
    const quantityNumber = Number(quantity) || 1;
    if (!userId || !productId || quantityNumber < 1) throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');

    await connect.transaction(async (transaction) => {
        const product = await getBuildPcProductOrThrow(productId, transaction);
        const componentType = normalizeComponentType(product.componentType);

        const existingCartItem = await modelBuildPcCart.findOne({
            where: { userId, productId },
            transaction,
        });
        const newQuantity = existingCartItem ? existingCartItem.quantity + quantityNumber : quantityNumber;
        if (product.stock < newQuantity) throw new BadRequestError('Số lượng trong kho không đủ');

        const unitPrice = getDiscountedPrice(product);
        if (existingCartItem) {
            await existingCartItem.update(
                { quantity: newQuantity, totalPrice: unitPrice * newQuantity, componentType },
                { transaction },
            );
            return;
        }

        await modelBuildPcCart.destroy({
            where: { userId, componentType },
            transaction,
        });

        await modelBuildPcCart.create({
            userId,
            productId,
            quantity: quantityNumber,
            totalPrice: unitPrice * quantityNumber,
            componentType,
        }, { transaction });
    });
}

async function getBuildPcCart(userId) {
    const buildPcCartItems = await modelBuildPcCart.findAll({
        where: { userId },
        include: [{ model: modelProducts, include: getProductAvailabilityBaseInclude() }],
    });

    const formattedItems = buildPcCartItems.map((item) => {
        const product = item.product ? getPlainProductWithPcConfiguration(item.product) : null;
        if (!product || !isProductSellable(product)) {
            return {
                source: item,
                formatted: null,
            };
        }

        return {
            source: item,
            formatted: {
                id: item.id,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                product,
                componentType: normalizeComponentType(item.componentType),
                images: product.images,
            },
        };
    });

    const invalidItemIds = formattedItems
        .filter((item) => !item.formatted)
        .map((item) => item.source.id);

    if (invalidItemIds.length > 0) {
        await modelBuildPcCart.destroy({
            where: {
                id: { [Op.in]: invalidItemIds },
                userId,
            },
        });
    }

    return formattedItems.map((item) => item.formatted).filter(Boolean);
}

async function updateQuantityCartBuildPc(userId, { productId, quantity }) {
    const quantityNumber = Number(quantity);
    if (!quantityNumber || quantityNumber < 1) throw new BadRequestError('Số lượng phải lớn hơn 0');

    const product = await getBuildPcProductOrThrow(productId);
    if (product.stock < quantityNumber) throw new BadRequestError('Số lượng trong kho không đủ');

    await modelBuildPcCart.update(
        { quantity: quantityNumber, totalPrice: quantityNumber * getDiscountedPrice(product) },
        { where: { userId, productId } },
    );
}

async function deleteCartBuildPc(userId, productId) {
    await modelBuildPcCart.destroy({ where: { userId, productId } });
}

async function mergeGuestBuildPcCart(userId, items = [], transaction) {
    if (!Array.isArray(items) || !items.length) {
        return { mergedCount: 0 };
    }

    let mergedCount = 0;

    for (const item of items) {
        const productId = item?.productId;
        const quantityNumber = Number(item?.quantity) || 0;
        if (!productId || quantityNumber < 1) {
            continue;
        }

        const product = await getBuildPcProductOrThrow(productId, transaction);
        const componentType = normalizeComponentType(product.componentType);

        if (product.stock < quantityNumber) {
            throw new BadRequestError(`Sản phẩm "${product.name}" không đủ tồn kho`);
        }

        await modelBuildPcCart.destroy({
            where: {
                userId,
                componentType,
            },
            transaction,
        });

        await modelBuildPcCart.create(
            {
                userId,
                productId,
                quantity: quantityNumber,
                totalPrice: getDiscountedPrice(product) * quantityNumber,
                componentType,
            },
            { transaction },
        );

        mergedCount += 1;
    }

    return { mergedCount };
}

module.exports = {
    buildPcCart,
    deleteCartBuildPc,
    getBuildPcCart,
    mergeGuestBuildPcCart,
    updateQuantityCartBuildPc,
};
