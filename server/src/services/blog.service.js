const { Op } = require('sequelize');

const { connect } = require('../config/index');
const modelBlogs = require('../models/blogs.model');
const {
    BLOG_STATUS,
    canTransitionBlogStatus,
    getAvailableBlogStatuses,
    normalizeBlogStatus,
} = require('../constants/blogStatus');
const { BadRequestError } = require('../core/error.response');
const { buildPaginationMeta } = require('../utils/pagination');
const { hasMeaningfulRichText, sanitizeRichTextHtml } = require('../utils/htmlSanitizer');

function normalizeBlogPayload(payload = {}) {
    return {
        title: payload.title?.trim(),
        content: sanitizeRichTextHtml(payload.content),
        image: payload.image?.trim(),
    };
}

function validateBlogPayload({ title, content, image }) {
    if (!title || !image || !hasMeaningfulRichText(content)) {
        throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }
}

function buildBlogListWhere(query = {}, adminScope = false) {
    if (!adminScope) {
        return {
            where: {
                deletedAt: null,
                status: BLOG_STATUS.PUBLISHED,
            },
            paranoid: true,
        };
    }

    const includeDeleted = query.includeDeleted === true || query.includeDeleted === 'true';
    const status = query.status || 'all';
    const search = query.search?.trim();
    const where = {};

    if (search) {
        where[Op.or] = [
            { title: { [Op.like]: `%${search}%` } },
            { content: { [Op.like]: `%${search}%` } },
        ];
    }

    if (status === 'deleted') {
        where.deletedAt = { [Op.ne]: null };
    } else if (status !== 'all') {
        where.deletedAt = null;
        where.status = normalizeBlogStatus(status);
    } else if (!includeDeleted) {
        where.deletedAt = null;
    }

    return {
        where,
        paranoid: !(includeDeleted || status === 'deleted'),
    };
}

function buildPublishedAtValue(currentBlog, nextStatus) {
    if (nextStatus !== BLOG_STATUS.PUBLISHED) {
        return currentBlog.publishedAt;
    }

    return currentBlog.publishedAt || new Date();
}

function formatBlogForAdmin(blog) {
    const rawBlog = typeof blog?.toJSON === 'function' ? blog.toJSON() : blog;
    const normalizedStatus = normalizeBlogStatus(rawBlog?.status);

    return {
        ...rawBlog,
        status: normalizedStatus,
        availableStatuses: rawBlog?.deletedAt ? [] : getAvailableBlogStatuses(normalizedStatus),
    };
}

async function createBlog(payload) {
    const normalizedPayload = normalizeBlogPayload(payload);
    validateBlogPayload(normalizedPayload);

    const status = normalizeBlogStatus(payload.status);
    const blog = await modelBlogs.create({
        ...normalizedPayload,
        status,
        publishedAt: status === BLOG_STATUS.PUBLISHED ? new Date() : null,
    });

    return formatBlogForAdmin(blog);
}

async function updateBlog(id, payload) {
    const normalizedPayload = normalizeBlogPayload(payload);
    validateBlogPayload(normalizedPayload);

    const blog = await modelBlogs.findByPk(id);
    if (!blog) {
        throw new BadRequestError('Bài viết không tồn tại');
    }

    await blog.update(normalizedPayload);

    return formatBlogForAdmin(blog);
}

async function updateBlogStatus(id, status) {
    const blog = await modelBlogs.findByPk(id);
    if (!blog) {
        throw new BadRequestError('Bài viết không tồn tại');
    }

    const nextStatus = normalizeBlogStatus(status);
    if (!canTransitionBlogStatus(blog.status, nextStatus)) {
        throw new BadRequestError('Không thể chuyển trạng thái bài viết theo luồng hiện tại');
    }
    if (blog.status === nextStatus) {
        return { changed: false, blog: formatBlogForAdmin(blog) };
    }

    await blog.update({
        status: nextStatus,
        publishedAt: buildPublishedAtValue(blog, nextStatus),
    });

    return { changed: true, blog: formatBlogForAdmin(blog) };
}

async function getBlogs(query = {}, pagination = null, { adminScope = false } = {}) {
    const listScope = buildBlogListWhere(query, adminScope);
    const queryOptions = {
        ...listScope,
        order: [[adminScope ? 'updatedAt' : 'publishedAt', 'DESC']],
    };

    if (!pagination) {
        return {
            items: (await modelBlogs.findAll(queryOptions)).map((item) => (
                adminScope ? formatBlogForAdmin(item) : item
            )),
            pagination: null,
        };
    }

    const { count, rows } = await modelBlogs.findAndCountAll({
        ...queryOptions,
        limit: pagination.limit,
        offset: pagination.offset,
    });

    return {
        items: rows.map((item) => (adminScope ? formatBlogForAdmin(item) : item)),
        pagination: buildPaginationMeta(count, pagination),
    };
}

async function getBlogById(id, { adminScope = false, includeDeleted = false } = {}) {
    if (!adminScope) {
        const blog = await modelBlogs.findOne({
            where: { id, status: BLOG_STATUS.PUBLISHED },
        });
        if (!blog) {
            throw new BadRequestError('Bài viết không tồn tại');
        }

        return adminScope ? formatBlogForAdmin(blog) : blog;
    }

    const blog = await modelBlogs.findOne({
        where: { id },
        paranoid: !includeDeleted,
    });
    if (!blog) {
        throw new BadRequestError('Bài viết không tồn tại');
    }

    return formatBlogForAdmin(blog);
}

async function deleteBlog(id) {
    const blog = await modelBlogs.findByPk(id);
    if (!blog) {
        throw new BadRequestError('Bài viết không tồn tại');
    }

    await connect.transaction(async (transaction) => {
        if (blog.status !== BLOG_STATUS.ARCHIVED) {
            await blog.update({ status: BLOG_STATUS.ARCHIVED }, { transaction });
        }

        await blog.destroy({ transaction });
    });
    return blog;
}

async function restoreBlog(id) {
    const blog = await modelBlogs.findByPk(id, { paranoid: false });
    if (!blog) {
        throw new BadRequestError('Bài viết không tồn tại');
    }
    if (!blog.deletedAt) {
        return { restored: false, blog: formatBlogForAdmin(blog) };
    }

    await blog.restore();
    await blog.update({ status: BLOG_STATUS.DRAFT });
    return { restored: true, blog: formatBlogForAdmin(blog) };
}

async function permanentlyDeleteBlog(id) {
    const blog = await modelBlogs.findByPk(id, { paranoid: false });
    if (!blog) {
        throw new BadRequestError('Bài viết không tồn tại');
    }
    if (!blog.deletedAt) {
        throw new BadRequestError('Chỉ có thể xóa vĩnh viễn bài viết đang ở trong thùng rác');
    }

    await blog.destroy({ force: true });
}

module.exports = {
    createBlog,
    deleteBlog,
    getBlogById,
    getBlogs,
    permanentlyDeleteBlog,
    restoreBlog,
    updateBlog,
    updateBlogStatus,
};
