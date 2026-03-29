import { apiClient } from './axios.config';
import { toModel, toModels } from './transform.helper';
import {IngredientCategory, IngredientModel} from "@/models/ingredient.model.ts";


export interface CreateIngredientData {
    name: string;
    category: IngredientCategory;
    currentStock: number;
    minStock: number;
    maxStock: number;
    unit: string;
    costPerUnit?: number;
    isAvailable?: boolean;
}

export type UpdateIngredientData = Partial<CreateIngredientData>;

export interface QueryIngredientsParams {
    category?: IngredientCategory;
    isAvailable?: boolean;
    lowStock?: boolean;
    search?: string;
}

export const ingredientsApi = {
    /**
     * Liste tous les ingrédients (ADMIN/EMPLOYEE)
     */
    findAll: async (params?: QueryIngredientsParams): Promise<IngredientModel[]> => {
        const response = await apiClient.get('/ingredients/list', { params });
        return toModels(IngredientModel, response.data);
    },

    /**
     * Ingrédients en stock faible (ADMIN/EMPLOYEE)
     */
    findLowStock: async (): Promise<IngredientModel[]> => {
        const response = await apiClient.get('/ingredients/low-stock');
        return toModels(IngredientModel, response.data);
    },

    /**
     * Détail d'un ingrédient (ADMIN/EMPLOYEE)
     */
    findOne: async (id: number): Promise<IngredientModel> => {
        const response = await apiClient.get(`/ingredients/${id}`);
        return toModel(IngredientModel, response.data);
    },

    /**
     * Créer un ingrédient (ADMIN/EMPLOYEE)
     */
    create: async (data: CreateIngredientData): Promise<IngredientModel> => {
        const response = await apiClient.post('/ingredients/create', data);
        return toModel(IngredientModel, response.data);
    },

    /**
     * Modifier un ingrédient (ADMIN/EMPLOYEE)
     */
    update: async (id: number, data: UpdateIngredientData): Promise<IngredientModel> => {
        const response = await apiClient.put(`/ingredients/${id}/update`, data);
        return toModel(IngredientModel, response.data);
    },

    /**
     * Ajuster le stock (ADMIN/EMPLOYEE)
     * quantity positif = ajout, négatif = retrait
     */
    adjustStock: async (id: number, quantity: number, reason?: string): Promise<IngredientModel> => {
        const response = await apiClient.put(`/ingredients/${id}/adjust-stock`, {
            quantity,
            reason,
        });
        return toModel(IngredientModel, response.data);
    },

    /**
     * Supprimer un ingrédient (ADMIN)
     */
    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/ingredients/${id}/delete`);
    },
};