import { useNavigate } from 'react-router-dom';
import { useCart, type CartProductItem, type CartMenuItem } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import {AppLayout} from "@/components/ui/appLayouth.tsx";

export default function Cart() {
    const { items, totalItems, subtotal, updateQuantity, removeItem, clearCart } = useCart();
    const navigate = useNavigate();

    const deliveryFee = 3.5; // affiché pour info, calculé côté serveur à la commande

    if (items.length === 0) {
        return (
            <AppLayout>
                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
                    <ShoppingBag size={64} color="#333" style={{ marginBottom: '24px' }} />
                    <p style={{ fontFamily: '"Oswald", sans-serif', fontSize: '1.3rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                        Votre panier est vide
                    </p>
                    <p style={{ color: '#555', fontSize: '0.9rem', margin: '0 0 32px' }}>
                        Ajoutez des menus ou des produits pour commencer.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/')}>
                        Voir la carte
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div style={{ maxWidth: '680px', margin: '0 auto', padding: 'clamp(32px, 6vw, 60px) 16px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div className="section-header" style={{ display: 'inline-block', marginBottom: '8px' }}>
                            Mon panier
                        </div>
                        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
                            {totalItems} article{totalItems > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={clearCart}
                        style={{ background: 'none', border: '1px solid #333', borderRadius: '6px', padding: '6px 14px', color: '#888', fontSize: '0.82rem', cursor: 'pointer', fontFamily: '"Nunito", sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Trash2 size={14} />
                        Vider
                    </button>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {items.map((item, index) => (
                        <CartItemRow
                            key={index}
                            item={item}
                            index={index}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeItem}
                        />
                    ))}
                </div>

                {/* Récap */}
                <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#AAA' }}>
                            <span>Sous-total</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#AAA' }}>
                            <span>Livraison (si applicable)</span>
                            <span>{formatPrice(deliveryFee)}</span>
                        </div>
                        <div className="divider-orange" style={{ margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Total estimé
                            </span>
                            <span className="price-tag" style={{ fontSize: '1.4rem' }}>
                                {formatPrice(subtotal)}
                            </span>
                        </div>
                        <p style={{ color: '#444', fontSize: '0.72rem', margin: 0 }}>
                            Les frais de livraison seront calculés à la confirmation de commande.
                        </p>
                    </div>

                    <button
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '1rem', padding: '13px' }}
                        onClick={() => navigate('/checkout')}
                    >
                        Passer la commande
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}

// Ligne de panier

function CartItemRow({ item, index, onUpdateQuantity, onRemove }: {
    item: CartProductItem | CartMenuItem;
    index: number;
    onUpdateQuantity: (index: number, qty: number) => void;
    onRemove: (index: number) => void;
}) {
    const label      = item.type === 'menu' ? item.menu.name : item.product.name;
    const imageUrl   = item.type === 'menu'
        ? item.menu.allowedProducts?.find(p => p.imageUrl)?.imageUrl ?? null
        : item.product.imageUrl;
    const totalPrice = item.unitPrice * item.quantity;

    // Pour les menus : affiche les choix faits
    const menuDetail = item.type === 'menu' ? Object.values(item.menuChoices ?? {})
        .map(id => item.menu.allowedProducts?.find(p => p.id === id)?.name)
        .filter(Boolean).join(' · ') : null;

    return (
        <div className="card-dark" style={{ padding: '14px', display: 'flex', gap: '14px', alignItems: 'center' }}>

            {/* Image */}
            {imageUrl ? (
                <img src={imageUrl} alt={label} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#111', flexShrink: 0 }} />
            )}

            {/* Infos */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {label}
                </div>
                {menuDetail && (
                    <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {menuDetail}
                    </div>
                )}
                <div style={{ color: '#FF8C00', fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>
                    {formatPrice(totalPrice)}
                </div>
            </div>

            {/* Quantité */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#222', border: '1px solid #333', cursor: 'pointer', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Minus size={12} />
                </button>
                <span style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1rem', color: '#FFF', minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                </span>
                <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FF8C00', border: 'none', cursor: 'pointer', color: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Plus size={12} />
                </button>
            </div>

            {/* Supprimer */}
            <button
                onClick={() => onRemove(index)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: '4px', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}