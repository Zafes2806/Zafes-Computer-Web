const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');
const {
    SPEC_DEFINITION_STATUS,
    SPEC_DEFINITION_STATUSES,
} = require('../constants/specDefinitionStatus');

const SpecDefinition = connect.define(
    'spec_definition',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        componentType: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: {
                model: 'component_types',
                key: 'code',
            },
        },
        specKey: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        label: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        options: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: SPEC_DEFINITION_STATUS.ACTIVE,
            validate: {
                isIn: [SPEC_DEFINITION_STATUSES],
            },
        },
    },
    {
        tableName: 'spec_definitions',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['componentType', 'specKey'],
                name: 'spec_definitions_component_type_spec_key_unique',
            },
            {
                fields: ['status'],
                name: 'spec_definitions_status_idx',
            },
        ],
    },
);

module.exports = SpecDefinition;
