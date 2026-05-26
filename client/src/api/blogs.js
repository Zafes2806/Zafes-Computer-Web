import { publicRequest, request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestGetBlogs = async (params = {}) => {
    const res = await request.get(API_PATHS.blogs.collection, { params });
    return res.data;
};

export const requestGetBlogsPublic = async (params = {}) => {
    const res = await publicRequest.get(API_PATHS.blogs.collection, { params });
    return res.data;
};

export const requestCreateBlog = async (data) => {
    const res = await request.post(API_PATHS.blogs.collection, data);
    return res.data;
};

export const requestUpdateBlog = async (data) => {
    const { id, ...payload } = data;
    const res = await request.put(API_PATHS.blogs.byId(id), payload);
    return res.data;
};

export const requestDeleteBlog = async (id) => {
    const res = await request.delete(API_PATHS.blogs.byId(id));
    return res.data;
};

export const requestUpdateBlogStatus = async (id, status) => {
    const res = await request.patch(API_PATHS.blogs.byId(id), { status });
    return res.data;
};

export const requestRestoreBlog = async (id) => {
    const res = await request.patch(API_PATHS.blogs.restore(id));
    return res.data;
};

export const requestDeleteBlogPermanently = async (id) => {
    const res = await request.delete(API_PATHS.blogs.permanentDelete(id));
    return res.data;
};

export const requestGetBlogById = async (id, params = {}) => {
    const res = await request.get(API_PATHS.blogs.byId(id), { params });
    return res.data;
};

export const requestGetBlogByIdPublic = async (id, params = {}) => {
    const res = await publicRequest.get(API_PATHS.blogs.byId(id), { params });
    return res.data;
};
