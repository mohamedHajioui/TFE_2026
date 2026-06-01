import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useMyOrders } from '@/hooks/useOrders';
import { ordersApi } from '@/api/orders.api';
import { OrderModel, OrderStatus, OrderType } from '@/models/order.model';
import { formatPrice, formatDateTime } from '@/utils/format';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import styles from './orders.module.css';

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
    [OrderStatus.PENDING]: { bg: '#2A2000', color: '#FFA733' },
    [OrderStatus.CONFIRMED]: { bg: '#001A2A', color: '#60B4FF' },
    [OrderStatus.IN_PREPARATION]: { bg: '#001A0A', color: '#4ADE80' },
    [OrderStatus.READY]: { bg: '#0A1A00', color: '#86EFAC' },
    [OrderStatus.IN_DELIVERY]: { bg: '#1A0A00', color: '#FDBA74' },
    [OrderStatus.COMPLETED]: { bg: '#001A0A', color: '#4ADE80' },
    [OrderStatus.CANCELLED]: { bg: '#1A0000', color: '#F87171' },
};

export default function Orders() {
    const { orders, isLoading, error, refetch } = useMyOrders();
    const navigate = useNavigate();
    const [reorderingId, setReorderingId] = useState<number | null>(null);
    const [cancelTarget, setCancelTarget] = useState<OrderModel | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const handleReorder = async (order: OrderModel) => {
        setReorderingId(order.id);
        try {
            const newOrder = await ordersApi.create({
                type: order.type,
                timeSlotId: order.timeSlot.id,
                deliveryAddressId: order.deliveryAddress?.id,
                items: order.items.map(item => {
                    if (item.itemType === 'menu') {
                        return {
                            itemType: 'menu' as const,
                            menuId: item.menu!.id,
                            menuChoices: item.menuChoices ?? undefined,
                            quantity: item.quantity,
                            specialInstructions: item.specialInstructions ?? undefined,
                        };
                    }
                    return {
                        itemType: 'product' as const,
                        productId: item.product!.id,
                        quantity: item.quantity,
                        customization: item.customization ?? undefined,
                        specialInstructions: item.specialInstructions ?? undefined,
                    };
                }),
            });
            navigate(`/orders/${newOrder.id}`);
        } catch {
            alert('Impossible de recréer la commande. Veuillez réessayer.');
        } finally {
            setReorderingId(null);
        }
    };

    const handleCancelRequest = (order: OrderModel) => {
        setCancelTarget(order);
    };

    const handleCancelConfirm = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await ordersApi.cancel(cancelTarget.id);
            refetch();
            setCancelTarget(null);
        } catch {
            alert('Impossible d\'annuler cette commande.');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className="section-header">Mes commandes</div>
                    <p className={styles.headerSub}>
                        Retrouvez l'historique de vos commandes et recommandez en un clic.
                    </p>
                </div>

                {isLoading && <div className={styles.loading}><div className="spinner" /></div>}

                {error && <div className={styles.errorBox}>{error}</div>}

                {!isLoading && !error && orders.length === 0 && (
                    <div className={styles.emptyBox}>
                        <p className={styles.emptyTitle}>Aucune commande pour l'instant</p>
                        <p className={styles.emptyText}>Passez votre première commande dès maintenant.</p>
                        <button className="btn-primary" onClick={() => navigate('/')}>Voir la carte</button>
                    </div>
                )}

                {!isLoading && !error && orders.length > 0 && (
                    <div className={styles.orderList}>
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isReordering={reorderingId === order.id}
                                onReorder={handleReorder}
                                onCancel={handleCancelRequest}
                            />
                        ))}
                    </div>
                )}
            </div>

            {cancelTarget && (
                <ConfirmModal
                    title="Annuler la commande ?"
                    message={`Vous êtes sur le point d'annuler la commande ${cancelTarget.orderNumber}. Cette action est irréversible.`}
                    confirmLabel="Oui, annuler"
                    cancelLabel="Non, garder"
                    onConfirm={handleCancelConfirm}
                    onClose={() => setCancelTarget(null)}
                    isLoading={cancelling}
                />
            )}
        </AppLayout>
    );
}

function OrderCard({ order, isReordering, onReorder, onCancel }: {
    order: OrderModel;
    isReordering: boolean;
    onReorder: (order: OrderModel) => void;
    onCancel: (order: OrderModel) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const statusStyle = STATUS_COLORS[order.status] ?? { bg: '#1A1A1A', color: '#888' };

    return (
        <div className={`card-dark ${styles.orderCard}`}>
            <div className={styles.orderCardHeader}>
                <div>
                    <div className={styles.orderMeta}>
                        <span className={styles.orderNumber}>{order.orderNumber}</span>
                        <span
                            className={styles.orderStatusBadge}
                            style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                            {order.statusLabel}
                        </span>
                        <span className={styles.orderTypeBadge}>
                            {order.type === OrderType.DELIVERY ? 'Livraison' : 'Retrait'}
                        </span>
                    </div>
                    <div className={styles.orderDate}>
                        {order.createdAt ? formatDateTime(order.createdAt) : ''}
                        {order.timeSlot && (
                            <span> · Créneau : {order.timeSlot.date} {order.timeSlot.startTime}–{order.timeSlot.endTime}</span>
                        )}
                    </div>
                </div>
                <div className="price-tag" style={{ fontSize: '1.3rem' }}>{formatPrice(order.total)}</div>
            </div>

            <div className="divider-orange" />

            <div className={styles.orderItems}>
                {order.items.slice(0, expanded ? undefined : 3).map(item => (
                    <div key={item.id} className={styles.orderItem}>
                        <span>
                            {item.quantity}× {item.label}
                            {item.specialInstructions && (
                                <span className={styles.orderItemNote}>({item.specialInstructions})</span>
                            )}
                        </span>
                        <span>{item.formattedTotalPrice}</span>
                    </div>
                ))}
                {!expanded && order.items.length > 3 && (
                    <button className={styles.showMoreBtn} onClick={() => setExpanded(true)}>
                        + {order.items.length - 3} article{order.items.length - 3 > 1 ? 's' : ''} de plus
                    </button>
                )}
                {order.deliveryFee > 0 && (
                    <div className={styles.deliveryFeeRow}>
                        <span>Frais de livraison</span>
                        <span>{formatPrice(order.deliveryFee)}</span>
                    </div>
                )}
            </div>

            <div className={styles.orderActions}>
                <button
                    className="btn-primary"
                    disabled={isReordering}
                    onClick={() => onReorder(order)}
                    style={{ opacity: isReordering ? 0.7 : 1 }}
                >
                    {isReordering ? 'En cours...' : 'Commander à nouveau'}
                </button>
                {order.isCancellable && (
                    <button className={`btn-outline ${styles.cancelBtn}`} onClick={() => onCancel(order)}>
                        Annuler
                    </button>
                )}
            </div>
        </div>
    );
}