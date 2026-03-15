import { apiClient } from './axios.config';
import { toModel, toModels } from './transform.helper';
import {UserModel, type UserRole} from "../models/user.model.ts";


export interface UpdateProfileData {
    displayName?: string;
    phoneNumber?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export interface QueryUsersParams {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
}

export const usersApi = {

    getMyProfile: async (): Promise<UserModel> => {
        const response = await apiClient.get('/users/me');
        return toModel(UserModel, response.data);
    },


    updateMyProfile: async (data: UpdateProfileData): Promise<UserModel> => {
        const response = await apiClient.put('/users/me/update', data);
        return toModel(UserModel, response.data);
    },


    changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
        const response = await apiClient.put('/users/me/change-password', data);
        return response.data;
    },

    // ADMIN--------------------------------------------------------------------------------------------


    findAll: async (params?: QueryUsersParams): Promise<UserModel[]> => {
        const response = await apiClient.get('/users/list', { params });
        return toModels(UserModel, response.data);
    },


    findOne: async (id: number): Promise<UserModel> => {
        const response = await apiClient.get(`/users/${id}`);
        return toModel(UserModel, response.data);
    },


    toggleActive: async (id: number): Promise<UserModel> => {
        const response = await apiClient.put(`/users/${id}/toggle-active`);
        return toModel(UserModel, response.data);
    },


    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/users/${id}/delete`);
    },
};