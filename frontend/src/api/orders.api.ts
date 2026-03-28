import { apiClient } from './axios.config';
import { toModel, toModels } from './transform.helper';
import { OrderModel, OrderStatus, OrderType, PaymentStatus } from '../models';
import type {ProductCustomization} from '../models/order.model';

export interface CreateOrderItemData {
    productId: number;
    quantity: number;
    customization?: ProductCustomization;
    specialInstructions?: string;
}

export interface CreateOrderData {
    type: OrderType;
    timeSlotId: number;
    deliveryAddressId?: number; // Requis si type = DELIVERY
    items: CreateOrderItemData[];
    customerNote?: string;
}

export interface UpdateOrderStatusData {
    status: OrderStatus;
    internalNote?: string;
}

export interface QueryOrdersParams {
    status?: OrderStatus;
    type?: OrderType;
    paymentStatus?: PaymentStatus;
    date?: string;
    userId?: number;
}

export interface OrderStatistics {
    totalOrders: number;
    pendingOrders: number;
    completedToday: number;
    revenueToday: number;
}

export const ordersApi = {
    /**
     * Créer une commande (authentifié)
     */
    create: async (data: CreateOrderData): Promise<OrderModel> => {
        const response = await apiClient.post('/orders/create', data);
        return toModel(OrderModel, response.data);
    },

    /**
     * Mes commandes (authentifié)
     */
    getMyOrders: async (): Promise<OrderModel[]> => {
        const response = await apiClient.get('/orders/my-orders');
        return toModels(OrderModel, response.data);
    },

    /**
     * Détail d'une commande (authentifié — vérifié côté serveur)
     */
    findOne: async (id: number): Promise<OrderModel> => {
        const response = await apiClient.get(`/orders/${id}`);
        return toModel(OrderModel, response.data);
    },

    /**
     * Liste toutes les commandes avec filtres (ADMIN/EMPLOYEE)
     */
    findAll: async (params?: QueryOrdersParams): Promise<OrderModel[]> => {
        const response = await apiClient.get('/orders/list', { params });
        return toModels(OrderModel, response.data);
    },

    /**
     * Changer le statut d'une commande (ADMIN/EMPLOYEE)
     */
    updateStatus: async (id: number, data: UpdateOrderStatusData): Promise<OrderModel> => {
        const response = await apiClient.put(`/orders/${id}/status`, data);
        return toModel(OrderModel, response.data);
    },

    /**
     * Annuler une commande (authentifié)
     */
    cancel: async (id: number): Promise<OrderModel> => {
        const response = await apiClient.put(`/orders/${id}/cancel`);
        return toModel(OrderModel, response.data);
    },

    /**
     * Statistiques (ADMIN)
     */
    getStatistics: async (): Promise<OrderStatistics> => {
        const response = await apiClient.get('/orders/statistics');
        return response.data;
    },
};