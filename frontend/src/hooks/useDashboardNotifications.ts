import { useEffect, useRef, useState, useCallback } from 'react';
import { ordersApi } from '@/api/orders.api';
import { PaymentStatus } from '@/models/order.model';

export interface AdminNotification {
    id: number;
    orderNumber: string;
    total: number;
    type: 'PICKUP' | 'DELIVERY';
    client: string;
    seenAt: null;
}

/**
 * Hook de notifications admin.
 *
 * Toutes les 30 secondes, il interroge la liste des commandes payées.
 * Si de nouvelles commandes PAID sont apparues depuis le dernier check,
 * elles sont ajoutées aux notifications non lues.
 *
 * Usage :
 *   const { newCount, notifications, markAllRead } = useAdminNotifications();
 */
export function useAdminNotifications() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [newCount, setNewCount] = useState(0);
    const knownIds = useRef<Set<number>>(new Set());
    const initialized = useRef(false);

    const fetchOrders = useCallback(async () => {
        try {
            const orders = await ordersApi.findAll({ paymentStatus: PaymentStatus.PAID });

            if (!initialized.current) {
                orders.forEach((o) => knownIds.current.add(o.id));
                initialized.current = true;
                return;
            }

            const newOrders = orders.filter((o) => !knownIds.current.has(o.id));
            if (newOrders.length === 0) return;

            newOrders.forEach((o) => knownIds.current.add(o.id));

            const newNotifs: AdminNotification[] = newOrders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                total: Number(o.total),
                type: o.type as 'PICKUP' | 'DELIVERY',
                client:
                    (o as unknown as { guestEmail?: string }).guestEmail ??
                    o.user?.displayName ??
                    o.user?.email ??
                    'Invité',
                seenAt: null,
            }));

            setNotifications((prev) => [...newNotifs, ...prev]);
            setNewCount((prev) => prev + newNotifs.length);
        } catch {
            // silencieux — pas de console.error pour ne pas spammer
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30_000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const markAllRead = useCallback(() => {
        setNewCount(0);
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setNewCount(0);
    }, []);

    return { notifications, newCount, markAllRead, clearNotifications };
}