import { request } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestGetContacts = async (params = {}) => {
    const res = await request.get(API_PATHS.contacts.collection, { params });
    return res.data;
};

export const requestDeleteContact = async (id) => {
    const res = await request.delete(API_PATHS.contacts.byId(id));
    return res.data;
};

export const requestUpdateContact = async (id, data) => {
    const res = await request.patch(API_PATHS.contacts.byId(id), data);
    return res.data;
};

export const requestRestoreContact = async (id) => {
    const res = await request.patch(API_PATHS.contacts.restore(id));
    return res.data;
};

export const requestDeleteContactPermanently = async (id) => {
    const res = await request.delete(API_PATHS.contacts.permanentDelete(id));
    return res.data;
};

export const requestCreateContact = async (data) => {
    const res = await request.post(API_PATHS.contacts.collection, data);
    return res.data;
};
