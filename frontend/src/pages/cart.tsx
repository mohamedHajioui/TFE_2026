import { useNavigate } from 'react-router-dom';
import { useCart, type CartProductItem, type CartMenuItem } from '@/context/CartContext';
import { AppLayout } from '@/components/ui/appLayouth';
import { formatPrice } from '@/utils/format';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import styles from './cart.module.css';

export default function Cart() {
    const { items, totalItems, subtotal, updateQuantity, removeItem, clearCart } = useCart();
    const navigate = useNavigate();
    const deliveryFee = 3.5;

    if (items.length === 0) {
        return (
            <AppLayout>
                <div className={styles.emptyPage}>
                    <ShoppingBag size={64} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>Votre panier est vide</p>
                    <p className={styles.emptyText}>Ajoutez des menus ou des produits pour commencer.</p>
                    <button className="btn-primary" onClick={() => navigate('/')}>Voir la carte</button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <div className="section-header">Mon panier</div>
                        <p className={styles.headerCount}>{totalItems} article{totalItems > 1 ? 's' : ''}</p>
                    </div>
                    <button className={styles.clearBtn} onClick={clearCart}>
                        <Trash2 size={14} /> Vider
                    </button>
                </div>

                <div className={styles.itemList}>
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

                <div className={`card-dark ${styles.recap}`} style={{ overflow: 'visible' }}>
                    <div className={styles.recapRows}>
                        <div className={styles.recapRow}>
                            <span>Sous-total</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className={styles.recapRow}>
                            <span>Livraison (si applicable)</span>
                            <span>{formatPrice(deliveryFee)}</span>
                        </div>
                        <div className="divider-orange" />
                        <div className={styles.recapTotal}>
                            <span className={styles.recapTotalLabel}>Total estimé</span>
                            <span className="price-tag" style={{ fontSize: '1.4rem' }}>{formatPrice(subtotal)}</span>
                        </div>
                        <p className={styles.recapNote}>
                            Les frais de livraison seront calculés à la confirmation de commande.
                        </p>
                    </div>
                    <button
                        className={`btn-primary ${styles.checkoutBtn}`}
                        onClick={() => navigate('/checkout')}
                    >
                        Passer la commande
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}

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
    const menuDetail = item.type === 'menu'
        ? Object.values(item.menuChoices ?? {}).map(id => item.menu.allowedProducts?.find(p => p.id === id)?.name).filter(Boolean).join(' · ')
        : null;

    return (
        <div className={`card-dark ${styles.item}`}>
            {imageUrl
                ? <img src={imageUrl} alt={label} className={styles.itemImage} />
                : <div className={styles.itemImagePlaceholder} />
            }
            <div className={styles.itemInfo}>
                <div className={styles.itemName}>{label}</div>
                {menuDetail && <div className={styles.itemDetail}>{menuDetail}</div>}
                <div className={styles.itemPrice}>{formatPrice(totalPrice)}</div>
            </div>
            <div className={styles.quantity}>
                <button className={`${styles.qtyBtn} ${styles.qtyBtnMinus}`} onClick={() => onUpdateQuantity(index, item.quantity - 1)}>
                    <Minus size={12} />
                </button>
                <span className={styles.qtyValue}>{item.quantity}</span>
                <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`} onClick={() => onUpdateQuantity(index, item.quantity + 1)}>
                    <Plus size={12} />
                </button>
            </div>
            <button className={styles.removeBtn} onClick={() => onRemove(index)}>
                <Trash2 size={16} />
            </button>
        </div>
    );
}