import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, type CartProductItem, type CartMenuItem } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/imageUrl';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import styles from './CartDrawer.module.css';

export function CartDrawer() {
    const {
        items, totalItems, subtotal, updateQuantity, removeItem, clearCart,
        isDrawerOpen, closeDrawer,
    } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isDrawerOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isDrawerOpen, closeDrawer]);

    useEffect(() => {
        if (isDrawerOpen) {
            const previous = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = previous; };
        }
    }, [isDrawerOpen]);

    const handleCheckout = () => { closeDrawer(); navigate('/checkout'); };
    const handleViewCart = () => { closeDrawer(); navigate('/cart'); };

    return (
        <>
            <div
                className={`${styles.overlay} ${isDrawerOpen ? styles.overlayOpen : ''}`}
                onClick={closeDrawer}
                aria-hidden="true"
            />
            <aside
                className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ''}`}
                aria-label="Panier"
                aria-hidden={!isDrawerOpen}
            >
                <header className={styles.header}>
                    <div>
                        <div className={styles.headerTitle}>Mon panier</div>
                        <div className={styles.headerSub}>
                            {totalItems === 0 ? 'Vide' : `${totalItems} article${totalItems > 1 ? 's' : ''}`}
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Fermer">
                        <X size={20} />
                    </button>
                </header>

                {items.length === 0 ? (
                    <div className={styles.empty}>
                        <ShoppingBag size={56} className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>Votre panier est vide</p>
                        <p className={styles.emptyText}>Ajoutez des menus ou des produits pour commencer.</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.itemList}>
                            {items.map((item, index) => (
                                <DrawerItem
                                    key={index}
                                    item={item}
                                    index={index}
                                    onUpdateQuantity={updateQuantity}
                                    onRemove={removeItem}
                                />
                            ))}
                            <button className={styles.clearBtn} onClick={clearCart}>
                                <Trash2 size={13} /> Vider le panier
                            </button>
                        </div>

                        <footer className={styles.footer}>
                            <div className={styles.recapRow}>
                                <span>Sous-total</span>
                                <span className={styles.recapValue}>{formatPrice(subtotal)}</span>
                            </div>
                            <p className={styles.recapNote}>
                                Les frais de livraison éventuels seront ajoutés à la confirmation.
                            </p>

                            <button
                                className={`btn-primary ${styles.checkoutBtn}`}
                                onClick={handleCheckout}
                            >
                                Passer la commande · {formatPrice(subtotal)}
                            </button>
                            <button className={styles.viewCartBtn} onClick={handleViewCart}>
                                Voir le détail
                            </button>
                        </footer>
                    </>
                )}
            </aside>
        </>
    );
}

function DrawerItem({ item, index, onUpdateQuantity, onRemove }: {
    item: CartProductItem | CartMenuItem;
    index: number;
    onUpdateQuantity: (index: number, qty: number) => void;
    onRemove: (index: number) => void;
}) {
    const label = item.type === 'menu' ? item.menu.name : item.product.name;
    const imageUrl = resolveImageUrl(
        item.type === 'menu'
            ? item.menu.imageUrl ?? item.menu.allowedProducts?.find((p) => p.imageUrl)?.imageUrl ?? null
            : item.product.imageUrl,
    );
    const totalPrice = item.unitPrice * item.quantity;
    const menuDetail = item.type === 'menu'
        ? Object.values(item.menuChoices ?? {})
            .map((id) => item.menu.allowedProducts?.find((p) => p.id === id)?.name)
            .filter(Boolean)
            .join(' · ')
        : null;

    return (
        <div className={styles.item}>
            {imageUrl
                ? <img src={imageUrl} alt={label} className={styles.itemImage} />
                : <div className={styles.itemImagePlaceholder} />}
            <div className={styles.itemInfo}>
                <div className={styles.itemName}>{label}</div>
                {menuDetail && <div className={styles.itemDetail}>{menuDetail}</div>}
                <div className={styles.itemPrice}>{formatPrice(totalPrice)}</div>
            </div>
            <div className={styles.itemActions}>
                <div className={styles.quantity}>
                    <button
                        className={styles.qtyBtnMinus}
                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                        aria-label="Diminuer"
                    >
                        <Minus size={12} />
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button
                        className={styles.qtyBtnPlus}
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        aria-label="Augmenter"
                    >
                        <Plus size={12} />
                    </button>
                </div>
                <button
                    className={styles.removeBtn}
                    onClick={() => onRemove(index)}
                    aria-label="Retirer"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}