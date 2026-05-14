import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { UserRole } from '@/models/user.model';
import { LogOut, ClipboardList, ChevronDown, Menu, X, ShoppingBag, LayoutDashboard } from 'lucide-react';
import styles from './appLayouth.module.css';

interface AppLayoutProps { children: ReactNode; }

export function AppLayout({ children }: AppLayoutProps) {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const { totalItems } = useCart();
    const [dropdownOpen,   setDropdownOpen]   = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLOYEE;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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
        <Link
            to="/cart"
            className={`${styles.cartBtn} ${totalItems > 0 ? styles.cartBtnActive : ''}`}
        >
            <ShoppingBag size={size} color={totalItems > 0 ? 'var(--sg-amber)' : '#52525B'} />
            {totalItems > 0 && (
                <span className={styles.cartBadge}>
                    {totalItems > 9 ? '9+' : totalItems}
                </span>
            )}
        </Link>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0A0C' }}>

            <header className={styles.navbar}>
                {/* Logo */}
                <Link to="/" className={styles.logoLink}>
                    <div className={styles.logoIcon}>
                        <span className={styles.logoIconText}>SG</span>
                    </div>
                    <div>
                        <div className={styles.logoName}>
                            Spot<span className={styles.logoAccent}> Gourmand</span>
                        </div>
                        <div className={styles.logoSub}>Sandwicherie · Pasta Bar</div>
                    </div>
                </Link>

                {/* Nav desktop */}
                <nav className={styles.nav}>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''} hide-mobile`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className={`${styles.navSeparator} hide-mobile`} />

                    <div className="hide-mobile">
                        <CartBtn />
                    </div>

                    {/* User connecté */}
                    {isAuthenticated && user ? (
                        <div ref={dropdownRef} style={{ position: 'relative' }} className="hide-mobile">
                            <button className={styles.userBtn} onClick={() => setDropdownOpen(p => !p)}>
                                <div className={styles.userAvatar}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className={styles.userName}>{user.displayName}</span>
                                <ChevronDown
                                    size={12}
                                    color="#52525B"
                                    style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                                />
                            </button>

                            {dropdownOpen && (
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownInfo}>
                                        <div className={styles.dropdownName}>{user.displayName}</div>
                                        <div className={styles.dropdownEmail}>{user.email}</div>
                                    </div>

                                    <Link
                                        to="/orders"
                                        onClick={() => setDropdownOpen(false)}
                                        className={styles.dropdownItem}
                                    >
                                        <ClipboardList size={14} color="var(--sg-amber)" />
                                        Mes commandes
                                    </Link>

                                    {isAdmin && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setDropdownOpen(false)}
                                            className={`${styles.dropdownItem} ${styles.dropdownItemAdmin}`}
                                        >
                                            <LayoutDashboard size={14} color="var(--sg-amber)" />
                                            Administration
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className={`${styles.dropdownItem} ${styles.dropdownItemLogout}`}
                                    >
                                        <LogOut size={14} />
                                        Se déconnecter
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`${styles.guestButtons} hide-mobile`}>
                            <Link to="/login">
                                <button className="btn-outline" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                                    Connexion
                                </button>
                            </Link>
                            <Link to="/register">
                                <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                                    S'inscrire
                                </button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile */}
                    <div className={`${styles.mobileControls} show-mobile`}>
                        <CartBtn size={20} />
                        <button className={styles.burgerBtn} onClick={() => setMobileMenuOpen(p => !p)}>
                            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </nav>
            </header>

            {/* Menu mobile */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`${styles.mobileLink} ${isActive(link.href) ? styles.mobileLinkActive : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {isAuthenticated && user ? (
                        <>
                            <div className={styles.mobileUserInfo}>
                                <div className={styles.mobileAvatar}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className={styles.mobileUserName}>{user.displayName}</div>
                                    <div className={styles.mobileUserEmail}>{user.email}</div>
                                </div>
                            </div>

                            <Link to="/orders" className={styles.mobileSectionLink}>
                                Mes commandes
                            </Link>

                            {isAdmin && (
                                <Link to="/admin" className={styles.mobileAdminLink}>
                                    <LayoutDashboard size={18} />
                                    Administration
                                </Link>
                            )}

                            <button onClick={handleLogout} className={styles.mobileLogout}>
                                Se déconnecter
                            </button>
                        </>
                    ) : (
                        <div className={styles.mobileGuestButtons}>
                            <Link to="/login">
                                <button className="btn-outline">Connexion</button>
                            </Link>
                            <Link to="/register">
                                <button className="btn-primary">S'inscrire</button>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            <main style={{ flex: 1 }}>{children}</main>

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div>
                        <div className={styles.footerBrand}>Spot Gourmand</div>
                        <div className={styles.footerSub}>Sandwicherie · Pasta Bar · Coffee Room</div>
                    </div>
                    <div className={styles.footerMeta}>
                        <div>Lun–Ven : 8h – 21h · Sam : 9h – 22h</div>
                        <div style={{ marginTop: '2px' }}>© {new Date().getFullYear()} Spot Gourmand</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}