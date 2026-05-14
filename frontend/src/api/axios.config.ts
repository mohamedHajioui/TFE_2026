import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

let isRefreshing = false;

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Ces URLs ne doivent JAMAIS déclencher un refresh ni une redirection
        // - /auth/* : endpoints d'auth eux-mêmes
        // - /users/me : vérification de session au chargement (échec = utilisateur non connecté, c'est normal)
        const isExcluded =
            originalRequest.url?.includes('/auth/') ||
            originalRequest.url?.includes('/users/me');

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isExcluded
        ) {
            if (isRefreshing) return Promise.reject(error);

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                isRefreshing = false;
                return apiClient(originalRequest);
            } catch {
                isRefreshing = false;
                // Ne rediriger que si on n'est pas déjà sur /login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);