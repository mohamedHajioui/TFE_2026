import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users.api';
import { getApiErrorMessage } from '@/utils/validation';
import { User, Lock, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import styles from './profile.module.css';

export default function Profile() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading, refreshUser } = useAuth();

    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) navigate('/login', { replace: true });
    }, [isLoading, isAuthenticated, navigate]);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName ?? '');
            setPhoneNumber(user.phoneNumber ?? '');
        }
    }, [user]);

    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(null);
        setProfileLoading(true);

        try {
            await usersApi.updateMyProfile({
                displayName: displayName.trim() || undefined,
                phoneNumber: phoneNumber.trim() || undefined,
            });
            await refreshUser();
            setProfileSuccess('Profil mis à jour avec succès.');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err);
            setProfileError(message);
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword !== confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas.');
            return;
        }

        setPasswordLoading(true);

        try {
            await usersApi.changePassword({
                currentPassword,
                newPassword,
            });
            setPasswordSuccess('Mot de passe modifié avec succès.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err);
            setPasswordError(message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

    if (isLoading) {
        return (
            <AppLayout>
                <div className={styles.loadingPage}>
                    <div className="spinner" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className="section-header">Mon profil</div>
                    <p className={styles.headerSub}>
                        Modifiez vos informations personnelles et votre mot de passe.
                    </p>
                </div>

                <section className={`card-dark ${styles.section}`}>
                    <h2 className={styles.sectionTitle}>
                        <User size={18} className={styles.sectionTitleIcon} />
                        Informations personnelles
                    </h2>

                    <form className={styles.form} onSubmit={handleProfileSubmit}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                className={styles.inputDisabled}
                                value={user?.email ?? ''}
                                disabled
                            />
                            <div className={styles.infoRow}>
                                <Info size={12} />
                                <span>L'email ne peut pas être modifié.</span>
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Nom d'affichage</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                minLength={3}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Numéro de téléphone</label>
                            <input
                                type="tel"
                                className={styles.input}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+32 470 12 34 56"
                            />
                        </div>

                        {profileError && (
                            <div className={styles.errorBox}>
                                <AlertCircle size={14} /> {profileError}
                            </div>
                        )}
                        {profileSuccess && (
                            <div className={styles.successBox}>
                                <CheckCircle2 size={14} /> {profileSuccess}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`btn-primary ${styles.submitBtn}`}
                            disabled={profileLoading}
                        >
                            {profileLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    </form>
                </section>

                {user?.hasPassword === false ? (
                    <section className={`card-dark ${styles.section}`}>
                        <h2 className={styles.sectionTitle}>
                            <Lock size={18} className={styles.sectionTitleIcon} />
                            Mot de passe
                        </h2>
                        <div className={styles.googleBadge}>
                            🔒 Votre compte est lié à Google — la connexion se fait via Google, pas de mot de passe à gérer.
                        </div>
                    </section>
                ) : (
                <section className={`card-dark ${styles.section}`}>
                    <h2 className={styles.sectionTitle}>
                        <Lock size={18} className={styles.sectionTitleIcon} />
                        Modifier le mot de passe
                    </h2>

                    <form className={styles.form} onSubmit={handlePasswordSubmit}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mot de passe actuel</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Nouveau mot de passe</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            {newPassword.length > 0 && (
                                <div className={styles.passwordHints}>
                                    <span className={hasMinLength ? styles.hintValid : styles.hintInvalid}>
                                        {hasMinLength ? '✓' : '○'} Minimum 8 caractères
                                    </span>
                                    <span className={hasUppercase ? styles.hintValid : styles.hintInvalid}>
                                        {hasUppercase ? '✓' : '○'} Une majuscule
                                    </span>
                                    <span className={hasLowercase ? styles.hintValid : styles.hintInvalid}>
                                        {hasLowercase ? '✓' : '○'} Une minuscule
                                    </span>
                                    <span className={hasNumber ? styles.hintValid : styles.hintInvalid}>
                                        {hasNumber ? '✓' : '○'} Un chiffre
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Confirmer le nouveau mot de passe</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            {confirmPassword.length > 0 && (
                                <div className={styles.passwordHints}>
                                    <span className={passwordsMatch ? styles.hintValid : styles.hintInvalid}>
                                        {passwordsMatch ? '✓' : '○'} Les mots de passe correspondent
                                    </span>
                                </div>
                            )}
                        </div>

                        {passwordError && (
                            <div className={styles.errorBox}>
                                <AlertCircle size={14} /> {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className={styles.successBox}>
                                <CheckCircle2 size={14} /> {passwordSuccess}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`btn-primary ${styles.submitBtn}`}
                            disabled={
                                passwordLoading ||
                                !hasMinLength || !hasUppercase || !hasLowercase || !hasNumber ||
                                !passwordsMatch
                            }
                        >
                            {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}
                        </button>
                    </form>
                </section>
                )}
            </div>
        </AppLayout>
    );
}

