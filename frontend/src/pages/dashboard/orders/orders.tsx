import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useOrders } from '@/hooks/useOrders';
import { ordersApi } from '@/api/orders.api';
import { OrderModel, OrderStatus, OrderType, PaymentStatus } from '@/models/order.model';
import { formatPrice } from '@/utils/format';
import {
    RefreshCw, Truck, Store, ChevronDown, ChevronUp,
    User, Clock, Bell, Check,
} from 'lucide-react';
import styles from './orders.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'En attente',
    [OrderStatus.CONFIRMED]: 'Confirmée',
    [OrderStatus.IN_PREPARATION]: 'En préparation',
    [OrderStatus.READY]: 'Prête',
    [OrderStatus.IN_DELIVERY]: 'En livraison',
    [OrderStatus.COMPLETED]: 'Terminée',
    [OrderStatus.CANCELLED]: 'Annulée',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: '#F59E0B',
    [OrderStatus.CONFIRMED]: '#3B82F6',
    [OrderStatus.IN_PREPARATION]: '#8B5CF6',
    [OrderStatus.READY]: '#10B981',
    [OrderStatus.IN_DELIVERY]: '#06B6D4',
    [OrderStatus.COMPLETED]: '#22C55E',
    [OrderStatus.CANCELLED]: '#EF4444',
};

const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
    [OrderStatus.CONFIRMED]: [OrderStatus.IN_PREPARATION],
    [OrderStatus.IN_PREPARATION]: [OrderStatus.READY],
    [OrderStatus.READY]: [OrderStatus.IN_DELIVERY, OrderStatus.COMPLETED],
    [OrderStatus.IN_DELIVERY]: [OrderStatus.COMPLETED],
};

