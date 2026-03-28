import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage, getPasswordErrors } from '@/utils/validation';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', displayName: '', password: '', phoneNumber: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const passwordErrors = form.password.length > 0 ? getPasswordErrors(form.password) : [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (passwordErrors.length > 0) return;
        setIsLoading(true);
        try {
            await register({
                email: form.email,
                displayName: form.displayName,
                password: form.password,
                phoneNumber: form.phoneNumber || undefined,
            });
            navigate('/');
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        background: '#111',
        border: '1px solid #333',
        borderRadius: '6px',
        padding: '10px 14px',
        color: '#FFF',
        fontSize: '0.9rem',
        fontFamily: '"Nunito", sans-serif',
        outline: 'none',
        boxSizing: 'border-box' as const,
    };

    const labelStyle = {
        display: 'block',
        color: '#888',
        fontSize: '0.78rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        fontFamily: '"Oswald", sans-serif',
        marginBottom: '6px',
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: '2rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Spot<span style={{ color: '#FF8C00' }}> Gourmand</span>
                        </div>
                        <div style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '4px' }}>
                            Sandwicherie · Pasta Bar
                        </div>
                    </Link>
                </div>

                <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '32px' }}>
                    <div className="section-header" style={{ marginBottom: '28px' }}>Créer un compte</div>

                    {error && (
                        <div style={{ background: '#1A0A0A', border: '1px solid #5A1A1A', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px', color: '#FF6B6B', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Prénom / Pseudo</label>
                            <input name="displayName" type="text" value={form.displayName} onChange={handleChange} required placeholder="Votre nom" style={inputStyle}
                                   onFocus={e => e.target.style.borderColor = '#FF8C00'} onBlur={e => e.target.style.borderColor = '#333'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="votre@email.com" style={inputStyle}
                                   onFocus={e => e.target.style.borderColor = '#FF8C00'} onBlur={e => e.target.style.borderColor = '#333'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Téléphone (optionnel)</label>
                            <input name="phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange} placeholder="+32470123456" style={inputStyle}
                                   onFocus={e => e.target.style.borderColor = '#FF8C00'} onBlur={e => e.target.style.borderColor = '#333'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Mot de passe</label>
                            <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" style={inputStyle}
                                   onFocus={e => e.target.style.borderColor = '#FF8C00'} onBlur={e => e.target.style.borderColor = '#333'} />
                            {passwordErrors.length > 0 && (
                                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {passwordErrors.map((err, i) => (
                                        <span key={i} style={{ color: '#FF6B6B', fontSize: '0.75rem' }}>• {err}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn-primary" disabled={isLoading || passwordErrors.length > 0}
                                style={{ width: '100%', marginTop: '8px', opacity: (isLoading || passwordErrors.length > 0) ? 0.7 : 1 }}>
                            {isLoading ? 'Création...' : 'Créer mon compte'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px', color: '#555', fontSize: '0.85rem' }}>
                        Déjà un compte ?{' '}
                        <Link to="/login" style={{ color: '#FF8C00', textDecoration: 'none', fontWeight: 600 }}>Se connecter</Link>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link to="/" style={{ color: '#555', fontSize: '0.8rem', textDecoration: 'none' }}>← Retour à l'accueil</Link>
                </div>
            </div>
        </div>
    );
}