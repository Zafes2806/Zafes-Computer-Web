const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const otp = connect.define(
    'otps',
    {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        otp: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'otp_codes',
        timestamps: true,
    },
);

module.exports = otp;
