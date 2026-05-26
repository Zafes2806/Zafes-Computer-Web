const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');
const { CONTACT_STATUS, CONTACT_STATUSES } = require('../constants/contactStatus');

const Contact = connect.define(
    'contact',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        purchaseIntent: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        purpose: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        budget: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        deliveryOption: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: CONTACT_STATUS.NEW,
            validate: {
                isIn: [CONTACT_STATUSES],
            },
        },
        adminNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        handledAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },

    {
        tableName: 'contacts',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['status'],
                name: 'contacts_status_idx',
            },
        ],
    },
);

module.exports = Contact;
