import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import { ShoppingBag } from 'lucide-react';
import styles from './CartBottomBar.module.css';

export function CartBottomBar() {
    const { totalItems, subtotal, openDrawer } = useCart();

    if (totalItems === 0) return null;

    return (
        <button
            className={styles.bar}
            onClick={openDrawer}
            aria-label="Ouvrir le panier"
        >
            <div className={styles.left}>
                <div className={styles.iconWrapper}>
                    <ShoppingBag size={18} color="#0A0A0C" strokeWidth={2.2} />
                    <span className={styles.badge}>{totalItems > 9 ? '9+' : totalItems}</span>
                </div>
                <div className={styles.info}>
                    <span className={styles.label}>Mon panier</span>
                    <span className={styles.count}>
                        {totalItems} article{totalItems > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            <div className={styles.right}>
                <span className={styles.total}>{formatPrice(subtotal)}</span>
                <span className={styles.chevron}>→</span>
            </div>
        </button>
    );
}