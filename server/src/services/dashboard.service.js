const { Op, Sequelize } = require('sequelize');

const modelUser = require('../models/users.model');
const modelProduct = require('../models/products.model');
const modelOrder = require('../models/order.model');
const modelOrderItem = require('../models/orderItem.model');
const modelUserWatch = require('../models/userWatchProduct.model');
const modelBlog = require('../models/blogs.model');
const modelContact = require('../models/contact.model');
const modelReview = require('../models/productReview.model');
const { normalizeComponentType } = require('../constants/componentTypes');
const { PRODUCT_STATUS } = require('../constants/productStatus');
const { USER_STATUS } = require('../constants/userStatus');
const { BLOG_STATUS } = require('../constants/blogStatus');
const { CONTACT_STATUS } = require('../constants/contactStatus');
const { REVIEW_STATUS } = require('../constants/reviewStatus');
const {
    ORDER_REVENUE_STATUSES,
    ORDER_STATUSES,
    getOrderStatusLabel,
} = require('../constants/orderStatus');

const ORDER_CREATED_AT_DB_COLUMN = 'orders.created_at';
const PRODUCT_COMPONENT_TYPE_DB_COLUMN = 'product.component_type';

function buildDateRangeWhere(query = {}) {
    const { startDate, endDate } = query;
    if (!startDate || !endDate) return {};

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { createdAt: { [Op.between]: [start, end] } };
}

function formatLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function getDashboardStats(query) {
    const dateRangeWhere = buildDateRangeWhere(query);
    const totalUsers = await modelUser.count({ where: { deletedAt: null } });
    const totalProducts = await modelProduct.count({ where: { deletedAt: null } });
    const totalWatching = await modelUserWatch.count();
    const totalRevenue = await modelOrder.sum('totalPrice', {
        where: { status: { [Op.in]: ORDER_REVENUE_STATUSES }, ...dateRangeWhere },
    });

    const recentOrders = await modelOrder.findAll({
        attributes: ['id', 'orderCode', 'fullName', 'totalPrice', 'status', 'paymentMethod', 'createdAt'],
        where: dateRangeWhere,
        order: [['createdAt', 'DESC']],
        limit: 5,
    });

    const productSales = await modelOrderItem.findAll({
        attributes: ['productId', [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold']],
        include: [{
            model: modelOrder,
            as: 'order',
            attributes: [],
            where: { status: { [Op.in]: ORDER_REVENUE_STATUSES }, ...dateRangeWhere },
        }],
        group: ['productId'],
        order: [[Sequelize.fn('SUM', Sequelize.col('quantity')), 'DESC']],
        limit: 5,
        raw: true,
    });

    const topProductIds = productSales.map((sale) => sale.productId);
    const topProducts = topProductIds.length > 0
        ? await modelProduct.findAll({
            where: { id: { [Op.in]: topProductIds } },
            attributes: ['id', 'name', 'componentType', 'price', 'stock'],
        })
        : [];
    const topProductsById = new Map(topProducts.map((product) => [product.id, product]));

    const [
        inactiveProducts,
        lockedUsers,
        draftBlogs,
        newContacts,
        pendingReviews,
    ] = await Promise.all([
        modelProduct.count({ where: { status: PRODUCT_STATUS.INACTIVE, deletedAt: null } }),
        modelUser.count({ where: { status: USER_STATUS.LOCKED, deletedAt: null } }),
        modelBlog.count({ where: { status: BLOG_STATUS.DRAFT, deletedAt: null } }),
        modelContact.count({ where: { status: CONTACT_STATUS.NEW, deletedAt: null } }),
        modelReview.count({ where: { status: REVIEW_STATUS.PENDING, deletedAt: null } }),
    ]);

    return {
        statistics: {
            totalUsers,
            totalProducts,
            totalRevenue: totalRevenue || 0,
            totalWatching,
        },
        queues: {
            inactiveProducts,
            lockedUsers,
            draftBlogs,
            newContacts,
            pendingReviews,
        },
        recentOrders,
        topProducts: topProductIds.map((productId) => {
            const product = topProductsById.get(productId);
            if (!product) {
                return null;
            }

            const sale = productSales.find((item) => item.productId === product.id);
            return {
                ...product.toJSON(),
                componentType: normalizeComponentType(product.componentType),
                totalSold: sale ? parseInt(sale.totalSold, 10) : 0,
                quantity: sale ? parseInt(sale.totalSold, 10) : 0,
            };
        }).filter(Boolean),
    };
}

async function getOrderStats(query) {
    let start;
    let end;
    if (query.startDate && query.endDate) {
        start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
    } else {
        end = new Date();
        end.setHours(23, 59, 59, 999);
        start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    }

    const dateArray = [];
    const current = new Date(start);
    while (current <= end) {
        dateArray.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    const createdAtDateExpression = Sequelize.fn('DATE', Sequelize.col(ORDER_CREATED_AT_DB_COLUMN));

    const orders = await modelOrder.findAll({
        attributes: [
            [createdAtDateExpression, 'date'],
            [Sequelize.fn('COUNT', Sequelize.col('orders.id')), 'count'],
        ],
        where: { createdAt: { [Op.between]: [start, end] } },
        group: [createdAtDateExpression],
        order: [[createdAtDateExpression, 'ASC']],
        raw: true,
    });

    return dateArray.map((date) => {
        const dateStr = formatLocalDateKey(date);
        const orderData = orders.find((order) => order.date === dateStr);
        return { date: dateStr, count: orderData ? parseInt(orderData.count, 10) : 0 };
    });
}

async function getChartData(query = {}) {
    const dateRangeWhere = buildDateRangeWhere(query);
    const productComponentTypeExpression = Sequelize.col(PRODUCT_COMPONENT_TYPE_DB_COLUMN);

    const categoryStats = await modelOrderItem.findAll({
        attributes: [
            [productComponentTypeExpression, 'componentType'],
            [Sequelize.fn('SUM', Sequelize.col('order_items.quantity')), 'value'],
        ],
        include: [
            {
                model: modelOrder,
                as: 'order',
                attributes: [],
                where: { status: { [Op.in]: ORDER_REVENUE_STATUSES }, ...dateRangeWhere },
            },
            {
                model: modelProduct,
                as: 'product',
                attributes: [],
            },
        ],
        group: [productComponentTypeExpression],
        raw: true,
    });

    const orderStats = await modelOrder.findAll({
        attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'value']],
        where: { status: { [Op.in]: ORDER_STATUSES }, ...dateRangeWhere },
        group: ['status'],
        raw: true,
    });

    const orderStatsMap = new Map(orderStats.map((stat) => [stat.status, parseInt(stat.value, 10)]));
    const categoryNames = { pc: 'Máy tính', vga: 'Card đồ họa', cpu: 'CPU', ram: 'RAM', ssd: 'Ổ cứng' };

    const groupedCategoryStats = categoryStats.reduce((accumulator, stat) => {
        const normalizedType = normalizeComponentType(stat.componentType);
        accumulator[normalizedType] = (accumulator[normalizedType] || 0) + parseInt(stat.value, 10);
        return accumulator;
    }, {});

    return {
        categoryStats: Object.entries(groupedCategoryStats).map(([type, value]) => ({
            type: categoryNames[type] || type.toUpperCase(),
            value,
        })),
        orderStats: ORDER_STATUSES.map((status) => ({
            status: getOrderStatusLabel(status),
            value: orderStatsMap.get(status) || 0,
        })).filter((stat) => stat.value > 0),
    };
}

module.exports = {
    getChartData,
    getDashboardStats,
    getOrderStats,
};

