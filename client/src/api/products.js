import { publicRequest, request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestGetProductSearchByCategory = async (params) => {
    const res = await publicRequest.get(API_PATHS.products.searchByCategory, { params });
    return res.data;
};

export const requestGetProductSearch = async (params) => {
    const res = await publicRequest.get(API_PATHS.products.search, { params });
    return res.data;
};

export const requestGetProductFilterOptions = async (params = {}) => {
    const res = await publicRequest.get(API_PATHS.products.filterOptions, { params });
    return res.data;
};

export const requestGetProductHotSale = async () => {
    const res = await publicRequest.get(API_PATHS.products.hotSale);
    return res.data.metadata;
};

export const requestGetProductHotSalePublic = async () => {
    const res = await publicRequest.get(API_PATHS.products.hotSale);
    return res.data.metadata;
};

export const requestCreateProduct = async (data) => {
    const res = await request.post(API_PATHS.products.collection, data);
    return res.data;
};

export const requestGetProducts = async (params = {}) => {
    const res = await request.get(API_PATHS.products.collection, { params });
    return res.data;
};

export const requestUpdateProduct = async (data) => {
    const { id, ...payload } = data;
    const res = await request.put(API_PATHS.products.byId(id), payload);
    return res.data;
};

export const requestDeleteProduct = async (id) => {
    const res = await request.delete(API_PATHS.products.byId(id));
    return res.data;
};

export const requestUpdateProductStatus = async (id, status) => {
    const res = await request.patch(API_PATHS.products.byId(id), { status });
    return res.data;
};

export const requestRestoreProduct = async (id) => {
    const res = await request.patch(API_PATHS.products.restore(id));
    return res.data;
};

export const requestDeleteProductPermanently = async (id) => {
    const res = await request.delete(API_PATHS.products.permanentDelete(id));
    return res.data;
};

export const requestGetProductsByCategories = async () => {
    const res = await publicRequest.get(API_PATHS.products.groupedByCategory);
    return res.data;
};

export const requestGetProductsByCategoriesPublic = async () => {
    const res = await publicRequest.get(API_PATHS.products.groupedByCategory);
    return res.data;
};

export const requestGetProductById = async (id, params = {}) => {
    const res = await request.get(API_PATHS.products.byId(id), { params });
    return res.data;
};

export const requestGetProductByIdPublic = async (id, params = {}) => {
    const res = await publicRequest.get(API_PATHS.products.byId(id), { params });
    return res.data;
};

export const requestFindProductComponent = async (componentType) => {
    const res = await publicRequest.get(API_PATHS.products.components, {
        params: { componentType },
    });
    return res.data;
};
