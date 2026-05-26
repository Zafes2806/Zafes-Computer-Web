const { DataTypes } = require('sequelize');

const { connect } = require('../config/index');
const { normalizeDelimitedUploadPaths } = require('../utils/assetPaths');

const OrderItem = connect.define(
    'order_items',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'orders',
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
        productName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        productImages: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        productSnapshot: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        unitPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        discount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        lineTotal: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: 'order_items',
        timestamps: true,
        indexes: [
            { fields: ['orderId'], name: 'order_items_order_id_idx' },
            { fields: ['productId'], name: 'order_items_product_id_idx' },
        ],
        hooks: {
            beforeValidate(orderItem) {
                orderItem.productImages = normalizeDelimitedUploadPaths(orderItem.productImages);
            },
        },
    },
);

module.exports = OrderItem;

