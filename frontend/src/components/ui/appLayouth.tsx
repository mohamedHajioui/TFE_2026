import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, ClipboardList, ChevronDown } from 'lucide-react';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fermer le menu si on clique ailleurs
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const navLinks = [
        { href: '/',         label: 'Accueil' },
        { href: '/products', label: 'Carte' },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>

            {/* ── Navbar ──────────────────────────────────────────────────── */}
            <header style={{
                background: '#0D0D0D',
                borderBottom: '2px solid #FF8C00',
                padding: '0 24px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}>
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '38px', height: '38px',
                        background: '#FF8C00',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0D0D0D' }}>SG</span>
                    </div>
                    <div>
                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#FFFFFF', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
                            Spot<span style={{ color: '#FF8C00' }}> Gourmand</span>
                        </div>
                        <div style={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.62rem', color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            Sandwicherie · Pasta Bar
                        </div>
                    </div>
                </Link>

                {/* Nav */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {navLinks.map(link => (
                        <Link key={link.href} to={link.href} style={{
                            fontFamily: '"Oswald", sans-serif',
                            fontWeight: 500,
                            fontSize: '0.88rem',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: location.pathname === link.href ? '#FF8C00' : '#AAA',
                            textDecoration: 'none',
                            padding: '6px 14px',
                            borderBottom: location.pathname === link.href ? '2px solid #FF8C00' : '2px solid transparent',
                            transition: 'color 0.2s',
                        }}>
                            {link.label}
                        </Link>
                    ))}

                    {/* ── Connecté : nom + dropdown ── */}
                    {isAuthenticated && user ? (
                        <div ref={menuRef} style={{ position: 'relative', marginLeft: '8px' }}>
                            <button
                                onClick={() => setMenuOpen(prev => !prev)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#1A1A1A',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF8C00')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}
                            >
                                {/* Avatar initiale */}
                                <div style={{
                                    width: '28px', height: '28px',
                                    background: '#FF8C00',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: '"Oswald", sans-serif',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    color: '#0D0D0D',
                                    flexShrink: 0,
                                }}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#FFF' }}>
                                    {user.displayName}
                                </span>
                                <ChevronDown size={14} color="#888" style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                            </button>

                            {/* Dropdown */}
                            {menuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    background: '#1A1A1A',
                                    border: '1px solid #2A2A2A',
                                    borderRadius: '10px',
                                    minWidth: '200px',
                                    overflow: 'hidden',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                }}>
                                    {/* Infos user */}
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #222' }}>
                                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, color: '#FFF', fontSize: '0.95rem' }}>
                                            {user.displayName}
                                        </div>
                                        <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '2px' }}>
                                            {user.email}
                                        </div>
                                    </div>

                                    {/* Mes commandes */}
                                    <Link
                                        to="/orders"
                                        onClick={() => setMenuOpen(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 16px',
                                            color: '#CCC',
                                            textDecoration: 'none',
                                            fontSize: '0.88rem',
                                            fontFamily: '"Nunito", sans-serif',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <ClipboardList size={16} color="#FF8C00" />
                                        Mes commandes
                                    </Link>

                                    {/* Déconnexion */}
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            borderTop: '1px solid #222',
                                            color: '#F87171',
                                            fontSize: '0.88rem',
                                            fontFamily: '"Nunito", sans-serif',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#220000')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <LogOut size={16} />
                                        Se déconnecter
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── Non connecté : boutons login/register ── */
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                            <Link to="/login">
                                <button className="btn-outline" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                                    Connexion
                                </button>
                            </Link>
                            <Link to="/register">
                                <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                                    S'inscrire
                                </button>
                            </Link>
                        </div>
                    )}
                </nav>
            </header>

            {/* ── Contenu ─────────────────────────────────────────────────── */}
            <main style={{ flex: 1 }}>
                {children}
            </main>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <footer style={{ background: '#111', borderTop: '1px solid #1A1A1A', padding: '32px 24px', marginTop: 'auto' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#FF8C00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Spot Gourmand
                        </div>
                        <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '4px' }}>
                            Sandwicherie · Pasta Bar · Coffee Room
                        </div>
                    </div>
                    <div style={{ color: '#444', fontSize: '0.8rem', textAlign: 'right' }}>
                        <div>Lun–Ven : 8h – 21h · Sam : 9h – 22h</div>
                        <div style={{ marginTop: '4px' }}>© {new Date().getFullYear()} Spot Gourmand</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}