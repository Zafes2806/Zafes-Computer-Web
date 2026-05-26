const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const modelUser = require('./users.model');

const RefreshToken = connect.define(
    'refreshToken',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        tokenHash: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'refresh_tokens',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['tokenHash'],
                name: 'refresh_tokens_token_hash_unique',
            },
            {
                fields: ['userId'],
                name: 'refresh_tokens_user_id_idx',
            },
            {
                fields: ['expiresAt'],
                name: 'refresh_tokens_expires_at_idx',
            },
        ],
    },
);

modelUser.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(modelUser, { foreignKey: 'userId' });

module.exports = RefreshToken;
