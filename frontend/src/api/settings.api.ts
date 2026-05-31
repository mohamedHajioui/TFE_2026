import { apiClient } from './axios.config';

export interface SettingModel {
    id: number;
    key: string;
    value: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateSettingData {
    value: string;
    description?: string;
}

export const settingsApi = {
    /** Settings publics lisibles par les clients (DELIVERY_ENABLED, DELIVERY_FEE...) */
    getPublic: async (): Promise<Record<string, string>> => {
        const response = await apiClient.get('/settings/public');
        return response.data;
    },

    /** Liste tous les settings (ADMIN) */
    findAll: async (): Promise<SettingModel[]> => {
        const response = await apiClient.get('/settings/list');
        return response.data;
    },

    findByKey: async (key: string): Promise<SettingModel> => {
        const response = await apiClient.get(`/settings/${key}`);
        return response.data;
    },

    update: async (key: string, data: UpdateSettingData): Promise<SettingModel> => {
        const response = await apiClient.put(`/settings/${key}`, data);
        return response.data;
    },
};