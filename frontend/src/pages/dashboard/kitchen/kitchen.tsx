import { useEffect, useState } from 'react';
import { Clock, Truck, Store } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ordersApi, type KitchenSlot } from '@/api/orders.api';
import { OrderStatus, OrderType } from '@/models/order.model';
import { getApiErrorMessage } from '@/utils/validation';
import styles from './kitchen.module.css';

const STATUS_STYLE: Record<string, { cls: string; label: string }> = {
    [OrderStatus.CONFIRMED]: { cls: styles.statusConfirmed, label: 'À préparer' },
    [OrderStatus.IN_PREPARATION]: { cls: styles.statusPrep, label: 'En cours' },
    [OrderStatus.READY]: { cls: styles.statusReady, label: 'Prête' },
};

export default function DashboardKitchen() {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState<KitchenSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        const load = async () => {
            try {
                const data = await ordersApi.getKitchenView(date);
                if (!cancelled) setSlots(data);
            } catch (err) {
                if (!cancelled) setError(getApiErrorMessage(err, 'Impossible de charger la vue cuisine'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();

        const interval = setInterval(load, 30_000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [date]);


    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <div className="section-header">Vue Cuisine</div>
                    <p className={styles.headerSub}>
                        Préparations groupées par créneau horaire · rafraîchissement auto 30 s
                    </p>
                </div>
                <input
                    type="date"
                    className={styles.dateInput}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            {loading && (
                <div className={styles.loading}><div className="spinner" /></div>
            )}

            {error && <div className={styles.errorBox}>{error}</div>}

            {!loading && !error && slots.length === 0 && (
                <div className={styles.emptyBox}>
                    Aucune commande à préparer pour cette date.
                </div>
            )}

            {!loading && !error && slots.length > 0 && (
                <>
                    {slots.map((slot) => (
                        <div key={slot.slotId} className={styles.slotGroup}>
                            <div className={styles.slotHeader}>
                                <Clock size={18} color="var(--sg-amber)" />
                                <span className={styles.slotTime}>
                                    {slot.slotStart} – {slot.slotEnd}
                                </span>
                                <span className={styles.slotCount}>
                                    {slot.orders.length} commande{slot.orders.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className={styles.orderCards}>
                                {slot.orders.map((order: any) => {
                                    const statusInfo = STATUS_STYLE[order.status] ?? { cls: '', label: order.status };
                                    return (
                                        <div key={order.id} className={styles.orderCard}>
                                            <div className={styles.orderTop}>
                                                <span className={styles.orderNumber}>
                                                    #{order.orderNumber}
                                                </span>
                                                <span className={`${styles.statusBadge} ${statusInfo.cls}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <div className={styles.orderType}>
                                                {order.type === OrderType.DELIVERY
                                                    ? <><Truck size={13} /> Livraison</>
                                                    : <><Store size={13} /> À emporter</>
                                                }
                                            </div>
                                            <div className={styles.itemsList}>
                                                {(order.items ?? []).map((item: any) => (
                                                    <div key={item.id} className={styles.itemRow}>
                                                        <span className={styles.itemQty}>{item.quantity}×</span>
                                                        <span className={styles.itemName}>
                                                            {item.product?.name ?? item.menu?.name ?? 'Produit'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            {order.customerNote && (
                                                <div className={styles.orderNote}>
                                                    Note : {order.customerNote}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </DashboardLayout>
    );
}
