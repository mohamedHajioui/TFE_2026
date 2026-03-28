import { useState, useEffect, useCallback } from 'react';
import { ordersApi, type QueryOrdersParams } from '../api/orders.api';
import type {OrderModel} from "@/models/order.model.ts";

/**
 * Mes commandes (client connecté)
 */
export function useMyOrders() {
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ordersApi.getMyOrders();
            setOrders(data);
        } catch {
            setError('Impossible de charger vos commandes');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return { orders, isLoading, error, refetch: fetchOrders };
}

/**
 * Toutes les commandes avec filtres (ADMIN/EMPLOYEE)
 */
export function useOrders(params?: QueryOrdersParams) {
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ordersApi.findAll(params);
            setOrders(data);
        } catch {
            setError('Impossible de charger les commandes');
        } finally {
            setIsLoading(false);
        }
    }, [JSON.stringify(params)]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return { orders, isLoading, error, refetch: fetchOrders };
}

/**
 * Détail d'une commande par ID
 */
export function useOrder(id: number) {
    const [order, setOrder] = useState<OrderModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await ordersApi.findOne(id);
                setOrder(data);
            } catch {
                setError('Commande introuvable');
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [id]);

    return { order, isLoading, error };
}