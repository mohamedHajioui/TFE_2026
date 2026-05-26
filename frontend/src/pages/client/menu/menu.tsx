import { useState } from 'react';
import { useActiveMenus } from '@/hooks/useMenus';
import { MenuModel } from '@/models/menu.model';
import { MenuCard } from '@/components/menus/menu-card';
import { AppLayout } from '@/components/layouts/AppLayout';
import { MenuComposer } from '@/components/menus/menu-composer';
import styles from './menu.module.css';

export default function Menus() {
    const { menus, isLoading, error } = useActiveMenus();
    const [selectedMenu, setSelectedMenu] = useState<MenuModel | null>(null);

    return (
        <AppLayout>
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div className={styles.badgeWrapper}>
                        <span className={styles.badge}>
                            <span className={styles.badgeDot} />
                            Nos formules
                        </span>
                    </div>
                    <h1 className={styles.title}>
                        Nos <span className={styles.titleAccent}>menus</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Composez votre repas complet avec des formules avantageuses.
                        Choisissez sandwich, boisson, dessert et accompagnement.
                    </p>
                </div>
            </section>

            <section className={styles.content}>
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
                        <p className={styles.emptyTitle}>Aucun menu disponible pour le moment</p>
                        <p className={styles.emptyText}>Consultez notre carte pour commander à la pièce.</p>
                    </div>
                )}

                {!isLoading && !error && menus.length > 0 && (
                    <>
                        <div className={styles.header}>
                            <div className="section-header">Menus disponibles</div>
                            <span className={styles.countBadge}>
                                {menus.length} disponible{menus.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className={styles.grid}>
                            {menus.map((menu) => (
                                <MenuCard key={menu.id} menu={menu} onSelect={setSelectedMenu} />
                            ))}
                        </div>
                    </>
                )}
            </section>

            {selectedMenu && (
                <MenuComposer menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
            )}
        </AppLayout>
    );
}