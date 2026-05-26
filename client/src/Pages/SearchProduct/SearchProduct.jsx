import { Navigate, useParams } from 'react-router-dom';
import { createProductListPath } from '../../utils/productListRoute';

function SearchProduct() {
    const { category = 'all', nameProduct = '' } = useParams();
    const search = nameProduct.trim();
    const target = createProductListPath({ category, search });

    return <Navigate to={target} replace />;
}

export default SearchProduct;
