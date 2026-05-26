const { DataTypes } = require('sequelize');

const { connect } = require('../config/index');

const pcConfiguration = connect.define(
    'pc_configuration',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: 'products',
                key: 'id',
            },
        },
        cpu: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        motherboard: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ram: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        storage: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        gpu: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        power: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        computerCase: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        cooler: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: 'pc_configurations',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['productId'],
                name: 'pc_configurations_product_id_unique',
            },
        ],
    },
);

module.exports = pcConfiguration;
