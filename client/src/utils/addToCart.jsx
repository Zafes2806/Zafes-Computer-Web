import { requestAddToCart } from '../api';

const handleAddToCart = async (data) => {
    try {
        const res = await requestAddToCart(data);
        return res;
    } catch (error) {
        console.log(error);
    }
};

export default handleAddToCart;
