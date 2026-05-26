function getDiscountedPrice(product) {
    const price = Number(product?.price) || 0;
    const discount = Number(product?.discount) || 0;

    if (discount <= 0) {
        return price;
    }

    return Math.round(price * (1 - discount / 100));
}

module.exports = {
    getDiscountedPrice,
    getFinalPrice: getDiscountedPrice,
};
