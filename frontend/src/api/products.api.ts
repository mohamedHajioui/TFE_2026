import { apiClient } from './axios.config';
import { toModel, toModels } from './transform.helper';
import {type ProductCategory, ProductModel} from "@/models/product.model.ts";


export interface ProductIngredientData {
    ingredientId: number;
    quantity: number;
    unit?: string;
    isRequired?: boolean;
    extraPrice?: number;
}

export interface CreateProductData {
    name: string;
    category: ProductCategory;
    description?: string;
    basePrice: number;
    imageUrl?: string;
    isActive?: boolean;
    isCustomizable?: boolean;
    ingredients?: ProductIngredientData[];
}

export type UpdateProductData = Partial<CreateProductData>;

export interface QueryProductsParams {
    category?: ProductCategory;
    isActive?: boolean;
    isCustomizable?: boolean;
    search?: string;
}

export const productsApi = {
    /**
     * Liste tous les produits (public)
     */
    findAll: async (params?: QueryProductsParams): Promise<ProductModel[]> => {
        const response = await apiClient.get('/products/list', { params });
        return toModels(ProductModel, response.data);
    },

    /**
     * Produits par catégorie (public)
     */
    findByCategory: async (category: ProductCategory): Promise<ProductModel[]> => {
        const response = await apiClient.get(`/products/category/${category}`);
        return toModels(ProductModel, response.data);
    },

    /**
     * Vérifier la disponibilité d'un produit (public)
     */
    checkAvailability: async (id: number): Promise<{ available: boolean; productName: string }> => {
        const response = await apiClient.get(`/products/${id}/check-availability`);
        return response.data;
    },

    /**
     * Détail d'un produit (public)
     */
    findOne: async (id: number): Promise<ProductModel> => {
        const response = await apiClient.get(`/products/${id}`);
        return toModel(ProductModel, response.data);
    },

    /**
     * Créer un produit (ADMIN/EMPLOYEE)
     */
    create: async (data: CreateProductData): Promise<ProductModel> => {
        const response = await apiClient.post('/products/create', data);
        return toModel(ProductModel, response.data);
    },

    /**
     * Modifier un produit (ADMIN/EMPLOYEE)
     */
    update: async (id: number, data: UpdateProductData): Promise<ProductModel> => {
        const response = await apiClient.put(`/products/${id}/update`, data);
        return toModel(ProductModel, response.data);
    },

    /**
     * Activer/Désactiver un produit (ADMIN/EMPLOYEE)
     */
    toggleActive: async (id: number): Promise<ProductModel> => {
        const response = await apiClient.put(`/products/${id}/toggle`);
        return toModel(ProductModel, response.data);
    },

    /**
     * Supprimer un produit (ADMIN)
     */
    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/products/${id}/delete`);
    },
};