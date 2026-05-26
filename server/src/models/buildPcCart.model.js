const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const buildPcCart = connect.define(
    'buildPcCart',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
        },
        componentType: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: {
                model: 'component_types',
                key: 'code',
            },
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        totalPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: 'build_pc_cart_items',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'productId'],
                name: 'build_pc_cart_items_user_product_unique',
            },
            {
                unique: true,
                fields: ['userId', 'componentType'],
                name: 'build_pc_cart_items_user_component_type_unique',
            },
            {
                fields: ['productId'],
                name: 'build_pc_cart_items_product_idx',
            },
        ],
    },
);

module.exports = buildPcCart;
