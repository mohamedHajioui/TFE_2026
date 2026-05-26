import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/utils/validation';
import styles from './auth.module.css';
import {GoogleButton} from "@/components/ui/google-button.tsx";

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.get('error') === 'google_failed') {
            setError('La connexion avec Google a échoué. Réessayez.');
        }
    }, [params]);

    useEffect(() => {
        if (isAuthenticated) navigate('/');
    }, [isAuthenticated, navigate]);

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
                    <div className={`section-header ${styles.cardTitle}`}>Connexion</div>

                    <GoogleButton mode="login" />

                    <div className={styles.separator}>
                        <span className={styles.separatorLine} />
                        <span className={styles.separatorText}>ou</span>
                        <span className={styles.separatorLine} />
                    </div>

                    {error && <div className={styles.errorBox}>{error}</div>}

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="votre@email.com"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className={styles.input}
                            />
                        </div>
                        <button
                            type="submit"
                            className={`btn-primary ${styles.submitBtn}`}
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.7 : 1 }}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    <div className={styles.cardFooter}>
                        Pas encore de compte ?{' '}
                        <Link to="/register" className={styles.cardFooterLink}>S'inscrire</Link>
                    </div>
                </div>

                <Link to="/" className={styles.backLink}>← Retour à l'accueil</Link>
            </div>
        </div>
    );
}