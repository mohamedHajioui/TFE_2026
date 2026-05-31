import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { UserRole } from '@/models/user.model';
import {
    LogOut,
    ClipboardList,
    ChevronDown,
    Menu,
    X,
    ShoppingBag,
    LayoutDashboard,
    UserCog,
} from 'lucide-react';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CartBottomBar } from '@/components/cart/CartBottomBar';
import { CartToast } from '@/components/cart/CartToast';
import styles from './AppLayout.module.css';

interface AppLayoutProps { children: ReactNode; }

export function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const { totalItems, openDrawer } = useCart();
    const [dropdownOpen, setDropdownOpen] = useState(false);
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
        { href: '/', label: 'Accueil' },
        { href: '/menus', label: 'Menus' },
        { href: '/products', label: 'Carte' },
    ];

    const isActive = (href: string) => location.pathname === href;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.bgOverlay} />

            <header className={styles.navbar}>

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

                <nav className={`${styles.nav} hide-mobile`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className={styles.navSeparator} />

                    <button
                        type="button"
                        onClick={openDrawer}
                        className={`${styles.cartBtn} ${totalItems > 0 ? styles.cartBtnActive : ''}`}
                        aria-label="Ouvrir le panier"
                    >
                        <ShoppingBag size={18} color={totalItems > 0 ? 'var(--sg-amber)' : '#52525B'} />
                        {totalItems > 0 && (
                            <span className={styles.cartBadge}>{totalItems > 9 ? '9+' : totalItems}</span>
                        )}
                    </button>

                    {isAuthenticated && user ? (
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button className={styles.userBtn} onClick={() => setDropdownOpen((p) => !p)}>
                                <div className={styles.userAvatar}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className={styles.userName}>{user.displayName}</span>
                                <ChevronDown
                                    size={12}
                                    color="#52525B"
                                    style={{
                                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                                        transition: 'transform 0.15s',
                                    }}
                                />
                            </button>

                            {dropdownOpen && (
                                <div className={styles.dropdown}>
                                    {isAdmin && (
                                        <Link
                                            to="/admin"
                                            className={`${styles.dropdownItem} ${styles.dropdownItemAdmin}`}
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <LayoutDashboard size={14} /> Dashboard
                                        </Link>
                                    )}
                                    <Link
                                        to="/orders"
                                        className={styles.dropdownItem}
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <ClipboardList size={14} /> Mes commandes
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className={styles.dropdownItem}
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <UserCog size={14} /> Mon profil
                                    </Link>
                                    <button className={styles.dropdownItem} onClick={handleLogout}>
                                        <LogOut size={14} /> Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.guestButtons}>
                            <Link
                                to="/login"
                                className="btn-outline"
                                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                            >
                                Connexion
                            </Link>
                            <Link
                                to="/register"
                                className="btn-primary"
                                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                            >
                                Inscription
                            </Link>
                        </div>
                    )}
                </nav>

                <div className={`${styles.mobileControls} show-mobile`}>
                    <button
                        type="button"
                        onClick={openDrawer}
                        className={`${styles.cartBtn} ${totalItems > 0 ? styles.cartBtnActive : ''}`}
                        aria-label="Ouvrir le panier"
                    >
                        <ShoppingBag size={18} color={totalItems > 0 ? 'var(--sg-amber)' : '#52525B'} />
                        {totalItems > 0 && (
                            <span className={styles.cartBadge}>{totalItems > 9 ? '9+' : totalItems}</span>
                        )}
                    </button>
                    <button
                        className={styles.burgerBtn}
                        onClick={() => setMobileMenuOpen((p) => !p)}
                        aria-label="Menu"
                    >
                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

            </header>

            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    {navLinks.map((link) => (
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
                            <Link to="/profile" className={styles.mobileSectionLink}>
                                Mon profil
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

            <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>{children}</main>

            <CartToast />
            <CartBottomBar />
            <CartDrawer />
        </div>
    );
}