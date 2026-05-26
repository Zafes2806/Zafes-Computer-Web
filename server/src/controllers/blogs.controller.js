const { Created, OK } = require('../core/success.response');
const blogService = require('../services/blog.service');
const { parsePaginationQuery } = require('../utils/pagination');
const { isForceDelete } = require('../utils/requestFlags');

async function createBlog(req, res) {
    const metadata = await blogService.createBlog(req.body);
    return new Created({
        message: 'Tạo bài viết thành công',
        metadata,
    }).send(res);
}

async function updateBlog(req, res) {
    const metadata = await blogService.updateBlog(req.params.id, req.body);
    return new OK({
        message: 'Cập nhật bài viết thành công',
        metadata,
    }).send(res);
}

async function updateBlogStatus(req, res) {
    const result = await blogService.updateBlogStatus(req.params.id, req.body.status);
    return new OK({
        message: result.changed ? 'Cập nhật trạng thái bài viết thành công' : 'Trạng thái bài viết không thay đổi',
        metadata: result.blog,
    }).send(res);
}

async function getBlogs(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 10, maxLimit: 100 });
    const result = await blogService.getBlogs(req.query, pagination, {
        adminScope: Boolean(req.user?.isAdmin),
    });
    return new OK({
        message: 'Lấy danh sách bài viết thành công',
        metadata: result.items,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function getBlogById(req, res) {
    const metadata = await blogService.getBlogById(req.params.id, {
        adminScope: Boolean(req.user?.isAdmin),
        includeDeleted: req.query.includeDeleted === 'true',
    });
    return new OK({
        message: 'Lấy bài viết thành công',
        metadata,
    }).send(res);
}

async function deleteBlog(req, res) {
    if (isForceDelete(req)) {
        await blogService.permanentlyDeleteBlog(req.params.id);
        return new OK({
            message: 'Xóa vĩnh viễn bài viết thành công',
        }).send(res);
    }

    const metadata = await blogService.deleteBlog(req.params.id);
    return new OK({
        message: 'Xóa bài viết thành công',
        metadata,
    }).send(res);
}

async function restoreBlog(req, res) {
    const result = await blogService.restoreBlog(req.params.id);
    return new OK({
        message: result.restored ? 'Khôi phục bài viết thành công' : 'Bài viết đang hoạt động',
        metadata: result.blog,
    }).send(res);
}

module.exports = {
    createBlog,
    deleteBlog,
    getBlogById,
    getBlogs,
    restoreBlog,
    updateBlog,
    updateBlogStatus,
};
