import { apiClient } from './axios.config';
import { toModel, toModels } from './transform.helper';
import {
    OrderModel,
    OrderStatus,
    OrderType,
    PaymentStatus,
    type MenuChoices,
    type ProductCustomization,
} from '../models/order.model';

/**
 * Un item du panier envoyé au backend.
 * - itemType: 'product' → productId requis + customization optionnelle
 * - itemType: 'menu'    → menuId + menuChoices requis
 */
export interface CreateOrderItemData {
    itemType: 'product' | 'menu';
    productId?: number;
    menuId?: number;
    menuChoices?: MenuChoices;
    quantity: number;
    customization?: ProductCustomization;
    specialInstructions?: string;
}

export interface GuestInfo {
    email: string;
    name: string;
    phone: string;
}

export interface GuestAddress {
    street: string;
    number: string;
    box?: string;
    postalCode: string;
    city: string;
    country?: string;
    complement?: string;
}

export interface CreateOrderData {
    type: OrderType;
    timeSlotId: number;
    /** Si user connecté + DELIVERY */
    deliveryAddressId?: number;
    /** Si invité (pas de user) */
    guest?: GuestInfo;
    /** Si invité + DELIVERY */
    guestAddress?: GuestAddress;
    items: CreateOrderItemData[];
    customerNote?: string;
    /** Coordonnées GPS du client — le backend calcule le prix de livraison */
    customerLat?: number;
    customerLng?: number;
}

export interface CreateManualOrderData {
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

export interface LastGuestAddressData {
    street: string | null;
    number: string | null;
    box: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    complement: string | null;
    name: string | null;
    phone: string | null;
}

export const ordersApi = {
    /** Créer une commande (USER CONNECTÉ) */
    create: async (data: CreateOrderData): Promise<OrderModel> => {
        const response = await apiClient.post('/orders/create', data);
        return toModel(OrderModel, response.data);
    },

    /** Créer une commande en tant qu'INVITÉ (sans compte) */
    createGuest: async (data: CreateOrderData): Promise<OrderModel> => {
        const response = await apiClient.post('/orders/guest/create', data);
        return toModel(OrderModel, response.data);
    },

    /** Retrouver la dernière adresse utilisée par un email invité (préremplissage) */
    getLastGuestAddress: async (email: string): Promise<LastGuestAddressData | null> => {
        const response = await apiClient.get('/orders/guest/last-address', {
            params: { email },
        });
        return response.data;
    },

    getMyOrders: async (): Promise<OrderModel[]> => {
        const response = await apiClient.get('/orders/my-orders');
        return toModels(OrderModel, response.data);
    },

    findOne: async (id: number): Promise<OrderModel> => {
        const response = await apiClient.get(`/orders/${id}`);
        return toModel(OrderModel, response.data);
    },

    findAll: async (params?: QueryOrdersParams): Promise<OrderModel[]> => {
        const response = await apiClient.get('/orders/list', { params });
        return toModels(OrderModel, response.data);
    },

    updateStatus: async (id: number, data: UpdateOrderStatusData): Promise<OrderModel> => {
        const response = await apiClient.put(`/orders/${id}/status`, data);
        return toModel(OrderModel, response.data);
    },

    cancel: async (id: number): Promise<OrderModel> => {
        const response = await apiClient.put(`/orders/${id}/cancel`);
        return toModel(OrderModel, response.data);
    },

    getStatistics: async (): Promise<OrderStatistics> => {
        const response = await apiClient.get('/orders/statistics');
        return response.data;
    },

    /** Créer une commande manuelle (ADMIN/EMPLOYEE — client sur place) */
    createManual: async (data: CreateManualOrderData): Promise<OrderModel> => {
        const response = await apiClient.post('/orders/manual', data);
        return toModel(OrderModel, response.data);
    },
};