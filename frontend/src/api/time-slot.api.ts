import { apiClient } from './axios.config';
import { toModel, toModels } from './transform.helper';
import {TimeSlotModel} from "@/models/time-slot.model.ts";

export interface CreateTimeSlotData {
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:MM
    endTime: string;    // HH:MM
    maxCapacity: number;
    isAvailable?: boolean;
}

export type UpdateTimeSlotData = Partial<CreateTimeSlotData> & {
    currentBookings?: number;
};

export interface QueryTimeSlotsParams {
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    isAvailable?: boolean;
    onlyFull?: boolean;
}

export interface GenerateSlotsData {
    dateFrom: string;
    dateTo: string;
    startTime: string;
    endTime: string;
    slotDuration: number; // en minutes
    maxCapacity: number;
}

export const timeSlotsApi = {
    /**
     * Liste tous les créneaux avec filtres (public)
     */
    findAll: async (params?: QueryTimeSlotsParams): Promise<TimeSlotModel[]> => {
        const response = await apiClient.get('/time-slots/list', { params });
        return toModels(TimeSlotModel, response.data);
    },

    /**
     * Créneaux disponibles pour une date (public)
     */
    getAvailableSlots: async (date: string): Promise<TimeSlotModel[]> => {
        const response = await apiClient.get(`/time-slots/available/${date}`);
        return toModels(TimeSlotModel, response.data);
    },

    /**
     * Vérifier la disponibilité d'un créneau (public)
     */
    checkAvailability: async (id: number): Promise<{
        available: boolean;
        currentBookings: number;
        maxCapacity: number;
    }> => {
        const response = await apiClient.get(`/time-slots/${id}/check-availability`);
        return response.data;
    },

    /**
     * Détail d'un créneau (ADMIN/EMPLOYEE)
     */
    findOne: async (id: number): Promise<TimeSlotModel> => {
        const response = await apiClient.get(`/time-slots/${id}`);
        return toModel(TimeSlotModel, response.data);
    },

    /**
     * Créer un créneau (ADMIN/EMPLOYEE)
     */
    create: async (data: CreateTimeSlotData): Promise<TimeSlotModel> => {
        const response = await apiClient.post('/time-slots/create', data);
        return toModel(TimeSlotModel, response.data);
    },

    /**
     * Générer des créneaux en masse (ADMIN)
     */
    generateSlots: async (data: GenerateSlotsData): Promise<{
        created: number;
        slots: TimeSlotModel[];
    }> => {
        const response = await apiClient.post('/time-slots/generate', data);
        return {
            created: response.data.created,
            slots: toModels(TimeSlotModel, response.data.slots),
        };
    },

    /**
     * Modifier un créneau (ADMIN/EMPLOYEE)
     */
    update: async (id: number, data: UpdateTimeSlotData): Promise<TimeSlotModel> => {
        const response = await apiClient.put(`/time-slots/${id}/update`, data);
        return toModel(TimeSlotModel, response.data);
    },

    /**
     * Supprimer un créneau (ADMIN)
     */
    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/time-slots/${id}/delete`);
    },
};