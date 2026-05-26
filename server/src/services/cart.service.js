const { Op } = require('sequelize');

const { connect } = require('../config/index');
const { BadRequestError } = require('../core/error.response');
const modelBuildPcCart = require('../models/buildPcCart.model');
const modelCart = require('../models/cart.model');
const modelProduct = require('../models/products.model');
const { getProductAvailabilityBaseInclude } = require('../utils/productQuery');
const { getPlainProductWithPcConfiguration } = require('../utils/pcConfiguration');
const buildPcCartService = require('./buildPcCart.service');
const { getDiscountedPrice } = require('../utils/pricing');
const { ensureProductIsSellable, isProductSellable } = require('../utils/productVisibility');

function normalizeQuantity(quantity) {
    const quantityNumber = Number(quantity);

    if (!quantityNumber || quantityNumber < 1) {
        throw new BadRequestError('Số lượng phải lớn hơn 0');
    }

    return quantityNumber;
}

async function getProductOrThrow(productId) {
    const product = await modelProduct.findOne({
        where: { id: productId },
        include: getProductAvailabilityBaseInclude(),
    });
    ensureProductIsSellable(product);

    return product;
}

function ensureAvailableStock(product, quantity) {
    if (product.stock < quantity) {
        throw new BadRequestError('Số lượng trong kho không đủ');
    }
}

async function upsertCartItem(userId, productId, quantity, transaction) {
    const quantityNumber = normalizeQuantity(quantity);
    const [existingCartItem, product] = await Promise.all([
        modelCart.findOne({ where: { userId, productId }, transaction }),
        getProductOrThrow(productId),
    ]);

    const newQuantity = existingCartItem ? existingCartItem.quantity + quantityNumber : quantityNumber;
    ensureAvailableStock(product, newQuantity);

    const totalPrice = getDiscountedPrice(product) * newQuantity;

    if (existingCartItem) {
        await existingCartItem.update(
            {
                quantity: newQuantity,
                totalPrice,
            },
            { transaction },
        );

        return existingCartItem;
    }

    return modelCart.create(
        {
            userId,
            productId,
            quantity: quantityNumber,
            totalPrice,
        },
        { transaction },
    );
}

function formatCartItem(item) {
    const product = item.product ? getPlainProductWithPcConfiguration(item.product) : null;
    if (!product || !isProductSellable(product)) {
        return null;
    }

    return {
        id: item.id,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        product: {
            ...product,
            price: getDiscountedPrice(product),
            isComponent: false,
        },
    };
}

