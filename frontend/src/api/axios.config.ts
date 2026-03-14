import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Instance Axios avec configuration de base
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Envoie automatiquement les cookies httpOnly (accessToken + refreshToken)
});

// Pas d'intercepteur de requête nécessaire :
// Le cookie accessToken est envoyé automatiquement par le navigateur

// Intercepteur pour gérer le refresh automatique du token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si erreur 401 et qu'on n'a pas déjà tenté de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Le refreshToken est automatiquement envoyé via le cookie httpOnly
                // Le backend va set un nouveau accessToken dans un cookie httpOnly
                await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                // Retry la requête originale — le nouveau cookie sera envoyé automatiquement
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Si le refresh échoue, rediriger vers login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);