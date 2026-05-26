const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');
const { USER_STATUS, USER_STATUSES } = require('../constants/userStatus');

const User = connect.define(
    'users',
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
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: USER_STATUS.ACTIVE,
            validate: {
                isIn: [USER_STATUSES],
            },
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        authProvider: {
            type: DataTypes.ENUM('google', 'email'),
            allowNull: false,
        },
    },
    {
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['email'],
                name: 'users_email_unique',
            },
            {
                fields: ['status'],
                name: 'users_status_idx',
            },
        ],
    },
);

module.exports = User;
