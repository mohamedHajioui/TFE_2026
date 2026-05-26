import { useCart } from '@/context/CartContext';
import { resolveImageUrl } from '@/utils/imageUrl';
import { Check, ShoppingBag } from 'lucide-react';
import styles from './CartToast.module.css';

export function CartToast() {
    const { toast, dismissToast, openDrawer } = useCart();

    if (!toast) return null;

    const handleClick = () => {
        dismissToast();
        openDrawer();
    };

    return (
        <button
            key={toast.id}
            className={styles.toast}
            onClick={handleClick}
            aria-label="Voir le panier"
        >
            <div className={styles.icon}>
                <Check size={16} strokeWidth={3} />
            </div>
            {resolveImageUrl(toast.imageUrl) ? (
                <img src={resolveImageUrl(toast.imageUrl)!} alt="" className={styles.image} />
            ) : (
                <div className={styles.imagePlaceholder}>
                    <ShoppingBag size={16} color="#52525B" />
                </div>
            )}
            <div className={styles.content}>
                <div className={styles.title}>Ajouté au panier</div>
                <div className={styles.label}>{toast.label}</div>
            </div>
            <div className={styles.arrow}>Voir →</div>
        </button>
    );
}