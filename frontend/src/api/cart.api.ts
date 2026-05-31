import { apiClient } from './axios.config';
import type { ProductCustomization, MenuChoices } from '../models/order.model';

/**
 * Représentation brute d'un item de panier retourné par l'API.
 * On ne transforme PAS en class-transformer ici car le CartContext
 * reconstruit ses propres CartProductItem / CartMenuItem à partir de ces données.
 */
export interface CartItemResponse {
    id: number;
    itemType: 'product' | 'menu';
    product: any | null;
    menu: any | null;
    quantity: number;
    customization: ProductCustomization | null;
    menuChoices: MenuChoices | null;
    specialInstructions: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AddCartItemData {
    itemType: 'product' | 'menu';
    productId?: number;
    menuId?: number;
    quantity: number;
    customization?: ProductCustomization;
    menuChoices?: MenuChoices;
    specialInstructions?: string;
}

export interface SyncCartData {
    items: AddCartItemData[];
}

export const cartApi = {
    /** Récupérer le panier */
    getCart: async (): Promise<CartItemResponse[]> => {
        const response = await apiClient.get('/cart');
        return response.data;
    },

    /** Ajouter un item */
    addItem: async (data: AddCartItemData): Promise<CartItemResponse[]> => {
        const response = await apiClient.post('/cart/items', data);
        return response.data;
    },

    /** Modifier la quantité d'un item */
    updateQuantity: async (itemId: number, quantity: number): Promise<CartItemResponse[]> => {
        const response = await apiClient.put(`/cart/items/${itemId}`, { quantity });
        return response.data;
    },

    /** Supprimer un item */
    removeItem: async (itemId: number): Promise<CartItemResponse[]> => {
        const response = await apiClient.delete(`/cart/items/${itemId}`);
        return response.data;
    },

    /** Vider le panier */
    clearCart: async (): Promise<void> => {
        await apiClient.delete('/cart');
    },

    /** Synchroniser le panier local au login */
    syncCart: async (data: SyncCartData): Promise<CartItemResponse[]> => {
        const response = await apiClient.post('/cart/sync', data);
        return response.data;
    },
};
