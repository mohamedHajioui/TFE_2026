import { apiClient } from './axios.config';
import type {LoginCredentials, RegisterData, AuthResponse} from '@/models/user.model';

export const authApi = {

    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },


    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    },


    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
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