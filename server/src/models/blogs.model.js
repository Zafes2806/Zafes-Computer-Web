const { DataTypes } = require('sequelize');

const { connect } = require('../config/index');
const { BLOG_STATUS, BLOG_STATUSES } = require('../constants/blogStatus');
const { normalizeUploadPath } = require('../utils/assetPaths');

const blogs = connect.define(
    'blogs',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'cover_image',
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: BLOG_STATUS.DRAFT,
            validate: {
                isIn: [BLOG_STATUSES],
            },
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'blog_posts',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['status'],
                name: 'blog_posts_status_idx',
            },
            {
                fields: ['publishedAt'],
                name: 'blog_posts_published_at_idx',
            },
        ],
        hooks: {
            beforeValidate(blog) {
                blog.image = normalizeUploadPath(blog.image);
            },
        },
    },
);

module.exports = blogs;
