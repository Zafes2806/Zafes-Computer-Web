const { Op } = require('sequelize');

const config = require('../config/env');
const { connect } = require('../config/index');
const { ORDER_REVIEWABLE_STATUSES } = require('../constants/orderStatus');
const {
    REVIEW_STATUS,
    canTransitionReviewStatus,
    getAvailableReviewStatuses,
    normalizeReviewStatus,
} = require('../constants/reviewStatus');
const { BadRequestError } = require('../core/error.response');
const modelOrder = require('../models/order.model');
const modelOrderItem = require('../models/orderItem.model');
const productReviewModel = require('../models/productReview.model');
const modelProduct = require('../models/products.model');
const modelUser = require('../models/users.model');
const { buildPaginationMeta } = require('../utils/pagination');

const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_WINDOW_MS = config.reviews.reviewWindowDays * DAY_MS;
const REVIEW_EDIT_WINDOW_MS = config.reviews.editWindowDays * DAY_MS;
const USER_REVIEW_ORDER_ATTRIBUTES = ['id', 'orderCode', 'createdAt', 'updatedAt', 'status', 'deliveredAt', 'completedAt'];

function parseDate(value) {
    const timestamp = value ? new Date(value).getTime() : NaN;
    return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

function getOrderReviewReferenceDate(order) {
    return parseDate(order?.completedAt) || parseDate(order?.deliveredAt) || parseDate(order?.updatedAt) || parseDate(order?.createdAt);
}

function getWindowExpiresAt(date, durationMs) {
    const referenceDate = parseDate(date);
    return referenceDate ? new Date(referenceDate.getTime() + durationMs) : null;
}

function isBeforeOrEqualNow(date) {
    const parsedDate = parseDate(date);
    return Boolean(parsedDate) && Date.now() <= parsedDate.getTime();
}

function getReviewWindowExpiresAt(order) {
    return getWindowExpiresAt(getOrderReviewReferenceDate(order), REVIEW_WINDOW_MS);
}

function isReviewWindowOpen(order) {
    if (!ORDER_REVIEWABLE_STATUSES.includes(order?.status)) {
        return false;
    }

    return isBeforeOrEqualNow(getReviewWindowExpiresAt(order));
}

function getReviewEditWindowExpiresAt(review) {
    return getWindowExpiresAt(review?.createdAt, REVIEW_EDIT_WINDOW_MS);
}

function isReviewEditWindowOpen(review) {
    return isBeforeOrEqualNow(getReviewEditWindowExpiresAt(review));
}

function getUserReviewInclude() {
    return [
        {
            model: modelOrder,
            as: 'order',
            attributes: USER_REVIEW_ORDER_ATTRIBUTES,
            required: false,
            paranoid: false,
        },
    ];
}

function formatUserReview(item) {
    const review = item.toJSON ? item.toJSON() : item;
    const order = review.order || null;
    const editWindowExpiresAt = getReviewEditWindowExpiresAt(review);
    const reviewWindowExpiresAt = order ? getReviewWindowExpiresAt(order) : null;

    return {
        ...review,
        canEdit: isReviewEditWindowOpen(review),
        editWindowExpiresAt: editWindowExpiresAt ? editWindowExpiresAt.toISOString() : null,
        order: order
            ? {
                ...order,
                canCreateReview: isReviewWindowOpen(order),
                reviewWindowExpiresAt: reviewWindowExpiresAt ? reviewWindowExpiresAt.toISOString() : null,
            }
            : null,
    };
}

async function findFormattedUserReview(userId, reviewId) {
    const review = await productReviewModel.findOne({
        where: { id: reviewId, userId, deletedAt: null },
        include: getUserReviewInclude(),
    });

    return review ? formatUserReview(review) : null;
}

function formatAdminReview(item) {
    const review = item.toJSON();
    const normalizedStatus = normalizeReviewStatus(review.status);

    return {
        ...review,
        status: normalizedStatus,
        availableStatuses: review.deletedAt ? [] : getAvailableReviewStatuses(normalizedStatus),
        user: review.user
            ? {
                id: review.user.id,
                name: review.user.fullName,
                email: review.user.email,
                deletedAt: review.user.deletedAt || null,
            }
            : null,
        product: review.product
            ? {
                id: review.product.id,
                name: review.product.name,
                images: review.product.images,
                deletedAt: review.product.deletedAt || null,
            }
            : null,
    };
}

function buildAdminReviewWhere(query = {}) {
    const includeDeleted = query.includeDeleted === true || query.includeDeleted === 'true';
    const status = query.status || REVIEW_STATUS.PENDING;
    const search = query.search?.trim();
    const rating = query.rating ? Number(query.rating) : null;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;
    const where = {};

    if (rating) {
        where.rating = rating;
    }

    if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    if (status === 'deleted') {
        where.deletedAt = { [Op.ne]: null };
    } else if (status === 'all') {
        if (!includeDeleted) {
            where.deletedAt = null;
        }
    } else {
        where.deletedAt = null;
        where.status = normalizeReviewStatus(status);
    }

    const searchConditions = [];
    if (search) {
        searchConditions.push(
            { '$user.fullName$': { [Op.like]: `%${search}%` } },
            { '$user.email$': { [Op.like]: `%${search}%` } },
            { '$product.name$': { [Op.like]: `%${search}%` } },
            { content: { [Op.like]: `%${search}%` } },
        );
    }

    if (searchConditions.length > 0) {
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push({ [Op.or]: searchConditions });
    }

    return {
        includeDeleted,
        where,
    };
}

async function findEligiblePurchasedOrder(userId, orderCode) {
    return modelOrder.findOne({
        where: {
            userId,
            orderCode,
            status: {
                [Op.in]: ORDER_REVIEWABLE_STATUSES,
            },
        },
        attributes: USER_REVIEW_ORDER_ATTRIBUTES,
        include: [
            {
                model: modelOrderItem,
                as: 'items',
                attributes: ['id', 'productId'],
                required: true,
            },
        ],
    });
}

function getOrderProductIds(order) {
    return [...new Set((order?.items || []).map((item) => item.productId).filter(Boolean))];
}

async function createReview(userId, payload) {
    const normalizedContent = payload.content?.trim();
    if (!normalizedContent) {
        throw new BadRequestError('Nội dung đánh giá không được để trống');
    }

    const eligibleOrder = await findEligiblePurchasedOrder(userId, payload.orderCode);

    if (!eligibleOrder) {
        throw new BadRequestError('Chỉ có thể đánh giá đơn hàng đã giao hoặc hoàn thành');
    }

    if (!isReviewWindowOpen(eligibleOrder)) {
        throw new BadRequestError(`Chỉ có thể đánh giá trong ${config.reviews.reviewWindowDays} ngày sau khi đơn hàng được giao hoặc hoàn thành`);
    }

    const orderProductIds = getOrderProductIds(eligibleOrder);
    if (orderProductIds.length === 0) {
        throw new BadRequestError('Không tìm thấy sản phẩm trong đơn hàng để đánh giá');
    }

    const existingOrderReviews = await productReviewModel.findAll({
        where: {
            userId,
            orderId: eligibleOrder.id,
        },
        paranoid: false,
    });
    const activeOrderReview = existingOrderReviews.find((review) => !review.deletedAt);

    if (activeOrderReview) {
        throw new BadRequestError('Bạn đã đánh giá đơn hàng này rồi');
    }

    const reviews = await connect.transaction(async (transaction) => {
        const restoredReviews = [];

        for (const review of existingOrderReviews) {
            if (!review.deletedAt || !orderProductIds.includes(review.productId)) {
                continue;
            }

            await review.restore({ transaction });
            await review.update({
                rating: payload.rating,
                content: normalizedContent,
                status: REVIEW_STATUS.PENDING,
                reviewedAt: null,
                reviewedByUserId: null,
                orderId: eligibleOrder.id,
            }, { transaction });
            restoredReviews.push(review);
        }

        const restoredProductIds = new Set(restoredReviews.map((review) => review.productId));
        const createdReviews = [];
        for (const productId of orderProductIds) {
            if (restoredProductIds.has(productId)) {
                continue;
            }

            createdReviews.push(await productReviewModel.create({
                productId,
                orderId: eligibleOrder.id,
                rating: payload.rating,
                content: normalizedContent,
                userId,
                status: REVIEW_STATUS.PENDING,
            }, { transaction }));
        }

        return [...restoredReviews, ...createdReviews];
    });

    return findFormattedUserReview(userId, reviews[0].id);
}

async function updateOrderReviews(existingReview, payload) {
    return connect.transaction(async (transaction) => {
        const orderReviewWhere = existingReview.orderId
            ? { userId: existingReview.userId, orderId: existingReview.orderId, deletedAt: null }
            : { id: existingReview.id, userId: existingReview.userId, deletedAt: null };

        await productReviewModel.update({
            rating: payload.rating,
            content: payload.content,
            status: REVIEW_STATUS.PENDING,
            reviewedAt: null,
            reviewedByUserId: null,
        }, {
            where: orderReviewWhere,
            transaction,
        });
    });
}

async function getUserReviews(userId) {
    const reviews = await productReviewModel.findAll({
        where: { userId, deletedAt: null },
        include: getUserReviewInclude(),
        order: [['createdAt', 'DESC']],
    });

    return reviews.map(formatUserReview);
}

async function updateMyReview(userId, reviewId, payload) {
    const normalizedContent = payload.content?.trim();
    if (!normalizedContent) {
        throw new BadRequestError('Nội dung đánh giá không được để trống');
    }

    const existingReview = await productReviewModel.findOne({
        where: { id: reviewId, userId, deletedAt: null },
        include: getUserReviewInclude(),
    });

    if (!existingReview) {
        throw new BadRequestError('Không tìm thấy đánh giá sản phẩm');
    }

    if (!isReviewEditWindowOpen(existingReview)) {
        throw new BadRequestError(`Chỉ có thể sửa đánh giá trong ${config.reviews.editWindowDays} ngày sau khi đánh giá`);
    }

    await updateOrderReviews(existingReview, {
        rating: payload.rating,
        content: normalizedContent,
    });

    return findFormattedUserReview(userId, existingReview.id);
}

async function getApprovedReviews(productId) {
    const items = await productReviewModel.findAll({
        where: {
            productId,
            status: REVIEW_STATUS.APPROVED,
            deletedAt: null,
        },
        include: [{ model: modelUser, attributes: ['id', 'fullName'] }],
        order: [['createdAt', 'DESC']],
    });

    return items.map((item) => {
        const review = item.toJSON();
        return {
            ...review,
            user: review.user ? { id: review.user.id, name: review.user.fullName } : null,
        };
    });
}

async function getAdminReviews(query = {}, pagination = null) {
    const { includeDeleted, where } = buildAdminReviewWhere(query);
    const reviewQuery = {
        where,
        include: [
            {
                model: modelOrder,
                as: 'order',
                attributes: ['id', 'orderCode', 'createdAt', 'status'],
                paranoid: false,
                required: false,
            },
            {
                model: modelUser,
                attributes: ['id', 'fullName', 'email', 'deletedAt'],
                paranoid: false,
                required: false,
            },
            {
                model: modelProduct,
                attributes: ['id', 'name', 'images', 'deletedAt'],
                paranoid: false,
                required: false,
            },
        ],
        paranoid: !(includeDeleted || query.status === 'deleted'),
        order: [['createdAt', 'DESC']],
    };

    if (!pagination) {
        const items = await productReviewModel.findAll(reviewQuery);
        return {
            items: items.map(formatAdminReview),
            pagination: null,
        };
    }

    const { count, rows } = await productReviewModel.findAndCountAll({
        ...reviewQuery,
        limit: pagination.limit,
        offset: pagination.offset,
        distinct: true,
    });

    return {
        items: rows.map(formatAdminReview),
        pagination: buildPaginationMeta(count, pagination),
    };
}

async function updateAdminReviewStatus(id, status, reviewedByUserId) {
    const existingReview = await productReviewModel.findByPk(id);
    if (!existingReview) {
        throw new BadRequestError('Không tìm thấy đánh giá sản phẩm');
    }

    const nextStatus = normalizeReviewStatus(status);
    if (!canTransitionReviewStatus(existingReview.status, nextStatus)) {
        throw new BadRequestError('Không thể chuyển trạng thái đánh giá theo luồng hiện tại');
    }
    if (existingReview.status === nextStatus) {
        return {
            changed: false,
            review: formatAdminReview(existingReview),
        };
    }

    await existingReview.update({
        status: nextStatus,
        reviewedAt: new Date(),
        reviewedByUserId: reviewedByUserId || null,
    });

    const updatedReview = await productReviewModel.findByPk(id, {
        include: [
            {
                model: modelOrder,
                as: 'order',
                attributes: ['id', 'orderCode', 'createdAt', 'status'],
                paranoid: false,
                required: false,
            },
            {
                model: modelUser,
                attributes: ['id', 'fullName', 'email', 'deletedAt'],
                paranoid: false,
                required: false,
            },
            {
                model: modelProduct,
                attributes: ['id', 'name', 'images', 'deletedAt'],
                paranoid: false,
                required: false,
            },
        ],
        paranoid: false,
    });

    return { changed: true, review: formatAdminReview(updatedReview) };
}

async function deleteAdminReview(id) {
    const existingReview = await productReviewModel.findByPk(id);
    if (!existingReview) {
        throw new BadRequestError('Không tìm thấy đánh giá sản phẩm');
    }

    await connect.transaction(async (transaction) => {
        if (existingReview.status !== REVIEW_STATUS.HIDDEN) {
            await existingReview.update({ status: REVIEW_STATUS.HIDDEN }, { transaction });
        }

        await existingReview.destroy({ transaction });
    });
}

async function restoreAdminReview(id, reviewedByUserId) {
    const existingReview = await productReviewModel.findByPk(id, { paranoid: false });
    if (!existingReview) {
        throw new BadRequestError('Không tìm thấy đánh giá sản phẩm');
    }
    if (!existingReview.deletedAt) {
        return { restored: false, review: formatAdminReview(existingReview) };
    }

    await existingReview.restore();
    await existingReview.update({
        status: REVIEW_STATUS.HIDDEN,
        reviewedAt: new Date(),
        reviewedByUserId: reviewedByUserId || null,
    });

    const restoredReview = await productReviewModel.findByPk(id, {
        include: [
            {
                model: modelOrder,
                as: 'order',
                attributes: ['id', 'orderCode', 'createdAt', 'status'],
                paranoid: false,
                required: false,
            },
            {
                model: modelUser,
                attributes: ['id', 'fullName', 'email', 'deletedAt'],
                paranoid: false,
                required: false,
            },
            {
                model: modelProduct,
                attributes: ['id', 'name', 'images', 'deletedAt'],
                paranoid: false,
                required: false,
            },
        ],
        paranoid: false,
    });

    return { restored: true, review: formatAdminReview(restoredReview) };
}

async function permanentlyDeleteAdminReview(id) {
    const existingReview = await productReviewModel.findByPk(id, { paranoid: false });
    if (!existingReview) {
        throw new BadRequestError('Không tìm thấy đánh giá sản phẩm');
    }
    if (!existingReview.deletedAt) {
        throw new BadRequestError('Chỉ có thể xóa vĩnh viễn đánh giá đang ở trong thùng rác');
    }

    await existingReview.destroy({ force: true });
}

module.exports = {
    createReview,
    deleteAdminReview,
    getAdminReviews,
    getApprovedReviews,
    getUserReviews,
    permanentlyDeleteAdminReview,
    restoreAdminReview,
    updateAdminReviewStatus,
    updateMyReview,
};

