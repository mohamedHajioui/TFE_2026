import { useState, useEffect, useCallback, useRef } from 'react';
import { ordersApi, type QueryOrdersParams } from '../api/orders.api';
import type { OrderModel } from '@/models/order.model';

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
 * Toutes les commandes avec filtres (ADMIN/EMPLOYEE).
 *
 * @param params  - Filtres (status, type, paymentStatus, date, userId)
 * @param polling - Intervalle en ms pour le rafraîchissement automatique.
 *                  Par défaut 30 000 ms (30s). Passer 0 pour désactiver.
 *
 * Quand une nouvelle commande est détectée, `hasNewOrders` passe à `true`
 * et `newOrdersCount` indique le nombre de nouvelles commandes depuis le
 * dernier chargement. Appeler `refetch()` remet ces compteurs à 0.
 */
export function useOrders(params?: QueryOrdersParams, polling = 30_000) {
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasNewOrders, setHasNewOrders] = useState(false);
    const [newOrdersCount, setNewOrdersCount] = useState(0);

    const knownIds = useRef<Set<number>>(new Set());
    const initialized = useRef(false);

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) {
            setIsLoading(true);
            setError(null);
        }
        try {
            const data = await ordersApi.findAll(params);

            if (!initialized.current) {
                data.forEach(o => knownIds.current.add(o.id));
                initialized.current = true;
                setOrders(data);
                return;
            }

            const newIds = data.filter(o => !knownIds.current.has(o.id));
            if (newIds.length > 0) {
                newIds.forEach(o => knownIds.current.add(o.id));
                setHasNewOrders(true);
                setNewOrdersCount(prev => prev + newIds.length);
            }

            setOrders(data);
        } catch {
            if (!silent) setError('Impossible de charger les commandes');
        } finally {
            if (!silent) setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params)]);

    useEffect(() => {
        fetchOrders(false);
    }, [fetchOrders]);

    useEffect(() => {
        if (!polling) return;
        const interval = setInterval(() => fetchOrders(true), polling);
        return () => clearInterval(interval);
    }, [fetchOrders, polling]);

    const refetch = useCallback(() => {
        setHasNewOrders(false);
        setNewOrdersCount(0);
        fetchOrders(false);
    }, [fetchOrders]);

    return { orders, isLoading, error, refetch, hasNewOrders, newOrdersCount };
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