const { OK } = require('../core/success.response');
const buildPcCartService = require('../services/buildPcCart.service');

async function createItem(req, res) {
    await buildPcCartService.buildPcCart(req.user.id, req.body);
    return new OK({ message: 'Đã thêm sản phẩm vào giỏ build PC' }).send(res);
}

async function getItems(req, res) {
    const metadata = await buildPcCartService.getBuildPcCart(req.user.id);
    return new OK({ message: 'Lấy giỏ build PC thành công', metadata }).send(res);
}

async function updateQuantity(req, res) {
    await buildPcCartService.updateQuantityCartBuildPc(req.user.id, {
        productId: req.params.productId,
        quantity: req.body.quantity,
    });
    return new OK({ message: 'Cập nhật số lượng thành công' }).send(res);
}

async function deleteItem(req, res) {
    await buildPcCartService.deleteCartBuildPc(req.user.id, req.params.productId);
    return new OK({ message: 'Xóa sản phẩm trong giỏ hàng thành công' }).send(res);
}

module.exports = {
    createItem,
    deleteItem,
    getItems,
    updateQuantity,
};
