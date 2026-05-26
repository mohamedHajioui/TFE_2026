import { useState } from 'react';
import { usersApi } from '@/api/users.api';
import { Phone, X } from 'lucide-react';
import styles from './phoneModal.module.css';

interface PhoneModalProps {
    onSuccess: (phone: string) => void;
    onClose: () => void;
}

/**
 * Modal affiché quand un user connecté essaie de passer commande
 * sans avoir renseigné son numéro de téléphone.
 *
 * L'admin peut contacter le client par SMS pour toute question sur la commande.
 * Demandé par le client (obligation métier).
 */
export function PhoneModal({ onSuccess, onClose }: PhoneModalProps) {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleaned = phone.trim();
        if (!cleaned || cleaned.length < 8) {
            setError('Numéro invalide (minimum 8 chiffres)');
            return;
        }

        setIsLoading(true);
        try {
            await usersApi.updateMyProfile({ phoneNumber: cleaned });
            onSuccess(cleaned);
        } catch {
            setError('Impossible de sauvegarder. Réessayez.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
                    <X size={18} />
                </button>

                <div className={styles.iconWrapper}>
                    <Phone size={28} color="#0A0A0C" />
                </div>

                <h2 className={styles.title}>Numéro de téléphone requis</h2>
                <p className={styles.desc}>
                    Votre numéro est nécessaire pour que nous puissions vous contacter
                    en cas de question sur votre commande.
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="tel"
                        className={styles.input}
                        placeholder="+32 470 12 34 56"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        autoFocus
                        required
                    />
                    {error && <div className={styles.error}>{error}</div>}
                    <button
                        type="submit"
                        className={`btn-primary ${styles.submitBtn}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enregistrement...' : 'Continuer vers le paiement'}
                    </button>
                </form>
            </div>
        </div>
    );
}