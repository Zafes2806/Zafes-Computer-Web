const { Created, OK } = require('../core/success.response');
const reviewService = require('../services/productReview.service');
const { parsePaginationQuery } = require('../utils/pagination');
const { isForceDelete } = require('../utils/requestFlags');

async function createReview(req, res) {
    const metadata = await reviewService.createReview(req.user.id, req.body);
    return new Created({ message: 'Đánh giá sản phẩm thành công', metadata }).send(res);
}

async function updateMyReview(req, res) {
    const metadata = await reviewService.updateMyReview(req.user.id, req.params.id, req.body);
    return new OK({ message: 'Cập nhật đánh giá sản phẩm thành công', metadata }).send(res);
}

async function getMyReviews(req, res) {
    const metadata = await reviewService.getUserReviews(req.user.id);
    return new OK({ message: 'Lấy danh sách đánh giá sản phẩm thành công', metadata }).send(res);
}

async function getAdminReviews(req, res) {
    const pagination = parsePaginationQuery(req.query, { defaultLimit: 20, maxLimit: 100 });
    const result = await reviewService.getAdminReviews(req.query, pagination);
    return new OK({
        message: 'Lấy danh sách đánh giá sản phẩm thành công',
        metadata: result.items,
        ...(result.pagination ? { pagination: result.pagination } : {}),
    }).send(res);
}

async function updateAdminReviewStatus(req, res) {
    const result = await reviewService.updateAdminReviewStatus(req.params.id, req.body.status, req.user.id);
    return new OK({
        message: result.changed ? 'Cập nhật trạng thái đánh giá thành công' : 'Trạng thái đánh giá không thay đổi',
        metadata: result.review,
    }).send(res);
}

async function deleteAdminReview(req, res) {
    if (isForceDelete(req)) {
        await reviewService.permanentlyDeleteAdminReview(req.params.id);
        return new OK({
            message: 'Xóa vĩnh viễn đánh giá sản phẩm thành công',
        }).send(res);
    }

    await reviewService.deleteAdminReview(req.params.id);
    return new OK({
        message: 'Xóa đánh giá sản phẩm thành công',
    }).send(res);
}

async function restoreAdminReview(req, res) {
    const result = await reviewService.restoreAdminReview(req.params.id, req.user.id);
    return new OK({
        message: result.restored ? 'Khôi phục đánh giá sản phẩm thành công' : 'Đánh giá đang hoạt động',
        metadata: result.review,
    }).send(res);
}

module.exports = {
    createReview,
    deleteAdminReview,
    getAdminReviews,
    getMyReviews,
    restoreAdminReview,
    updateAdminReviewStatus,
    updateMyReview,
};
