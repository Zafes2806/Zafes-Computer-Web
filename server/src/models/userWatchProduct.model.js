const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const userWatchProduct = connect.define(
    'userWatchProduct',
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
    },
    {
        tableName: 'recently_viewed',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'productId'],
                name: 'recently_viewed_user_product_unique',
            },
            {
                fields: ['productId'],
                name: 'recently_viewed_product_idx',
            },
        ],
    },
);

module.exports = userWatchProduct;
