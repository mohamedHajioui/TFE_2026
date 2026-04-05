import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { LogOut, ClipboardList, ChevronDown, Menu, X, ShoppingBag } from 'lucide-react';

interface AppLayoutProps { children: ReactNode; }

export function AppLayout({ children }: AppLayoutProps) {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const { totalItems } = useCart();
    const [dropdownOpen,   setDropdownOpen]   = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
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

    const CartBtn = ({ size = 18 }: { size?: number }) => (
        <Link to="/cart" style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '10px',
            background: totalItems > 0 ? '#FFAA0015' : '#13131A',
            border: `1px solid ${totalItems > 0 ? '#FFAA0040' : '#FFFFFF0F'}`,
            transition: 'all 0.2s', flexShrink: 0,
        }}>
            <ShoppingBag size={size} color={totalItems > 0 ? '#FFAA00' : '#52525B'} />
            {totalItems > 0 && (
                <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: '#FFAA00', color: '#0A0A0C',
                    fontFamily: '"Oswald", sans-serif', fontWeight: 700,
                    fontSize: '0.6rem', width: '17px', height: '17px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {totalItems > 9 ? '9+' : totalItems}
                </span>
            )}
        </Link>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0A0C' }}>

            <header style={{
                background: 'rgba(10,10,12,0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid #FFFFFF0A',
                padding: '0 20px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ width: '32px', height: '32px', background: '#FFAA00', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#0A0A0C' }}>SG</span>
                    </div>
                    <div>
                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: 'clamp(0.88rem, 2.5vw, 1.05rem)', color: '#F4F4F5', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                            Spot<span style={{ color: '#FFAA00' }}> Gourmand</span>
                        </div>
                        <div style={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.58rem', color: '#3F3F46', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Sandwicherie · Pasta Bar
                        </div>
                    </div>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {navLinks.map(link => (
                        <Link key={link.href} to={link.href} className="hide-mobile"
                              style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 600, fontSize: '0.88rem', color: isActive(link.href) ? '#FFAA00' : '#71717A', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', background: isActive(link.href) ? '#FFAA0012' : 'transparent', transition: 'all 0.15s' }}>
                            {link.label}
                        </Link>
                    ))}

                    <div className="hide-mobile" style={{ width: '1px', height: '20px', background: '#FFFFFF0A', margin: '0 6px' }} />
                    <div className="hide-mobile"><CartBtn /></div>

                    {isAuthenticated && user ? (
                        <div ref={dropdownRef} style={{ position: 'relative', marginLeft: '6px' }} className="hide-mobile">
                            <button onClick={() => setDropdownOpen(p => !p)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#13131A', border: '1px solid #FFFFFF0F', borderRadius: '10px', padding: '5px 10px 5px 6px', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#FFAA0040')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#FFFFFF0F')}>
                                <div style={{ width: '26px', height: '26px', background: '#FFAA00', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#0A0A0C', flexShrink: 0 }}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#F4F4F5', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user.displayName}
                                </span>
                                <ChevronDown size={12} color="#52525B" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            {dropdownOpen && (
                                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#13131A', border: '1px solid #FFFFFF0F', borderRadius: '14px', minWidth: '200px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
                                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #FFFFFF08' }}>
                                        <div style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 700, color: '#F4F4F5', fontSize: '0.88rem' }}>{user.displayName}</div>
                                        <div style={{ color: '#52525B', fontSize: '0.72rem', marginTop: '2px' }}>{user.email}</div>
                                    </div>
                                    <Link to="/orders" onClick={() => setDropdownOpen(false)}
                                          style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 14px', color: '#A1A1AA', textDecoration: 'none', fontSize: '0.85rem', fontFamily: '"Nunito", sans-serif' }}
                                          onMouseEnter={e => (e.currentTarget.style.background = '#1C1C26')}
                                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <ClipboardList size={14} color="#FFAA00" /> Mes commandes
                                    </Link>
                                    <button onClick={handleLogout}
                                            style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid #FFFFFF08', color: '#EF4444', fontSize: '0.85rem', fontFamily: '"Nunito", sans-serif', cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#1C1015')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <LogOut size={14} /> Se déconnecter
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }} className="hide-mobile">
                            <Link to="/login"><button className="btn-outline" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>Connexion</button></Link>
                            <Link to="/register"><button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>S'inscrire</button></Link>
                        </div>
                    )}

                    <div style={{ display: 'none', alignItems: 'center', gap: '8px', marginLeft: '8px' }} className="show-mobile">
                        <CartBtn size={20} />
                        <button onClick={() => setMobileMenuOpen(p => !p)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#A1A1AA', display: 'flex', alignItems: 'center' }}>
                            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </nav>
            </header>

            {mobileMenuOpen && (
                <div style={{ position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, background: 'rgba(10,10,12,0.97)', backdropFilter: 'blur(16px)', zIndex: 99, display: 'flex', flexDirection: 'column', padding: '24px 20px', gap: '4px', overflowY: 'auto' }}>
                    {navLinks.map(link => (
                        <Link key={link.href} to={link.href} style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1.5rem', textTransform: 'uppercase', color: isActive(link.href) ? '#FFAA00' : '#F4F4F5', textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid #FFFFFF08' }}>
                            {link.label}
                        </Link>
                    ))}
                    {isAuthenticated && user ? (
                        <>
                            <div style={{ padding: '14px 0', borderBottom: '1px solid #FFFFFF08', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', background: '#FFAA00', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0A0A0C' }}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ color: '#F4F4F5', fontWeight: 600, fontFamily: '"Nunito", sans-serif' }}>{user.displayName}</div>
                                    <div style={{ color: '#52525B', fontSize: '0.75rem' }}>{user.email}</div>
                                </div>
                            </div>
                            <Link to="/orders" style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1.2rem', textTransform: 'uppercase', color: '#A1A1AA', textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid #FFFFFF08' }}>
                                Mes commandes
                            </Link>
                            <button onClick={handleLogout} style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1.2rem', textTransform: 'uppercase', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 0', textAlign: 'left' }}>
                                Se déconnecter
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                            <Link to="/login"><button className="btn-outline" style={{ width: '100%', fontSize: '1rem', padding: '13px' }}>Connexion</button></Link>
                            <Link to="/register"><button className="btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '13px' }}>S'inscrire</button></Link>
                        </div>
                    )}
                </div>
            )}

            <main style={{ flex: 1 }}>{children}</main>

            <footer style={{ background: '#13131A', borderTop: '1px solid #FFFFFF08', padding: '28px 20px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#FFAA00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spot Gourmand</div>
                        <div style={{ color: '#3F3F46', fontSize: '0.75rem', marginTop: '3px', fontFamily: '"Nunito", sans-serif' }}>Sandwicherie · Pasta Bar · Coffee Room</div>
                    </div>
                    <div style={{ color: '#3F3F46', fontSize: '0.75rem', textAlign: 'right', fontFamily: '"Nunito", sans-serif' }}>
                        <div>Lun–Ven : 8h – 21h · Sam : 9h – 22h</div>
                        <div style={{ marginTop: '2px' }}>© {new Date().getFullYear()} Spot Gourmand</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}