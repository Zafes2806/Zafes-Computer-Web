const { OK } = require('../core/success.response');
const wishlistService = require('../services/wishlist.service');

async function createProductWatch(req, res) {
    const metadata = await wishlistService.createProductWatch(req.user.id, req.body.productId);
    return new OK({
        message: 'Ghi nhận sản phẩm đã xem thành công',
        metadata,
    }).send(res);
}

async function getProductWatch(req, res) {
    const metadata = await wishlistService.getProductWatch(req.user.id);
    return new OK({
        message: 'Lấy danh sách sản phẩm đã xem gần đây thành công',
        metadata,
    }).send(res);
}

module.exports = {
    createProductWatch,
    getProductWatch,
};
