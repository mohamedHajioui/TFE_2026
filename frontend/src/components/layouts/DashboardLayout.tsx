import {type ReactNode, useState, useEffect, useRef} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '@/context/AuthContext';
import {UserRole} from '@/models';
import {
    LayoutDashboard, ShoppingBag, UtensilsCrossed, Package,
    Users, Clock, LogOut, Menu, X, ChevronRight, Bell, Truck, Store,
    CreditCard, BarChart3, ChefHat, type LucideIcon,
} from 'lucide-react';
import styles from './DashboardLayout.module.css';
import {type AdminNotification, useAdminNotifications} from "@/hooks/useDashboardNotifications";

interface DashboardLayoutProps {
    children: ReactNode;
}

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    notif?: boolean;
    adminOnly?: boolean; // Si true → visible uniquement par ADMIN
}

const NAV_ITEMS: NavItem[] = [
    {href: '/admin', label: 'Dashboard', icon: LayoutDashboard},
    {href: '/admin/pos', label: 'Caisse', icon: CreditCard},
    {href: '/admin/orders', label: 'Commandes', icon: ShoppingBag, notif: true},
    {href: '/admin/products', label: 'Produits', icon: Package},
    {href: '/admin/menus', label: 'Menus', icon: UtensilsCrossed},
    {href: '/admin/kitchen', label: 'Cuisine', icon: ChefHat},
    {href: '/admin/ingredients', label: 'Stocks', icon: LayoutDashboard},
    {href: '/admin/timeslots', label: 'Créneaux', icon: Clock},
    {href: '/admin/statistics', label: 'Statistiques', icon: BarChart3, adminOnly: true},
    {href: '/admin/users', label: 'Utilisateurs', icon: Users, adminOnly: true},
];

interface SidebarContentProps {
    collapsed: boolean;
    newCount: number;
    userName: string;
    userRole: string;
    isActive: (href: string) => boolean;
    onNavClick: () => void;
    onLogout: () => void;
}

function SidebarContent({
                            collapsed,
                            newCount,
                            userName,
                            userRole,
                            isActive,
                            onNavClick,
                            onLogout,
                        }: SidebarContentProps) {
    return (
        <div className={styles.sidebarInner}>
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

            <nav className={styles.sidebarNav}>
                {NAV_ITEMS
                    .filter(item => !item.adminOnly || userRole === UserRole.ADMIN)
                    .map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        const hasNotif = Boolean(item.notif) && newCount > 0;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={onNavClick}
                                className={`${styles.navItem} ${active ? styles.navItemActive : ''} ${collapsed ? styles.navItemCollapsed : ''}`}
                            >
                                <div style={{position: 'relative', flexShrink: 0}}>
                                    <Icon size={18} color={active ? 'var(--sg-amber)' : '#71717A'}/>
                                    {hasNotif && (
                                        <span className={styles.navBadge}>
                                        {newCount > 9 ? '9+' : newCount}
                                    </span>
                                    )}
                                </div>
                                {!collapsed && (
                                    <span
                                        className={`${styles.navItemLabel} ${active ? styles.navItemLabelActive : ''}`}>
                                    {item.label}
                                        {hasNotif && (
                                            <span className={styles.navBadgeInline}>
                                            {newCount}
                                        </span>
                                        )}
                                </span>
                                )}
                            </Link>
                        );
                    })}
            </nav>

            <div className={styles.sidebarFooter}>
                {!collapsed && (
                    <div className={styles.sidebarUserInfo}>
                        <div className={styles.sidebarUserName}>{userName}</div>
                        <div className={styles.sidebarUserRole}>{userRole}</div>
                    </div>
                )}
                <Link
                    to="/"
                    className={styles.sidebarLink}
                    style={{justifyContent: collapsed ? 'center' : 'flex-start'}}
                >
                    <ChevronRight size={16} color="#71717A" style={{transform: 'rotate(180deg)'}}/>
                    {!collapsed && <span>Voir le site</span>}
                </Link>
                <button
                    onClick={onLogout}
                    className={styles.sidebarLogoutBtn}
                    style={{justifyContent: collapsed ? 'center' : 'flex-start'}}
                >
                    <LogOut size={16}/>
                    {!collapsed && <span>Déconnexion</span>}
                </button>
            </div>
        </div>
    );
}

