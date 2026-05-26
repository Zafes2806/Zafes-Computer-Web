const { DataTypes } = require('sequelize');

const { connect } = require('../config/index');
const {
    COMPONENT_TYPE_STATUS,
    COMPONENT_TYPE_STATUSES,
} = require('../constants/componentTypeStatus');

const ComponentType = connect.define(
    'component_type',
    {
        code: {
            type: DataTypes.STRING(50),
            primaryKey: true,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        isProductType: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        isBuildPcAllowed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: COMPONENT_TYPE_STATUS.ACTIVE,
            validate: {
                isIn: [COMPONENT_TYPE_STATUSES],
            },
        },
    },
    {
        tableName: 'component_types',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['status'], name: 'component_types_status_idx' },
            { fields: ['isBuildPcAllowed'], name: 'component_types_build_pc_allowed_idx' },
        ],
    },
);

module.exports = ComponentType;