async function addToCart(userId, { productId, quantity }) {
    if (!userId || !productId) {
        throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    return upsertCartItem(userId, productId, quantity);
}

async function getCart(userId) {
    const cartItems = await modelCart.findAll({
        where: { userId },
        order: [
            ['updatedAt', 'DESC'],
            ['createdAt', 'DESC'],
        ],
        include: [
            {
                model: modelProduct,
                include: getProductAvailabilityBaseInclude(),
            },
        ],
    });

    const formattedItems = cartItems.map((item) => ({
        source: item,
        formatted: formatCartItem(item),
    }));
    const invalidCartItemIds = formattedItems
        .filter((item) => !item.formatted)
        .map((item) => item.source.id);

    if (invalidCartItemIds.length > 0) {
        await modelCart.destroy({
            where: {
                id: { [Op.in]: invalidCartItemIds },
                userId,
            },
        });
    }

    return formattedItems.map((item) => item.formatted).filter(Boolean);
}

async function deleteCart(userId, cartId) {
    if (!userId || !cartId) {
        throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    const cartItem = await modelCart.findOne({ where: { id: cartId, userId } });
    if (!cartItem) {
        throw new BadRequestError('Không tìm thấy sản phẩm trong giỏ hàng');
    }

    await cartItem.destroy();
}

async function addToCartBuildPC(userId) {
    const buildPcItems = await modelBuildPcCart.findAll({
        where: { userId },
        order: [['createdAt', 'ASC']],
        include: [
            {
                model: modelProduct,
                include: getProductAvailabilityBaseInclude(),
            },
        ],
    });

    if (!buildPcItems.length) {
        return;
    }

    const unavailableBuildPcItem = buildPcItems.find((item) => !item.product || !isProductSellable(item.product));
    if (unavailableBuildPcItem) {
        throw new BadRequestError(
            unavailableBuildPcItem.product?.name
                ? `Sản phẩm "${unavailableBuildPcItem.product.name}" hiện không thể thêm vào giỏ hàng.`
                : 'Có sản phẩm trong cấu hình PC hiện không còn khả dụng để thêm vào giỏ hàng.',
        );
    }

    const productIds = [...new Set(buildPcItems.map((item) => item.productId))];
    const existingCartItems = await modelCart.findAll({
        where: {
            userId,
            productId: { [Op.in]: productIds },
        },
    });

    const existingCartMap = new Map(existingCartItems.map((item) => [item.productId, item]));

    buildPcItems.forEach((item) => {
        const product = item.product;
        const existingCartItem = existingCartMap.get(item.productId);
        const newQuantity = (existingCartItem?.quantity || 0) + item.quantity;
        if (product.stock < newQuantity) {
            throw new BadRequestError(`Sản phẩm "${product.name}" không đủ tồn kho`);
        }
    });

    await connect.transaction(async (transaction) => {
        for (const item of buildPcItems) {
            const product = item.product;
            const existingCartItem = existingCartMap.get(item.productId);
            const nextQuantity = (existingCartItem?.quantity || 0) + item.quantity;
            const totalPrice = getDiscountedPrice(product) * nextQuantity;

            if (existingCartItem) {
                await existingCartItem.update(
                    {
                        quantity: nextQuantity,
                        totalPrice,
                    },
                    { transaction },
                );
                continue;
            }

            const createdCartItem = await modelCart.create(
                {
                    userId,
                    productId: item.productId,
                    quantity: item.quantity,
                    totalPrice: getDiscountedPrice(product) * item.quantity,
                },
                { transaction },
            );

            existingCartMap.set(item.productId, createdCartItem);
        }

        await modelBuildPcCart.destroy({
            where: { userId },
            transaction,
        });
    });
}

async function deleteAllCartBuildPC(userId) {
    await modelBuildPcCart.destroy({ where: { userId } });
}

async function updateQuantity(userId, cartItemId, quantity) {
    const quantityNumber = normalizeQuantity(quantity);
    const cartItem = await modelCart.findOne({ where: { id: cartItemId, userId } });

    if (!cartItem) {
        throw new BadRequestError('Không tìm thấy sản phẩm trong giỏ hàng');
    }

    const product = await getProductOrThrow(cartItem.productId);
    ensureAvailableStock(product, quantityNumber);

    await cartItem.update({
        quantity: quantityNumber,
        totalPrice: getDiscountedPrice(product) * quantityNumber,
    });

    return cartItem;
}

async function getCartBuildPc(userId) {
    return buildPcCartService.getBuildPcCart(userId);
}

/**
 * Upsert cart item khi merge giỏ guest: clamp số lượng về stock thay vì throw lỗi.
 * Trả về { cartItem, clampedQuantity } nếu bị giảm, hoặc null nếu hết hàng.
 */
async function upsertCartItemForMerge(userId, productId, quantity, transaction) {
    const quantityNumber = normalizeQuantity(quantity);
    const [existingCartItem, product] = await Promise.all([
        modelCart.findOne({ where: { userId, productId }, transaction }),
        getProductOrThrow(productId),
    ]);

    const desiredQuantity = existingCartItem ? existingCartItem.quantity + quantityNumber : quantityNumber;
    // Clamp về tồn kho thực tế thay vì throw lỗi
    const actualQuantity = Math.min(desiredQuantity, product.stock);

    if (actualQuantity < 1) {
        // Hết hàng hoàn toàn, bỏ qua
        return { cartItem: null, wasAdjusted: true, productName: product.name, requestedQuantity: desiredQuantity, actualQuantity: 0 };
    }

    const totalPrice = getDiscountedPrice(product) * actualQuantity;
    const wasAdjusted = actualQuantity < desiredQuantity;

    if (existingCartItem) {
        await existingCartItem.update(
            {
                quantity: actualQuantity,
                totalPrice,
            },
            { transaction },
        );
        return { cartItem: existingCartItem, wasAdjusted, productName: product.name, requestedQuantity: desiredQuantity, actualQuantity };
    }

    const cartItem = await modelCart.create(
        {
            userId,
            productId,
            quantity: actualQuantity,
            totalPrice,
        },
        { transaction },
    );
    return { cartItem, wasAdjusted, productName: product.name, requestedQuantity: desiredQuantity, actualQuantity };
}

async function mergeGuestCart(userId, items = [], transaction) {
    if (!Array.isArray(items) || !items.length) {
        return { mergedCount: 0, adjustedItems: [] };
    }

    let mergedCount = 0;
    const adjustedItems = [];

    for (const item of items) {
        const productId = item?.productId;
        const quantity = Number(item?.quantity) || 0;

        if (!productId || quantity < 1) {
            continue;
        }

        try {
            const result = await upsertCartItemForMerge(userId, productId, quantity, transaction);
            if (result.cartItem) {
                mergedCount += 1;
            }
            if (result.wasAdjusted) {
                adjustedItems.push({
                    productName: result.productName,
                    requestedQuantity: result.requestedQuantity,
                    actualQuantity: result.actualQuantity,
                });
            }
        } catch (error) {
            // Sản phẩm không còn tồn tại hoặc không còn bán, bỏ qua
            console.warn(`mergeGuestCart: skipping productId=${productId}`, error?.message);
        }
    }

    return { mergedCount, adjustedItems };
}

module.exports = {
    addToCart,
    addToCartBuildPC,
    deleteAllCartBuildPC,
    deleteCart,
    getCart,
    getCartBuildPc,
    mergeGuestCart,
    updateQuantity,
};
