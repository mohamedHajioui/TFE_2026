import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { XCircle, Home, ShoppingBag } from 'lucide-react';
import styles from './checkout-result.module.css';

export default function CheckoutCancel() {
    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={`card-dark ${styles.card}`}>
                    <div className={styles.iconWrapper}>
                        <XCircle size={56} className={styles.cancelIcon} />
                    </div>
                    <h1 className={styles.title}>Paiement annulé</h1>
                    <p className={styles.subtitle}>
                        Le paiement n'a pas été effectué. Aucun prélèvement n'a été réalisé.
                    </p>
                    <p className={styles.note}>
                        Votre panier est toujours disponible : vous pouvez reprendre la commande
                        ou modifier votre sélection.
                    </p>

                    <div className={styles.actions}>
                        <Link to="/cart" className={`btn-primary ${styles.actionBtn}`}>
                            <ShoppingBag size={16} /> Retour au panier
                        </Link>
                        <Link to="/" className={`btn-outline ${styles.actionBtn}`}>
                            <Home size={16} /> Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}