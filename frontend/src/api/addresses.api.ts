import { apiClient } from './axios.config';
import { toModel, toModels } from './transform.helper';
import {AddressModel} from "@/models/address.model.ts";

export interface CreateAddressData {
    street: string;
    number: string;
    box?: string;
    postalCode: string;
    city: string;
    country?: string;
    complement?: string;
    label?: string;
    lat?: number;
    lng?: number;
}

export type UpdateAddressData = Partial<CreateAddressData>;

export const addressesApi = {
    /**
     * Mes adresses
     */
    getMyAddresses: async (): Promise<AddressModel[]> => {
        const response = await apiClient.get('/addresses/my-addresses');
        return toModels(AddressModel, response.data);
    },

    /**
     * Mon adresse par défaut
     */
    getDefaultAddress: async (): Promise<AddressModel | null> => {
        const response = await apiClient.get('/addresses/default');
        if (response.data?.message) return null; // Aucune adresse par défaut
        return toModel(AddressModel, response.data);
    },

    /**
     * Détail d'une adresse
     */
    findOne: async (id: number): Promise<AddressModel> => {
        const response = await apiClient.get(`/addresses/${id}`);
        return toModel(AddressModel, response.data);
    },

    /**
     * Créer une adresse
     */
    create: async (data: CreateAddressData): Promise<AddressModel> => {
        const response = await apiClient.post('/addresses/create', data);
        return toModel(AddressModel, response.data);
    },

    /**
     * Modifier une adresse
     */
    update: async (id: number, data: UpdateAddressData): Promise<AddressModel> => {
        const response = await apiClient.put(`/addresses/${id}/update`, data);
        return toModel(AddressModel, response.data);
    },

    /**
     * Définir comme adresse par défaut
     */
    setAsDefault: async (id: number): Promise<AddressModel> => {
        const response = await apiClient.put(`/addresses/${id}/set-default`);
        return toModel(AddressModel, response.data);
    },

    /**
     * Supprimer une adresse
     */
    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/addresses/${id}/delete`);
    },
};