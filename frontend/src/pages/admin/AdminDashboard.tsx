
import { Link } from 'react-router-dom';
import { Package, UtensilsCrossed, ShoppingBag, Users } from 'lucide-react';
import styles from './AdminDashboard.module.css';
import {AdminLayout} from "@/pages/admin/AdminLayout.tsx";

export default function AdminDashboard() {
    const cards = [
        { label: 'Produits',     href: '/admin/products', icon: Package,         desc: 'Gérer le catalogue' },
        { label: 'Menus',        href: '/admin/menus',    icon: UtensilsCrossed, desc: 'Gérer les formules' },
        { label: 'Commandes',    href: '/admin/orders',   icon: ShoppingBag,     desc: 'Suivre les commandes' },
        { label: 'Utilisateurs', href: '/admin/users',    icon: Users,           desc: 'Gérer les comptes' },
    ];

    return (
        <AdminLayout>
            <div className={styles.header}>
                <div className="section-header">Dashboard</div>
                <p className={styles.headerSub}>Bienvenue dans l'espace d'administration.</p>
            </div>

            <div className={styles.grid}>
                {cards.map(card => {
                    const Icon = card.icon;
                    return (
                        <Link key={card.href} to={card.href} className={styles.cardLink}>
                            <div className={`card-dark ${styles.card}`}>
                                <div className={styles.cardIcon}>
                                    <Icon size={22} color="var(--sg-amber)" />
                                </div>
                                <div>
                                    <div className={styles.cardLabel}>{card.label}</div>
                                    <div className={styles.cardDesc}>{card.desc}</div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </AdminLayout>
    );
}