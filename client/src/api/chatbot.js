import { publicRequest } from './interceptor';
import { API_PATHS } from '../constants/api';

export const requestChatbot = async (data) => {
    const res = await publicRequest.post(API_PATHS.chatbot.replies, data);
    return res.data.metadata ?? res.data;
};
