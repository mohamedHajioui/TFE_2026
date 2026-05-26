import axios, { type AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

let isRefreshing = false;
let pendingQueue: {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    config: AxiosRequestConfig;
}[] = [];

function processPendingQueue(error: unknown = null) {
    for (const { resolve, reject, config } of pendingQueue) {
        if (error) {
            reject(error);
        } else {
            resolve(apiClient(config));
        }
    }
    pendingQueue = [];
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isExcluded =
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/google') ||
            originalRequest.url?.includes('/users/me');

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isExcluded
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject, config: originalRequest });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true },
                );
                isRefreshing = false;

                processPendingQueue();
                return apiClient(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;

                processPendingQueue(refreshError);
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);
