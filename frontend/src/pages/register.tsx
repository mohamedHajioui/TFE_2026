import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage, getPasswordErrors } from '@/utils/validation';
import styles from './auth.module.css';

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

    return (
        <div className={styles.page}>
            <div className={styles.wrapper}>

                <div className={styles.logoArea}>
                    <Link to="/" className={styles.logoLink}>
                        <div className={styles.logoText}>
                            Spot<span className={styles.logoAccent}> Gourmand</span>
                        </div>
                        <div className={styles.logoSub}>Sandwicherie · Pasta Bar</div>
                    </Link>
                </div>

                <div className={styles.card}>
                    <div className={`section-header ${styles.cardTitle}`}>Créer un compte</div>

                    {error && <div className={styles.errorBox}>{error}</div>}

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Prénom / Pseudo</label>
                            <input
                                name="displayName"
                                type="text"
                                value={form.displayName}
                                onChange={handleChange}
                                required
                                placeholder="Votre nom"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="votre@email.com"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Téléphone (optionnel)</label>
                            <input
                                name="phoneNumber"
                                type="tel"
                                value={form.phoneNumber}
                                onChange={handleChange}
                                placeholder="+32470123456"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mot de passe</label>
                            <input
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className={styles.input}
                            />
                            {passwordErrors.length > 0 && (
                                <div className={styles.passwordErrors}>
                                    {passwordErrors.map((err, i) => (
                                        <span key={i} className={styles.passwordError}>• {err}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            className={`btn-primary ${styles.submitBtn}`}
                            disabled={isLoading || passwordErrors.length > 0}
                            style={{ opacity: (isLoading || passwordErrors.length > 0) ? 0.7 : 1 }}
                        >
                            {isLoading ? 'Création...' : 'Créer mon compte'}
                        </button>
                    </form>

                    <div className={styles.cardFooter}>
                        Déjà un compte ?{' '}
                        <Link to="/login" className={styles.cardFooterLink}>Se connecter</Link>
                    </div>
                </div>

                <Link to="/" className={styles.backLink}>← Retour à l'accueil</Link>
            </div>
        </div>
    );
}