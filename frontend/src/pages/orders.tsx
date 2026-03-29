import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/ui/appLayouth';
import { useMyOrders } from '@/hooks/useOrders';
import { ordersApi } from '@/api/orders.api';
import { OrderModel, OrderStatus, OrderType } from '@/models/order.model';
import { formatPrice, formatDateTime } from '@/utils/format';

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
    [OrderStatus.PENDING]:        { bg: '#2A2000', color: '#FFA733' },
    [OrderStatus.CONFIRMED]:      { bg: '#001A2A', color: '#60B4FF' },
    [OrderStatus.IN_PREPARATION]: { bg: '#001A0A', color: '#4ADE80' },
    [OrderStatus.READY]:          { bg: '#0A1A00', color: '#86EFAC' },
    [OrderStatus.IN_DELIVERY]:    { bg: '#1A0A00', color: '#FDBA74' },
    [OrderStatus.COMPLETED]:      { bg: '#001A0A', color: '#4ADE80' },
    [OrderStatus.CANCELLED]:      { bg: '#1A0000', color: '#F87171' },
};

export default function Orders() {
    const { orders, isLoading, error, refetch } = useMyOrders();
    const navigate = useNavigate();
    const [reorderingId, setReorderingId] = useState<number | null>(null);

    const handleReorder = async (order: OrderModel) => {
        setReorderingId(order.id);
        try {
            // Recréer la commande avec les mêmes items
            const newOrder = await ordersApi.create({
                type: order.type,
                timeSlotId: order.timeSlot.id, // TODO: idéalement ouvrir un sélecteur de créneau
                deliveryAddressId: order.deliveryAddress?.id,
                items: order.items.map(item => ({
                    productId: item.product!.id,
                    quantity: item.quantity,
                    customization: item.customization ?? undefined,
                    specialInstructions: item.specialInstructions ?? undefined,
                })),
            });
            navigate(`/orders/${newOrder.id}`);
        } catch {
            alert('Impossible de recréer la commande. Veuillez réessayer.');
        } finally {
            setReorderingId(null);
        }
    };

    const handleCancel = async (order: OrderModel) => {
        if (!confirm('Annuler cette commande ?')) return;
        try {
            await ordersApi.cancel(order.id);
            refetch();
        } catch {
            alert('Impossible d\'annuler cette commande.');
        }
    };

    return (
        <AppLayout>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>

                {/* Header */}
                <div style={{ marginBottom: '36px' }}>
                    <div className="section-header" style={{ display: 'inline-block', marginBottom: '12px' }}>
                        Mes commandes
                    </div>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                        Retrouvez l'historique de vos commandes et recommandez en un clic.
                    </p>
                </div>

                {/* Chargement */}
                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                        <div className="spinner" />
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div style={{ background: '#1A0A0A', border: '1px solid #5A1A1A', borderRadius: '8px', padding: '20px', color: '#FF6B6B' }}>
                        {error}
                    </div>
                )}

                {/* Aucune commande */}
                {!isLoading && !error && orders.length === 0 && (
                    <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
                        <p style={{ fontFamily: '"Oswald", sans-serif', fontSize: '1.1rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                            Aucune commande pour l'instant
                        </p>
                        <p style={{ color: '#555', fontSize: '0.85rem', margin: '0 0 24px' }}>
                            Passez votre première commande dès maintenant.
                        </p>
                        <button className="btn-primary" onClick={() => navigate('/')}>
                            Voir la carte
                        </button>
                    </div>
                )}

                {/* Liste des commandes */}
                {!isLoading && !error && orders.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isReordering={reorderingId === order.id}
                                onReorder={handleReorder}
                                onCancel={handleCancel}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

// Carte commande

function OrderCard({ order, isReordering, onReorder, onCancel }: {
    order: OrderModel;
    isReordering: boolean;
    onReorder: (order: OrderModel) => void;
    onCancel: (order: OrderModel) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const statusStyle = STATUS_COLORS[order.status] ?? { bg: '#1A1A1A', color: '#888' };

    return (
        <div className="card-dark" style={{ padding: '20px' }}>

            {/* Header commande */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1rem', color: '#FFF', letterSpacing: '0.04em' }}>
                            {order.orderNumber}
                        </span>
                        <span style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 10px',
                            borderRadius: '2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}>
                            {order.statusLabel}
                        </span>
                        <span style={{ background: '#222', color: '#888', fontSize: '0.72rem', padding: '2px 10px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {order.type === OrderType.DELIVERY ? 'Livraison' : 'Retrait'}
                        </span>
                    </div>
                    <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '4px' }}>
                        {order.createdAt ? formatDateTime(order.createdAt) : ''}
                        {order.timeSlot && (
                            <span style={{ marginLeft: '8px' }}>
                                · Créneau : {order.timeSlot.date} {order.timeSlot.startTime}–{order.timeSlot.endTime}
                            </span>
                        )}
                    </div>
                </div>

                <div className="price-tag" style={{ fontSize: '1.3rem' }}>
                    {formatPrice(order.total)}
                </div>
            </div>

            <div className="divider-orange" style={{ margin: '14px 0' }} />

            {/* Résumé items */}
            <div style={{ color: '#AAA', fontSize: '0.85rem', marginBottom: '14px' }}>
                {order.items.slice(0, expanded ? undefined : 3).map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span>
                            {item.quantity}× {item.label}
                            {item.specialInstructions && (
                                <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: '6px' }}>
                                    ({item.specialInstructions})
                                </span>
                            )}
                        </span>
                        <span style={{ color: '#666' }}>{item.formattedTotalPrice}</span>
                    </div>
                ))}
                {!expanded && order.items.length > 3 && (
                    <button onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', color: '#FF8C00', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 0', fontFamily: '"Nunito", sans-serif' }}>
                        + {order.items.length - 3} article{order.items.length - 3 > 1 ? 's' : ''} de plus
                    </button>
                )}
                {order.deliveryFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#555', borderTop: '1px solid #222', marginTop: '6px' }}>
                        <span>Frais de livraison</span>
                        <span>{formatPrice(order.deliveryFee)}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Recommander — toujours disponible sauf si commande en cours */}
                <button
                    className="btn-primary"
                    disabled={isReordering}
                    onClick={() => onReorder(order)}
                    style={{ opacity: isReordering ? 0.7 : 1 }}
                >
                    {isReordering ? 'En cours...' : 'Commander à nouveau'}
                </button>

                {/* Annuler — seulement si annulable */}
                {order.isCancellable && (
                    <button
                        className="btn-outline"
                        onClick={() => onCancel(order)}
                        style={{ borderColor: '#F87171', color: '#F87171' }}
                    >
                        Annuler
                    </button>
                )}
            </div>
        </div>
    );
}