interface OrderToastProps {
    notif: AdminNotification;
    onClose: () => void;
    onNavigate: () => void;
}

function OrderToast({notif, onClose, onNavigate}: OrderToastProps) {
    return (
        <Link
            to="/admin/orders"
            className={styles.orderToast}
            onClick={onNavigate}
        >
            <div className={styles.orderToastIcon}>
                <Bell size={18} color="#0A0A0C"/>
            </div>
            <div className={styles.orderToastBody}>
                <div className={styles.orderToastTitle}>Nouvelle commande !</div>
                <div className={styles.orderToastSub}>
                    {notif.orderNumber} · {notif.total.toFixed(2)} €
                </div>
                <div className={styles.orderToastMeta}>
                    {notif.type === 'DELIVERY'
                        ? <><Truck size={11}/> Livraison</>
                        : <><Store size={11}/> À emporter</>
                    }
                    {' · '}
                    {notif.client}
                </div>
            </div>
            <button
                className={styles.orderToastClose}
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }}
                aria-label="Fermer"
            >
                <X size={14}/>
            </button>
        </Link>
    );
}

export function DashboardLayout({children}: DashboardLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const {user, logout} = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const {notifications, newCount, markAllRead} = useAdminNotifications();

    const [toastNotif, setToastNotif] = useState<AdminNotification | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevCount = useRef(0);

    useEffect(() => {
        if (newCount > prevCount.current && notifications.length > 0 && !location.pathname.startsWith('/admin/orders')) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setToastNotif(notifications[0]);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setToastNotif(null), 6000);
        }
        prevCount.current = newCount;
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, [newCount, notifications]);

    useEffect(() => {
        if (location.pathname.startsWith('/admin/orders') && newCount > 0) {
            markAllRead();
        }
    }, [location.pathname, markAllRead, newCount]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isActive = (href: string) =>
        href === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(href);

    const sidebarProps: SidebarContentProps = {
        collapsed,
        newCount,
        userName: user?.displayName ?? '',
        userRole: user?.role ?? '',
        isActive,
        onNavClick: () => setMobileOpen(false),
        onLogout: handleLogout,
    };

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar} style={{width: collapsed ? '60px' : '220px'}}>
                <SidebarContent {...sidebarProps} />
                <button className={styles.collapseBtn} onClick={() => setCollapsed(p => !p)}>
                    <ChevronRight
                        size={12}
                        color="#0A0A0C"
                        style={{transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s'}}
                    />
                </button>
            </aside>

            <header className={styles.mobileHeader}>
                <div className={styles.mobileTitle}>
                    Spot<span className={styles.mobileTitleAccent}> Admin</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    {newCount > 0 && (
                        <Link to="/admin/orders" className={styles.mobileBellBtn}>
                            <Bell size={20} color="var(--sg-amber)"/>
                            <span className={styles.mobileBellBadge}>{newCount > 9 ? '9+' : newCount}</span>
                        </Link>
                    )}
                    <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(p => !p)}>
                        {mobileOpen ? <X size={24}/> : <Menu size={24}/>}
                    </button>
                </div>
            </header>

            {mobileOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
                    <aside className={styles.mobileSidebar} onClick={e => e.stopPropagation()}>
                        <SidebarContent {...sidebarProps} />
                    </aside>
                </div>
            )}

            <main className={styles.main} style={{marginLeft: collapsed ? '60px' : '220px'}}>
                {children}
            </main>

            {toastNotif && (
                <OrderToast
                    notif={toastNotif}
                    onClose={() => setToastNotif(null)}
                    onNavigate={() => {
                        setToastNotif(null);
                        markAllRead();
                    }}
                />
            )}
        </div>
    );
}