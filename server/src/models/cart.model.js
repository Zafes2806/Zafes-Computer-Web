const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const cart = connect.define(
    'cart',
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
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        totalPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: 'cart_items',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'productId'],
                name: 'cart_items_user_product_unique',
            },
            {
                fields: ['productId'],
                name: 'cart_items_product_idx',
            },
        ],
    },
);

module.exports = cart;
