import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useActiveMenus } from '@/hooks/useMenus';
import { ArrowRight, UtensilsCrossed, Sandwich } from 'lucide-react';
import styles from './home.module.css';

export default function Home() {
    const navigate = useNavigate();
    const { menus } = useActiveMenus();
    const menuCount = menus.length;

    return (
        <AppLayout>
            <section className={styles.hero}>
                <div className={styles.heroGlow} />
                <div className={styles.heroInner}>
                    <div className={styles.pillWrapper}>
                        <span className={styles.pill}>
                            <span className={styles.pillDot} />
                            Sandwicherie · Pasta Bar
                        </span>
                    </div>
                    <h1 className={styles.heroTitle}>
                        Commandez en ligne,{' '}
                        <span className={styles.heroTitleAccent}>récupérez en 15 min</span>
                    </h1>
                    <p className={styles.heroSub}>
                        Des sandwichs frais préparés à la commande, avec retrait en boutique ou livraison à domicile.
                    </p>
                    <div className={styles.ctaGroup}>
                        <button
                            className="btn-primary"
                            style={{ fontSize: '0.92rem', padding: '12px 28px' }}
                            onClick={() => navigate('/menus')}
                        >
                            Nos menus
                        </button>
                        <button
                            className="btn-outline"
                            style={{ fontSize: '0.92rem', padding: '12px 28px' }}
                            onClick={() => navigate('/products')}
                        >
                            Voir la carte
                        </button>
                    </div>
                </div>
            </section>

            <div className={styles.infoBand}>
                {['Lun–Ven 8h–21h · Sam 9h–22h', 'Retrait en boutique', 'Livraison disponible'].map(
                    (label, i) => (
                        <span key={i} className={styles.infoItem}>
                            {i > 0 && <span className={styles.infoDot} />}
                            <span className={styles.infoText}>{label}</span>
                        </span>
                    ),
                )}
            </div>

            <section className={styles.teaserSection}>
                <div className={styles.teaserGrid}>
                    <button
                        className={`card-dark ${styles.teaserCard}`}
                        onClick={() => navigate('/menus')}
                    >
                        <div className={styles.teaserIcon}>
                            <UtensilsCrossed size={26} />
                        </div>
                        <div className={styles.teaserContent}>
                            <div className={styles.teaserBadge}>Formules</div>
                            <h2 className={styles.teaserTitle}>Nos menus</h2>
                            <p className={styles.teaserText}>
                                Des formules complètes et avantageuses : sandwich, boisson, dessert et plus encore.
                            </p>
                            <div className={styles.teaserFooter}>
                                <span className={styles.teaserCount}>
                                    {menuCount > 0
                                        ? `${menuCount} menu${menuCount > 1 ? 's' : ''} disponible${menuCount > 1 ? 's' : ''}`
                                        : 'Découvrir'}
                                </span>
                                <ArrowRight size={16} className={styles.teaserArrow} />
                            </div>
                        </div>
                    </button>

                    <button
                        className={`card-dark ${styles.teaserCard}`}
                        onClick={() => navigate('/products')}
                    >
                        <div className={styles.teaserIcon}>
                            <Sandwich size={26} />
                        </div>
                        <div className={styles.teaserContent}>
                            <div className={styles.teaserBadge}>À la carte</div>
                            <h2 className={styles.teaserTitle}>Notre carte</h2>
                            <p className={styles.teaserText}>
                                Composez votre commande à la pièce : sandwichs, boissons, desserts, accompagnements.
                            </p>
                            <div className={styles.teaserFooter}>
                                <span className={styles.teaserCount}>Commander à la pièce</span>
                                <ArrowRight size={16} className={styles.teaserArrow} />
                            </div>
                        </div>
                    </button>
                </div>
            </section>
        </AppLayout>
    );
}