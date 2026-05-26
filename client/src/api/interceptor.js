import axios from 'axios';
import { API_PATHS } from '../constants/api';
import { resolveApiBaseUrl } from '../utils/apiBaseUrl';
import {
    clearBrowserAuthState,
    getBrowserAccessToken,
    hasAuthSessionMarker,
    markBrowserAuthState,
    redirectToLoginIfNeeded,
} from '../utils/authSession';

const apiBaseUrl = resolveApiBaseUrl();

export const request = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
});

export const publicRequest = axios.create({
    baseURL: apiBaseUrl,
});

const refreshClient = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
});

request.interceptors.request.use((config) => {
    const accessToken = getBrowserAccessToken();
    if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

let isRefreshing = false;
let failedRequestsQueue = [];

const flushFailedRequestsQueue = (error) => {
    failedRequestsQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });

    failedRequestsQueue = [];
};

request.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest?._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (!hasAuthSessionMarker()) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    resolve: () => resolve(request(originalRequest)),
                    reject,
                });
            });
        }

        isRefreshing = true;

        try {
            const refreshResponse = await refreshClient.post(API_PATHS.auth.refresh);
            markBrowserAuthState(refreshResponse.data?.metadata?.token);
            flushFailedRequestsQueue();
            return request(originalRequest);
        } catch (refreshError) {
            clearBrowserAuthState();
            flushFailedRequestsQueue(refreshError);
            redirectToLoginIfNeeded();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);
