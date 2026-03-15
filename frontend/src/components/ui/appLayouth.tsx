import type {ReactNode} from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();

    const navLinks = [
        { href: '/',          label: 'Accueil' },
        { href: '/products',  label: 'Carte' },
        { href: '/orders',    label: 'Mes commandes' },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>

            {/* Navbar */}
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
                        fontSize: '18px',
                    }}>🥖</div>
                    <div>
                        <div style={{
                            fontFamily: '"Oswald", sans-serif',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            color: '#FFFFFF',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                        }}>Spot<span style={{ color: '#FF8C00' }}> Gourmand</span></div>
                        <div style={{
                            fontFamily: '"Nunito", sans-serif',
                            fontSize: '0.65rem',
                            color: '#888',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                        }}>Sandwicherie · Pasta Bar</div>
                    </div>
                </Link>

                {/* Nav links */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            style={{
                                fontFamily: '"Oswald", sans-serif',
                                fontWeight: 500,
                                fontSize: '0.9rem',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: location.pathname === link.href ? '#FF8C00' : '#CCC',
                                textDecoration: 'none',
                                padding: '6px 14px',
                                borderRadius: '4px',
                                borderBottom: location.pathname === link.href ? '2px solid #FF8C00' : '2px solid transparent',
                                transition: 'color 0.2s',
                            }}
                        >{link.label}</Link>
                    ))}

                    <Link to="/checkout">
                        <button className="btn-primary" style={{ marginLeft: '8px' }}>
                            Commander
                        </button>
                    </Link>
                </nav>
            </header>

            {/* Contenu */}
            <main style={{ flex: 1 }}>
                {children}
            </main>

            {/* Footer */}
            <footer style={{
                background: '#111',
                borderTop: '1px solid #222',
                padding: '32px 24px',
                marginTop: 'auto',
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{
                            fontFamily: '"Oswald", sans-serif',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: '#FF8C00',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}>Spot Gourmand</div>
                        <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px' }}>
                            Sandwicherie · Pasta Bar · Coffee Room
                        </div>
                    </div>
                    <div style={{ color: '#555', fontSize: '0.8rem', textAlign: 'right' }}>
                        <div>Lun–Ven : 8h – 21h · Sam : 9h – 22h</div>
                        <div style={{ marginTop: '4px' }}>© {new Date().getFullYear()} Spot Gourmand</div>
                    </div>
                </div>
            </footer>

        </div>
    );
}