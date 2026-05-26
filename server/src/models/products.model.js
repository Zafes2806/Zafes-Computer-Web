const { DataTypes } = require('sequelize');

const { connect } = require('../config/index');
const { PRODUCT_STATUSES, PRODUCT_STATUS } = require('../constants/productStatus');
const { normalizeDelimitedUploadPaths } = require('../utils/assetPaths');

const products = connect.define(
    'products',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 500],
            },
        },
        price: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
            validate: {
                min: 0,
            },
            get() {
                const value = this.getDataValue('price');
                return value === null ? null : Number(value);
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        discount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100,
            },
        },
        images: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id',
            },
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
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
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: PRODUCT_STATUS.ACTIVE,
            validate: {
                isIn: [PRODUCT_STATUSES],
            },
        },
    },
    {
        tableName: 'products',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['categoryId'], name: 'products_category_id_idx' },
            { fields: ['componentType'], name: 'products_component_type_idx' },
            { fields: ['status'], name: 'products_status_idx' },
            { fields: ['price'], name: 'products_price_idx' },
            { fields: ['discount', 'status', 'deletedAt', 'createdAt'], name: 'products_discount_status_deleted_at_created_at_idx' },
            { fields: ['categoryId', 'status', 'deletedAt', 'createdAt'], name: 'products_category_id_status_deleted_at_created_at_idx' },
            { fields: ['componentType', 'status', 'deletedAt', 'createdAt'], name: 'products_component_type_status_deleted_at_created_at_idx' },
            {
                fields: ['categoryId', 'componentType', 'status', 'deletedAt', 'createdAt'],
                name: 'products_category_id_component_type_status_deleted_at_created_at_idx',
            },
        ],
        hooks: {
            beforeValidate(product) {
                product.images = normalizeDelimitedUploadPaths(product.images);
            },
        },
    },
);
module.exports = products;
