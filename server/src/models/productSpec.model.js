const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const ProductSpec = connect.define(
    'product_spec',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
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
        specKey: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        specValue: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        tableName: 'product_specs',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['productId', 'specKey'],
                name: 'product_specs_product_id_spec_key_unique',
            },
            {
                fields: ['specKey'],
                name: 'product_specs_spec_key_idx',
            },
            {
                fields: ['specKey', 'specValue', 'productId'],
                name: 'product_specs_spec_key_spec_value_product_id_idx',
            },
        ],
    },
);

module.exports = ProductSpec;
