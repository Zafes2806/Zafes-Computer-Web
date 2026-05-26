const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');
const { REVIEW_STATUS, REVIEW_STATUSES } = require('../constants/reviewStatus');

const PRODUCT_REVIEW_TABLE = 'product_reviews';

const productReviewModel = connect.define(
    'ProductReview',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'orders',
                key: 'id',
            },
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: REVIEW_STATUS.PENDING,
            validate: {
                isIn: [REVIEW_STATUSES],
            },
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reviewedByUserId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        tableName: PRODUCT_REVIEW_TABLE,
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'orderId', 'productId'],
                name: 'product_reviews_user_order_product_unique',
            },
            {
                fields: ['productId'],
                name: 'product_reviews_product_idx',
            },
            {
                fields: ['orderId'],
                name: 'product_reviews_order_idx',
            },
            {
                fields: ['status'],
                name: 'product_reviews_status_idx',
            },
        ],
    },
);

module.exports = productReviewModel;
module.exports.PRODUCT_REVIEW_TABLE = PRODUCT_REVIEW_TABLE;

