import {type ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { LogOut, ClipboardList, ChevronDown, Menu, X, ShoppingBag } from 'lucide-react';

interface AppLayoutProps { children: ReactNode; }

export function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const { totalItems } = useCart();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        setDropdownOpen(false);
        navigate('/');
    };

    const navLinks = [
        { href: '/',         label: 'Accueil' },
        { href: '/products', label: 'Carte' },
    ];

    const isActive = (href: string) => location.pathname === href;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>

            <header style={{ background: '#0D0D0D', borderBottom: '2px solid #FF8C00', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>

                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{ width: '34px', height: '34px', background: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#0D0D0D' }}>SG</span>
                    </div>
                    <div>
                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', color: '#FFF', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
                            Spot<span style={{ color: '#FF8C00' }}> Gourmand</span>
                        </div>
                        <div style={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.6rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Sandwicherie · Pasta Bar
                        </div>
                    </div>
                </Link>

                {/* Desktop nav */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
                    {navLinks.map(link => (
                        <Link key={link.href} to={link.href} style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 500, fontSize: '0.88rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: isActive(link.href) ? '#FF8C00' : '#AAA', textDecoration: 'none', padding: '6px 12px', borderBottom: isActive(link.href) ? '2px solid #FF8C00' : '2px solid transparent', transition: 'color 0.2s' }}>
                            {link.label}
                        </Link>
                    ))}

                    {/* ── Panier ── */}
                    <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '8px', background: totalItems > 0 ? '#2A1A00' : '#111', border: `1px solid ${totalItems > 0 ? '#FF8C00' : '#222'}`, marginLeft: '4px', transition: 'all 0.2s' }}>
                        <ShoppingBag size={18} color={totalItems > 0 ? '#FF8C00' : '#666'} />
                        {totalItems > 0 && (
                            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#FF8C00', color: '#0D0D0D', fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.65rem', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {totalItems > 9 ? '9+' : totalItems}
                            </span>
                        )}
                    </Link>

                    {/* User */}
                    {isAuthenticated && user ? (
                        <div ref={dropdownRef} style={{ position: 'relative', marginLeft: '6px' }}>
                            <button onClick={() => setDropdownOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF8C00')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}>
                                <div style={{ width: '26px', height: '26px', background: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#0D0D0D', flexShrink: 0 }}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#FFF', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user.displayName}
                                </span>
                                <ChevronDown size={13} color="#888" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>

                            {dropdownOpen && (
                                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '10px', minWidth: '190px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #222' }}>
                                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, color: '#FFF', fontSize: '0.9rem' }}>{user.displayName}</div>
                                        <div style={{ color: '#555', fontSize: '0.72rem', marginTop: '2px' }}>{user.email}</div>
                                    </div>
                                    <Link to="/orders" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', color: '#CCC', textDecoration: 'none', fontSize: '0.85rem', fontFamily: '"Nunito", sans-serif' }}
                                          onMouseEnter={e => (e.currentTarget.style.background = '#222')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <ClipboardList size={15} color="#FF8C00" /> Mes commandes
                                    </Link>
                                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid #222', color: '#F87171', fontSize: '0.85rem', fontFamily: '"Nunito", sans-serif', cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#220000')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <LogOut size={15} /> Se déconnecter
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                            <Link to="/login"><button className="btn-outline" style={{ padding: '5px 14px', fontSize: '0.82rem' }}>Connexion</button></Link>
                            <Link to="/register"><button className="btn-primary" style={{ padding: '5px 14px', fontSize: '0.82rem' }}>S'inscrire</button></Link>
                        </div>
                    )}
                </nav>

                {/* Burger + panier mobile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="mobile-burger">
                    <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
                        <ShoppingBag size={20} color={totalItems > 0 ? '#FF8C00' : '#888'} />
                        {totalItems > 0 && (
                            <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#FF8C00', color: '#0D0D0D', fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.62rem', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {totalItems > 9 ? '9+' : totalItems}
                            </span>
                        )}
                    </Link>
                    <button onClick={() => setMobileMenuOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#FFF' }}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Menu mobile */}
            {mobileMenuOpen && (
                <div style={{ position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, background: '#0D0D0D', zIndex: 99, borderTop: '1px solid #222', display: 'flex', flexDirection: 'column', padding: '24px 20px', gap: '8px', overflowY: 'auto' }}>
                    {navLinks.map(link => (
                        <Link key={link.href} to={link.href} style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1.4rem', textTransform: 'uppercase', color: isActive(link.href) ? '#FF8C00' : '#FFF', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #1A1A1A' }}>
                            {link.label}
                        </Link>
                    ))}

                    {isAuthenticated && user ? (
                        <>
                            <div style={{ padding: '12px 0', borderBottom: '1px solid #1A1A1A' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#0D0D0D' }}>
                                        {user.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ color: '#FFF', fontWeight: 600, fontFamily: '"Nunito", sans-serif' }}>{user.displayName}</div>
                                        <div style={{ color: '#555', fontSize: '0.75rem' }}>{user.email}</div>
                                    </div>
                                </div>
                            </div>
                            <Link to="/orders" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1.2rem', textTransform: 'uppercase', color: '#CCC', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #1A1A1A' }}>
                                Mes commandes
                            </Link>
                            <button onClick={handleLogout} style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1.2rem', textTransform: 'uppercase', color: '#F87171', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', textAlign: 'left' }}>
                                Se déconnecter
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            <Link to="/login"><button className="btn-outline" style={{ width: '100%', fontSize: '1rem', padding: '12px' }}>Connexion</button></Link>
                            <Link to="/register"><button className="btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '12px' }}>S'inscrire</button></Link>
                        </div>
                    )}
                </div>
            )}

            <main style={{ flex: 1 }}>{children}</main>

            <footer style={{ background: '#111', borderTop: '1px solid #1A1A1A', padding: '24px 16px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1rem', color: '#FF8C00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spot Gourmand</div>
                        <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '2px' }}>Sandwicherie · Pasta Bar · Coffee Room</div>
                    </div>
                    <div style={{ color: '#444', fontSize: '0.75rem', textAlign: 'right' }}>
                        <div>Lun–Ven : 8h – 21h · Sam : 9h – 22h</div>
                        <div style={{ marginTop: '2px' }}>© {new Date().getFullYear()} Spot Gourmand</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}