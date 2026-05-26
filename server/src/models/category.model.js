const { DataTypes } = require('sequelize');

const { connect } = require('../config/index');
const { CATEGORY_STATUS, CATEGORY_STATUSES } = require('../constants/categoryStatus');
const { normalizeUploadPath } = require('../utils/assetPaths');

const Category = connect.define(
    'category',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: CATEGORY_STATUS.ACTIVE,
            validate: {
                isIn: [CATEGORY_STATUSES],
            },
        },
    },

    {
        tableName: 'categories',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['status'],
                name: 'categories_status_idx',
            },
        ],
        hooks: {
            beforeValidate(category) {
                category.image = normalizeUploadPath(category.image);
            },
        },
    },
);

module.exports = Category;
