const { DataTypes } = require('sequelize');

const { connect } = require('../config/index');
const {
    PAYMENT_ATTEMPT_STATUSES,
    PAYMENT_PROVIDERS,
} = require('../constants/paymentAttemptStatus');

const PaymentAttempt = connect.define(
    'payment_attempts',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id',
            },
        },
        orderCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        provider: {
            type: DataTypes.ENUM(...PAYMENT_PROVIDERS),
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...PAYMENT_ATTEMPT_STATUSES),
            allowNull: false,
            defaultValue: 'pending',
        },
        gatewayRequestId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        gatewayTransactionId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        paymentUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        failureReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        refundNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        refundedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        rawRequest: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        rawResponse: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        rawCallback: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        tableName: 'payment_attempts',
        timestamps: true,
        indexes: [
            { fields: ['orderId'], name: 'payment_attempts_order_id_idx' },
            { fields: ['orderCode'], name: 'payment_attempts_order_code_idx' },
            { fields: ['status', 'updatedAt'], name: 'payment_attempts_status_updated_at_idx' },
            { unique: true, fields: ['provider', 'gatewayRequestId'], name: 'payment_attempts_provider_request_unique' },
        ],
    },
);

module.exports = PaymentAttempt;
