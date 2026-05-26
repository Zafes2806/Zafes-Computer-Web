const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');
const { ORDER_STATUSES } = require('../constants/orderStatus');

const Order = connect.define(
    'orders',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        totalPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...ORDER_STATUSES),
            allowNull: false,
            defaultValue: 'pending',
        },
        returnReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        deliveredAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        cancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        returnRequestedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        returnRejectedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        adminNote: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Ghi chú của admin (vd: lý do từ chối trả hàng)',
        },
        returnedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        refundedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        guestAccessTokenHash: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        guestAccessTokenExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'orders',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['orderCode'], name: 'orders_order_code_unique' },
            { fields: ['userId'], name: 'orders_user_id_idx' },
            { fields: ['status', 'deliveredAt'], name: 'orders_status_delivered_at_idx' },
            { fields: ['createdAt'], name: 'orders_created_at_idx' },
        ],
    },
);

module.exports = Order;
