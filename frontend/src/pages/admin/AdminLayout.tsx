import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard, ShoppingBag, UtensilsCrossed, Package,
    Users, Clock, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps { children: ReactNode; }

const NAV_ITEMS = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/admin/products', label: 'Produits', icon: Package },
    { href: '/admin/menus', label: 'Menus', icon: UtensilsCrossed },
    { href: '/admin/ingredients', label: 'Stocks', icon: LayoutDashboard },
    { href: '/admin/timeslots', label: 'Créneaux', icon: Clock },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
];

export function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isActive = (href: string) =>
        href === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(href);

    const SidebarContent = () => (
        <div className={styles.sidebarInner}>
            {/* Logo */}
            <div className={styles.sidebarLogo}>
                <div className={styles.sidebarLogoIcon}>
                    <span className={styles.sidebarLogoIconText}>SG</span>
                </div>
                {!collapsed && (
                    <div>
                        <div className={styles.sidebarLogoName}>
                            Spot<span className={styles.sidebarLogoAccent}> Gourmand</span>
                        </div>
                        <div className={styles.sidebarLogoSub}>Administration</div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className={styles.sidebarNav}>
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`${styles.navItem} ${active ? styles.navItemActive : ''} ${collapsed ? styles.navItemCollapsed : ''}`}
                        >
                            <Icon size={18} color={active ? 'var(--sg-amber)' : '#71717A'} style={{ flexShrink: 0 }} />
                            {!collapsed && (
                                <span className={`${styles.navItemLabel} ${active ? styles.navItemLabelActive : ''}`}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer sidebar */}
            <div className={styles.sidebarFooter}>
                {!collapsed && user && (
                    <div className={styles.sidebarUserInfo}>
                        <div className={styles.sidebarUserName}>{user.displayName}</div>
                        <div className={styles.sidebarUserRole}>{user.role}</div>
                    </div>
                )}
                <Link
                    to="/"
                    className={styles.sidebarLink}
                    style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                >
                    <ChevronRight size={16} color="#71717A" style={{ transform: 'rotate(180deg)' }} />
                    {!collapsed && <span>Voir le site</span>}
                </Link>
                <button
                    onClick={handleLogout}
                    className={styles.sidebarLogoutBtn}
                    style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                >
                    <LogOut size={16} />
                    {!collapsed && <span>Déconnexion</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className={styles.layout}>
            {/* Sidebar desktop */}
            <aside
                className={styles.sidebar}
                style={{ width: collapsed ? '60px' : '220px' }}
            >
                {/* eslint-disable-next-line react-hooks/static-components */}
                <SidebarContent/>
                <button
                    className={styles.collapseBtn}
                    onClick={() => setCollapsed(p => !p)}
                >
                    <ChevronRight
                        size={12}
                        color="#0A0A0C"
                        style={{ transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }}
                    />
                </button>
            </aside>

            {/* Header mobile */}
            <header className={styles.mobileHeader}>
                <div className={styles.mobileTitle}>
                    Spot<span className={styles.mobileTitleAccent}> Admin</span>
                </div>
                <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(p => !p)}>
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Overlay mobile */}
            {mobileOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
                    <aside className={styles.mobileSidebar} onClick={e => e.stopPropagation()}>
                        {/* eslint-disable-next-line react-hooks/static-components */}
                        <SidebarContent/>
                    </aside>
                </div>
            )}

            {/* Contenu */}
            <main
                className={styles.main}
                style={{ marginLeft: collapsed ? '60px' : '220px' }}
            >
                {children}
            </main>
        </div>
    );
}