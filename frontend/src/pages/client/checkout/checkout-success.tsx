import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ordersApi } from '@/api/orders.api';
import { OrderModel } from '@/models/order.model';
import { CheckCircle2, ClipboardList, Home } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import styles from './checkout-result.module.css';

export default function CheckoutSuccess() {
    const [params] = useSearchParams();
    const orderId = Number(params.get('order'));
    const { isAuthenticated } = useAuth();
    const { clearCart } = useCart();

    const [order, setOrder] = useState<OrderModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const cartCleared = useRef(false);

    // Vider le panier dès l'arrivée sur la page de succès
    useEffect(() => {
        if (!cartCleared.current) {
            clearCart();
            cartCleared.current = true;
        }
    }, [clearCart]);

    // Le webhook Stripe met quelques secondes à marquer la commande PAID.
    // On poll plusieurs fois pour voir le bon état.
    useEffect(() => {
        if (!orderId || !isAuthenticated) {
            setIsLoading(false);
            return;
        }

        let attempts = 0;
        const maxAttempts = 10;
        let cancelled = false;

        const poll = async () => {
            try {
                const data = await ordersApi.findOne(orderId);
                if (cancelled) return;
                setOrder(data);
                if (data.paymentStatus === 'PAID') {
                    setIsLoading(false);
                    return;
                }
            } catch {
                // ignore, on retente
            }

            attempts += 1;
            if (attempts < maxAttempts && !cancelled) {
                setTimeout(poll, 1500);
            } else {
                setIsLoading(false);
            }
        };

        poll();
        return () => { cancelled = true; };
    }, [orderId, isAuthenticated]);

    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={`card-dark ${styles.card}`}>
                    <div className={styles.iconWrapper}>
                        <CheckCircle2 size={56} className={styles.successIcon} />
                    </div>
                    <h1 className={styles.title}>Paiement confirmé</h1>
                    <p className={styles.subtitle}>
                        Merci ! Votre commande a bien été enregistrée.
                    </p>

                    {isLoading && isAuthenticated && (
                        <div className={styles.loadingRow}>
                            <div className="spinner" />
                            <span>Finalisation de votre commande...</span>
                        </div>
                    )}

                    {order && (
                        <div className={styles.orderBox}>
                            <div className={styles.orderRow}>
                                <span>Numéro de commande</span>
                                <span className={styles.orderValue}>{order.orderNumber}</span>
                            </div>
                            <div className={styles.orderRow}>
                                <span>Total payé</span>
                                <span className={styles.orderValue}>{formatPrice(order.total)}</span>
                            </div>
                            <div className={styles.orderRow}>
                                <span>Statut</span>
                                <span className={styles.statusBadge}>
                                    {order.statusLabel}
                                </span>
                            </div>
                        </div>
                    )}

                    {!isAuthenticated && (
                        <p className={styles.guestNote}>
                            Un récapitulatif vous sera envoyé par email dès que notre équipe aura pris votre commande en charge.
                        </p>
                    )}

                    <div className={styles.actions}>
                        {isAuthenticated && (
                            <Link to="/orders" className={`btn-primary ${styles.actionBtn}`}>
                                <ClipboardList size={16} /> Mes commandes
                            </Link>
                        )}
                        <Link to="/" className={`btn-outline ${styles.actionBtn}`}>
                            <Home size={16} /> Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}