import { useState } from 'react';
import { useActiveMenus } from '@/hooks/useMenus';
import { MenuModel } from '@/models/menu.model';
import { MenuCard } from '@/components/menus/menu-card';
import { AppLayout } from '@/components/ui/appLayouth';
import { MenuComposer } from '@/components/menus/menu-composer';
import styles from './home.module.css';

export default function Home() {
    const { menus, isLoading, error } = useActiveMenus();
    const [selectedMenu, setSelectedMenu] = useState<MenuModel | null>(null);

    return (
        <AppLayout>

            {/* Hero */}
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
                        <button className="btn-primary" style={{ fontSize: '0.92rem', padding: '12px 28px' }}>
                            Voir la carte
                        </button>
                        <button className="btn-outline" style={{ fontSize: '0.92rem', padding: '12px 28px' }}>
                            Nos menus
                        </button>
                    </div>
                </div>
            </section>

            {/* Bande infos */}
            <div className={styles.infoBand}>
                {['Lun–Ven 8h–21h · Sam 9h–22h', 'Retrait en boutique', 'Livraison disponible'].map((label, i) => (
                    <span key={i} className={styles.infoItem}>
                        {i > 0 && <span className={styles.infoDot} />}
                        <span className={styles.infoText}>{label}</span>
                    </span>
                ))}
            </div>

            {/* Section menus */}
            <section className={styles.menuSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <div className={`section-header ${styles.sectionTitle}`}>Nos menus du jour</div>
                        <p className={styles.sectionSub}>
                            Des formules avantageuses pour composer votre repas complet.
                        </p>
                    </div>
                    {!isLoading && !error && menus.length > 0 && (
                        <span className={styles.countBadge}>
                            {menus.length} disponible{menus.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {isLoading && (
                    <div className={styles.loading}>
                        <div className="spinner" />
                        <span className={styles.loadingText}>Chargement des menus...</span>
                    </div>
                )}

                {error && (
                    <div className={styles.errorBox}>
                        <p className={styles.errorTitle}>Impossible de charger les menus</p>
                        <p className={styles.errorMsg}>{error}</p>
                    </div>
                )}

                {!isLoading && !error && menus.length === 0 && (
                    <div className={styles.emptyBox}>
                        <p className={styles.emptyTitle}>Aucun menu disponible aujourd'hui</p>
                        <p className={styles.emptyText}>Consultez notre carte pour commander à la pièce.</p>
                    </div>
                )}

                {!isLoading && !error && menus.length > 0 && (
                    <div className={styles.menuGrid}>
                        {menus.map(menu => (
                            <MenuCard key={menu.id} menu={menu} onSelect={setSelectedMenu} />
                        ))}
                    </div>
                )}
            </section>

            {selectedMenu && (
                <MenuComposer menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
            )}
        </AppLayout>
    );
}