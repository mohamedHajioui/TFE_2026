
import { Link } from 'react-router-dom';
import {
    Package, UtensilsCrossed, ShoppingBag, Users,
    CreditCard, LayoutDashboard, Clock, BarChart3, ChefHat,
} from 'lucide-react';
import styles from './home.module.css';
import {DashboardLayout} from "@/components/layouts/DashboardLayout";
import {useAuth} from "@/context/AuthContext";
import {UserRole} from "@/models";

export default function AdminDashboard() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const cards = [
        { label: 'Caisse', href: '/admin/pos', icon: CreditCard, desc: 'Encoder les commandes sur place' },
        { label: 'Commandes', href: '/admin/orders', icon: ShoppingBag, desc: 'Suivre les commandes' },
        { label: 'Cuisine', href: '/admin/kitchen', icon: ChefHat, desc: 'Préparations par créneau' },
        { label: 'Produits', href: '/admin/products', icon: Package, desc: 'Gérer le catalogue' },
        { label: 'Menus', href: '/admin/menus', icon: UtensilsCrossed, desc: 'Gérer les formules' },
        { label: 'Stocks', href: '/admin/ingredients', icon: LayoutDashboard, desc: 'Gérer les ingrédients' },
        { label: 'Créneaux', href: '/admin/timeslots', icon: Clock, desc: 'Gérer les plages horaires' },
        ...(isAdmin ? [
            { label: 'Statistiques', href: '/admin/statistics', icon: BarChart3, desc: 'Voir les chiffres clés' },
            { label: 'Utilisateurs', href: '/admin/users', icon: Users, desc: 'Gérer les comptes' },
        ] : []),
    ];

    return (
        <DashboardLayout>
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
        </DashboardLayout>
    );
}