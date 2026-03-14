import { apiClient } from './axios.config';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/auth.types';

export const authApi = {

    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register', data);
        return response.data; // { user: { id, email, displayName, role } }
    },


    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data; // { user: { id, email, displayName, role } }
    },


    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
        window.location.href = '/login';
    },


    refresh: async (): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/refresh');
        return response.data;
    },


    getProfile: async () => {
        const response = await apiClient.get('/users/me');
        return response.data;
    },
};