import {useEffect, useState} from 'react';
import {Clock, Truck, Store, ShoppingBag, ChevronRight, CheckCheck} from 'lucide-react';
import {DashboardLayout} from '@/components/layouts/DashboardLayout';
import {ordersApi, type KitchenSlot} from '@/api/orders.api';
import {OrderStatus, OrderType} from '@/models/order.model';
import {getApiErrorMessage} from '@/utils/validation';
import styles from './kitchen.module.css';

const STATUS_STYLE: Record<string, { cls: string; label: string }> = {
    [OrderStatus.CONFIRMED]: {cls: styles.statusConfirmed, label: 'À préparer'},
    [OrderStatus.IN_PREPARATION]: {cls: styles.statusPrep, label: 'En cours'},
    [OrderStatus.READY]: {cls: styles.statusReady, label: 'Prête'},
    [OrderStatus.IN_DELIVERY]: {cls: styles.statusDelivery, label: 'En livraison'},
    [OrderStatus.COMPLETED]: {cls: styles.statusDone, label: 'Terminée'},
};

/** Transitions possibles depuis l'écran cuisine */
function nextActions(status: OrderStatus, type: OrderType): { label: string; next: OrderStatus; primary: boolean }[] {
    switch (status) {
        case OrderStatus.CONFIRMED:
            return [{label: 'Commencer', next: OrderStatus.IN_PREPARATION, primary: true}];
        case OrderStatus.IN_PREPARATION:
            return [{label: 'Marquer prête', next: OrderStatus.READY, primary: true}];
        case OrderStatus.READY:
            if (type === OrderType.DELIVERY) {
                return [{label: 'En livraison', next: OrderStatus.IN_DELIVERY, primary: true}];
            }
            return [{label: 'Servie / Terminée', next: OrderStatus.COMPLETED, primary: true}];
        case OrderStatus.IN_DELIVERY:
            return [{label: 'Livrée', next: OrderStatus.COMPLETED, primary: true}];
        default:
            return [];
    }
}

export default function DashboardKitchen() {
    const [date, setDate] = useState(() =>
        new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Brussels'}).format(new Date()),
    );
    const [slots, setSlots] = useState<KitchenSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
    const [updateError, setUpdateError] = useState<Record<number, string>>({});

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
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [date]);

    const handleStatusChange = async (orderId: number, nextStatus: OrderStatus) => {
        if (updatingIds.has(orderId)) return;

        // Mise à jour optimiste
        setSlots(prev => prev.map(slot => ({
            ...slot,
            orders: slot.orders.map(o =>
                o.id === orderId ? Object.assign(Object.create(Object.getPrototypeOf(o)), o, {status: nextStatus}) : o,
            ),
        })) as KitchenSlot[]);
        setUpdatingIds(prev => new Set(prev).add(orderId));
        setUpdateError(prev => {
            const n = {...prev};
            delete n[orderId];
            return n;
        });

        try {
            await ordersApi.updateStatus(orderId, {status: nextStatus});
        } catch (err) {
            // Rollback : recharger les données réelles
            const data = await ordersApi.getKitchenView(date).catch(() => null);
            if (data) setSlots(data);
            setUpdateError(prev => ({
                ...prev,
                [orderId]: getApiErrorMessage(err, 'Erreur mise à jour'),
            }));
        } finally {
            setUpdatingIds(prev => {
                const n = new Set(prev);
                n.delete(orderId);
                return n;
            });
        }
    };

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
                <div className={styles.loading}>
                    <div className="spinner"/>
                </div>
            )}

            {error && <div className={styles.errorBox}>{error}</div>}

            {!loading && !error && slots.length === 0 && (
                <div className={styles.emptyBox}>
                    Aucune commande à préparer pour cette date.
                </div>
            )}

            {!loading && !error && slots.length > 0 && (
                <>
                    {slots.map((slot) => {
                        const isManualSlot = slot.isManual === true;
                        return (
                            <div key={slot.slotId} className={styles.slotGroup}>
                                <div className={`${styles.slotHeader} ${isManualSlot ? styles.slotHeaderManual : ''}`}>
                                    {isManualSlot
                                        ? <ShoppingBag size={18} color="#A78BFA"/>
                                        : <Clock size={18} color="var(--sg-amber)"/>
                                    }
                                    <span className={styles.slotTime}>
                                        {isManualSlot ? 'Caisse — Sur place' : `${slot.slotStart} – ${slot.slotEnd}`}
                                    </span>
                                    <span className={styles.slotCount}>
                                        {slot.orders.length} commande{slot.orders.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className={styles.orderCards}>
                                    {slot.orders.map((order: any) => {
                                        const statusInfo = STATUS_STYLE[order.status] ?? {cls: '', label: order.status};
                                        const isManualOrder = order.internalNote?.startsWith('Commande manuelle');
                                        const actions = nextActions(order.status, order.type);
                                        const isUpdating = updatingIds.has(order.id);
                                        const orderErr = updateError[order.id];
                                        const isDone = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;

                                        return (
                                            <div
                                                key={order.id}
                                                className={`${styles.orderCard} ${isManualOrder ? styles.orderCardManual : ''} ${isDone ? styles.orderCardDone : ''}`}
                                            >
                                                <div className={styles.orderTop}>
                                                    <span className={styles.orderNumber}>
                                                        #{order.orderNumber}
                                                    </span>
                                                    <span className={`${styles.statusBadge} ${statusInfo.cls}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                                <div className={styles.orderType}>
                                                    {isManualOrder
                                                        ? <><ShoppingBag size={13}/> Caisse</>
                                                        : order.type === OrderType.DELIVERY
                                                            ? <><Truck size={13}/> Livraison</>
                                                            : <><Store size={13}/> En ligne</>
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
                                                {orderErr && (
                                                    <div className={styles.orderErrBox}>{orderErr}</div>
                                                )}
                                                {actions.length > 0 && (
                                                    <div className={styles.actions}>
                                                        {actions.map(({label, next, primary}) => (
                                                            <button
                                                                key={next}
                                                                className={`${styles.actionBtn} ${primary ? styles.actionBtnPrimary : styles.actionBtnSecondary}`}
                                                                onClick={() => handleStatusChange(order.id, next)}
                                                                disabled={isUpdating}
                                                            >
                                                                {isUpdating
                                                                    ? <span className={styles.btnSpinner}/>
                                                                    : next === OrderStatus.COMPLETED
                                                                        ? <CheckCheck size={14}/>
                                                                        : <ChevronRight size={14}/>
                                                                }
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </DashboardLayout>
    );
}
