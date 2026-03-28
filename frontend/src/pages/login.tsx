import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/utils/validation';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login({ email, password });
            navigate('/');
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0D0D0D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <div style={{
                            fontFamily: '"Oswald", sans-serif',
                            fontWeight: 700,
                            fontSize: '2rem',
                            color: '#FFFFFF',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>
                            Spot<span style={{ color: '#FF8C00' }}> Gourmand</span>
                        </div>
                        <div style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '4px' }}>
                            Sandwicherie · Pasta Bar
                        </div>
                    </Link>
                </div>

                {/* Card */}
                <div style={{
                    background: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '12px',
                    padding: '32px',
                }}>
                    <div className="section-header" style={{ marginBottom: '28px' }}>
                        Connexion
                    </div>

                    {error && (
                        <div style={{
                            background: '#1A0A0A',
                            border: '1px solid #5A1A1A',
                            borderRadius: '6px',
                            padding: '12px 16px',
                            marginBottom: '20px',
                            color: '#FF6B6B',
                            fontSize: '0.85rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Oswald", sans-serif', marginBottom: '6px' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="votre@email.com"
                                style={{
                                    width: '100%',
                                    background: '#111',
                                    border: '1px solid #333',
                                    borderRadius: '6px',
                                    padding: '10px 14px',
                                    color: '#FFF',
                                    fontSize: '0.9rem',
                                    fontFamily: '"Nunito", sans-serif',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#FF8C00'}
                                onBlur={e => e.target.style.borderColor = '#333'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Oswald", sans-serif', marginBottom: '6px' }}>
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    background: '#111',
                                    border: '1px solid #333',
                                    borderRadius: '6px',
                                    padding: '10px 14px',
                                    color: '#FFF',
                                    fontSize: '0.9rem',
                                    fontFamily: '"Nunito", sans-serif',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#FF8C00'}
                                onBlur={e => e.target.style.borderColor = '#333'}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading}
                            style={{ width: '100%', marginTop: '8px', opacity: isLoading ? 0.7 : 1 }}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px', color: '#555', fontSize: '0.85rem' }}>
                        Pas encore de compte ?{' '}
                        <Link to="/register" style={{ color: '#FF8C00', textDecoration: 'none', fontWeight: 600 }}>
                            S'inscrire
                        </Link>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link to="/" style={{ color: '#555', fontSize: '0.8rem', textDecoration: 'none' }}>
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}