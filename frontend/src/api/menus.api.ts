import { apiClient } from './axios.config';
import { toModel, toModels } from './transform.helper';
import {type MenuConfiguration, MenuModel} from "../models/menu.model.ts";

export interface CreateMenuData {
    name: string;
    description?: string;
    price: number;
    productIds: number[];
    configuration: MenuConfiguration;
    availableFrom?: string;
    availableTo?: string;
    isActive?: boolean;
}

export type UpdateMenuData = Partial<CreateMenuData>;

export interface QueryMenusParams {
    isActive?: boolean;
    availableNow?: boolean;
    date?: string;
    search?: string;
}

export interface MenuSavings {
    menuPrice: number;
    totalProductsPrice: number;
    savings: number;
    savingsPercent: number;
}

export const menusApi = {

    findAll: async (params?: QueryMenusParams): Promise<MenuModel[]> => {
        const response = await apiClient.get('/menus/list', { params });
        return toModels(MenuModel, response.data);
    },


    getActiveMenus: async (): Promise<MenuModel[]> => {
        const response = await apiClient.get('/menus/active');
        return toModels(MenuModel, response.data);
    },

    calculateSavings: async (id: number): Promise<MenuSavings> => {
        const response = await apiClient.get(`/menus/${id}/savings`);
        return response.data;
    },

    checkAvailability: async (id: number, date: string): Promise<{ available: boolean }> => {
        const response = await apiClient.get(`/menus/${id}/available/${date}`);
        return response.data;
    },


    findOne: async (id: number): Promise<MenuModel> => {
        const response = await apiClient.get(`/menus/${id}`);
        return toModel(MenuModel, response.data);
    },


    create: async (data: CreateMenuData): Promise<MenuModel> => {
        const response = await apiClient.post('/menus/create', data);
        return toModel(MenuModel, response.data);
    },


    update: async (id: number, data: UpdateMenuData): Promise<MenuModel> => {
        const response = await apiClient.put(`/menus/${id}/update`, data);
        return toModel(MenuModel, response.data);
    },

    toggleActive: async (id: number): Promise<MenuModel> => {
        const response = await apiClient.put(`/menus/${id}/toggle`);
        return toModel(MenuModel, response.data);
    },


    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/menus/${id}/delete`);
    },
};