export default function AdminOrders() {
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<OrderType | ''>('');
    const [dateFilter, setDateFilter]  = useState('');

    const params = {
        paymentStatus: PaymentStatus.PAID,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
    };

    const { orders, isLoading, error, refetch, hasNewOrders, newOrdersCount } =
        useOrders(params, 30_000);

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div>
                    <div className="section-header">Commandes</div>
                    <p className={styles.headerSub}>
                        Commandes payées · rafraîchissement automatique toutes les 30 s
                    </p>
                </div>
                <button className={styles.refreshBtn} onClick={refetch} title="Rafraîchir">
                    <RefreshCw size={15} />
                    Actualiser
                </button>
            </div>

            {hasNewOrders && (
                <button className={styles.newOrdersBanner} onClick={refetch}>
                    <Bell size={16} />
                    {newOrdersCount} nouvelle{newOrdersCount > 1 ? 's' : ''} commande{newOrdersCount > 1 ? 's' : ''} — cliquez pour afficher
                </button>
            )}

            <div className={styles.filters}>
                <select
                    className={styles.select}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as OrderStatus | '')}
                >
                    <option value="">Tous les statuts</option>
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>

                <select
                    className={styles.select}
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value as OrderType | '')}
                >
                    <option value="">Tous les types</option>
                    <option value={OrderType.PICKUP}>À emporter</option>
                    <option value={OrderType.DELIVERY}>Livraison</option>
                </select>

                <input
                    type="date"
                    className={styles.dateInput}
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                />

                {(statusFilter || typeFilter || dateFilter) && (
                    <button
                        className={styles.clearFiltersBtn}
                        onClick={() => { setStatusFilter(''); setTypeFilter(''); setDateFilter(''); }}
                    >
                        Effacer les filtres
                    </button>
                )}
            </div>

            {isLoading && (
                <div className={styles.loading}><div className="spinner" /></div>
            )}

            {error && (
                <div className={styles.errorBox}>{error}</div>
            )}

            {!isLoading && !error && orders.length === 0 && (
                <div className={styles.emptyBox}>
                    <p className={styles.emptyTitle}>Aucune commande</p>
                    <p className={styles.emptyText}>
                        {statusFilter || typeFilter || dateFilter
                            ? 'Aucune commande ne correspond aux filtres sélectionnés.'
                            : 'Les commandes payées apparaîtront ici.'}
                    </p>
                </div>
            )}

            {!isLoading && orders.length > 0 && (
                <div className={styles.orderList}>
                    <div className={styles.count}>
                        {orders.length} commande{orders.length > 1 ? 's' : ''}
                    </div>
                    {orders.map(order => (
                        <OrderCard key={order.id} order={order} onRefetch={refetch} />
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}

function OrderCard({ order, onRefetch }: { order: OrderModel; onRefetch: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [showNote, setShowNote] = useState(false);

    const nextStatuses = NEXT_STATUSES[order.status] ?? [];

    const handleStatusChange = async (newStatus: OrderStatus) => {
        setUpdating(true);
        try {
            await ordersApi.updateStatus(order.id, {
                status: newStatus,
                internalNote: noteInput || undefined,
            });
            onRefetch();
            setNoteInput('');
            setShowNote(false);
        } catch {
            alert('Erreur lors du changement de statut');
        } finally {
            setUpdating(false);
        }
    };

    const clientLabel =
        order.guestEmail ??
        order.user?.displayName ??
        order.user?.email ??
        'Invité';

    const slotLabel = order.timeSlot
        ? `${order.timeSlot.date} · ${order.timeSlot.startTime}–${order.timeSlot.endTime}`
        : null;

    return (
        <div className={`card-dark ${styles.card}`}>
            <div className={styles.cardHeader}>
                <div className={styles.cardMeta}>
                    <span className={styles.orderNumber}>{order.orderNumber}</span>
                    <span
                        className={styles.statusBadge}
                        style={{ background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] }}
                    >
                        {STATUS_LABELS[order.status]}
                    </span>
                    <span className={styles.typeBadge}>
                        {order.type === OrderType.DELIVERY
                            ? <><Truck size={10} /> Livraison</>
                            : <><Store size={10} /> À emporter</>}
                    </span>
                </div>

                <div className={styles.cardRight}>
                    <span className={styles.total}>{formatPrice(order.total)}</span>
                    <button
                        className={styles.expandBtn}
                        onClick={() => setExpanded(p => !p)}
                        aria-label={expanded ? 'Réduire' : 'Développer'}
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            <div className={styles.cardInfo}>
                <span className={styles.infoItem}>
                    <User size={12} /> {clientLabel}
                </span>
                {slotLabel && (
                    <span className={styles.infoItem}>
                        <Clock size={12} /> {slotLabel}
                    </span>
                )}
                <span className={styles.infoDate}>
                    {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                        })
                        : '—'
                    }
                </span>
            </div>

            {expanded && (
                <div className={styles.cardBody}>
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Articles</div>
                        {order.items.map((item, i) => {
                            const name = item.menu?.name ?? item.product?.name ?? `Article #${item.id}`;
                            return (
                                <div key={i} className={styles.itemRow}>
                                    <span>{item.quantity}× {name}</span>
                                    <span>{formatPrice(item.totalPrice)}</span>
                                </div>
                            );
                        })}
                        {Number(order.deliveryFee) > 0 && (
                            <div className={`${styles.itemRow} ${styles.itemRowFee}`}>
                                <span>Frais de livraison</span>
                                <span>{formatPrice(order.deliveryFee)}</span>
                            </div>
                        )}
                        <div className={`${styles.itemRow} ${styles.itemRowTotal}`}>
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                        </div>
                    </div>

                    {order.type === OrderType.DELIVERY && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>Adresse de livraison</div>
                            <div className={styles.addressText}>
                                {order.guestStreet
                                    ? `${order.guestStreet} ${order.guestNumber ?? ''}, ${order.guestPostalCode ?? ''} ${order.guestCity ?? ''}`
                                    : order.deliveryAddress
                                        ? `${order.deliveryAddress.street} ${order.deliveryAddress.number}, ${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}`
                                        : '—'
                                }
                            </div>
                        </div>
                    )}

                    {order.customerNote && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>Note client</div>
                            <div className={styles.noteText}>{order.customerNote}</div>
                        </div>
                    )}

                    {nextStatuses.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>Changer le statut</div>
                            <div className={styles.actions}>
                                {nextStatuses.map(s => (
                                    <button
                                        key={s}
                                        className={styles.actionBtn}
                                        onClick={() => handleStatusChange(s)}
                                        disabled={updating}
                                    >
                                        <Check size={13} />
                                        {STATUS_LABELS[s]}
                                    </button>
                                ))}
                                <button
                                    className={styles.noteToggleBtn}
                                    onClick={() => setShowNote(p => !p)}
                                >
                                    + Note interne
                                </button>
                            </div>
                            {showNote && (
                                <input
                                    className={styles.noteInput}
                                    placeholder="Note interne (optionnelle)..."
                                    value={noteInput}
                                    onChange={e => setNoteInput(e.target.value)}
                                />
                            )}
                        </div>
                    )}

                    {order.status === OrderStatus.COMPLETED && (
                        <div className={styles.completedBadge}>
                            <Check size={14} /> Commande terminée
                        </div>
                    )}
                    {order.status === OrderStatus.CANCELLED && (
                        <div className={styles.cancelledBadge}>
                            Commande annulée
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}