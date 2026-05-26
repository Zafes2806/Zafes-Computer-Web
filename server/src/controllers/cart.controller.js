const { Created, OK } = require('../core/success.response');
const cartService = require('../services/cart.service');

async function addToCart(req, res) {
    const metadata = await cartService.addToCart(req.user.id, req.body);
    return new Created({ message: 'Thêm vào giỏ hàng thành công', metadata }).send(res);
}

async function getCart(req, res) {
    const metadata = await cartService.getCart(req.user.id);
    return new OK({ message: 'Lấy giỏ hàng thành công', metadata }).send(res);
}

async function deleteCart(req, res) {
    await cartService.deleteCart(req.user.id, req.params.cartItemId);
    return new OK({ message: 'Xoá sản phẩm thành công' }).send(res);
}

async function addToCartBuildPC(req, res) {
    await cartService.addToCartBuildPC(req.user.id);
    return new OK({ message: 'Đã chuyển sản phẩm build PC vào giỏ hàng' }).send(res);
}

async function deleteAllCartBuildPC(req, res) {
    await cartService.deleteAllCartBuildPC(req.user.id);
    return new OK({ message: 'Xoá giỏ hàng thành công' }).send(res);
}

async function updateQuantity(req, res) {
    await cartService.updateQuantity(req.user.id, req.params.cartItemId, req.body.quantity);
    return new OK({ message: 'Cập nhật số lượng thành công' }).send(res);
}

async function getCartBuildPc(req, res) {
    const metadata = await cartService.getCartBuildPc(req.user.id);
    return new OK({ message: 'Lấy giỏ hàng thành công', metadata }).send(res);
}

module.exports = {
    addToCart,
    addToCartBuildPC,
    deleteAllCartBuildPC,
    deleteCart,
    getCart,
    getCartBuildPc,
    updateQuantity,
};
