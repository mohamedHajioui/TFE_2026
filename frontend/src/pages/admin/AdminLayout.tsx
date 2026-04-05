import {type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard, ShoppingBag, UtensilsCrossed, Package,
    Users, Clock, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

interface AdminLayoutProps { children: ReactNode; }

const NAV_ITEMS = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/admin/products', label: 'Produits', icon: Package },
    { href: '/admin/menus', label: 'Menus', icon: UtensilsCrossed },
    { href: '/admin/ingredients', label: 'Stocks', icon: LayoutDashboard },
    { href: '/admin/timeslots',label: 'Créneaux', icon: Clock },
    { href: '/admin/users', label: 'Utilisateurs',icon: Users },
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Logo */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', background: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#0D0D0D' }}>SG</span>
                </div>
                {!collapsed && (
                    <div>
                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                            Spot<span style={{ color: '#FF8C00' }}> Gourmand</span>
                        </div>
                        <div style={{ color: '#FF8C00', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
                            Administration
                        </div>
                    </div>
                )}
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: collapsed ? '10px' : '10px 12px',
                                borderRadius: '8px',
                                background: active ? '#2A1A00' : 'transparent',
                                border: `1px solid ${active ? '#FF8C00' : 'transparent'}`,
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#1A1A1A'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <Icon size={18} color={active ? '#FF8C00' : '#888'} style={{ flexShrink: 0 }} />
                            {!collapsed && (
                                <span style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 600, fontSize: '0.88rem', color: active ? '#FF8C00' : '#AAA', whiteSpace: 'nowrap' }}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User + déconnexion */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid #1A1A1A' }}>
                {!collapsed && user && (
                    <div style={{ padding: '8px 12px', marginBottom: '4px' }}>
                        <div style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#FFF' }}>{user.displayName}</div>
                        <div style={{ color: '#555', fontSize: '0.72rem' }}>{user.role}</div>
                    </div>
                )}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px' : '10px 12px', borderRadius: '8px', textDecoration: 'none', color: '#888', justifyContent: collapsed ? 'center' : 'flex-start' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1A1A1A')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <ChevronRight size={16} color="#888" style={{ transform: 'rotate(180deg)' }} />
                    {!collapsed && <span style={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.85rem' }}>Voir le site</span>}
                </Link>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px' : '10px 12px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#220000')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <LogOut size={16} />
                    {!collapsed && <span style={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.85rem' }}>Déconnexion</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#0D0D0D' }}>

            {/* Sidebar desktop */}
            <aside style={{
                width: collapsed ? '60px' : '220px',
                background: '#111',
                borderRight: '1px solid #1A1A1A',
                position: 'fixed', top: 0, left: 0, bottom: 0,
                zIndex: 50,
                transition: 'width 0.2s',
                display: 'flex', flexDirection: 'column',
            }} className="hide-mobile">
                <SidebarContent />
                {/* Toggle collapse */}
                <button onClick={() => setCollapsed(p => !p)} style={{ position: 'absolute', top: '22px', right: '-12px', width: '24px', height: '24px', background: '#FF8C00', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={12} color="#0D0D0D" style={{ transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
                </button>
            </aside>

            {/* Header mobile */}
            <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: '#111', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }} className="show-mobile">
                <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1rem', color: '#FFF', textTransform: 'uppercase' }}>
                    Spot<span style={{ color: '#FF8C00' }}> Admin</span>
                </div>
                <button onClick={() => setMobileOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFF' }}>
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar mobile overlay */}
            {mobileOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setMobileOpen(false)}>
                    <aside style={{ width: '240px', height: '100%', background: '#111', borderRight: '1px solid #1A1A1A' }} onClick={e => e.stopPropagation()}>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Contenu principal */}
            <main style={{
                marginLeft: collapsed ? '60px' : '220px',
                flex: 1,
                minHeight: '100vh',
                padding: '32px',
                transition: 'margin-left 0.2s',
            }} className="admin-main">
                {children}
            </main>
        </div>
    );
}