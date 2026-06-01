import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
    isLoading?: boolean;
}

export function ConfirmModal({
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Non, garder',
    onConfirm,
    onClose,
    isLoading = false,
}: ConfirmModalProps) {

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose} aria-modal="true" role="dialog">
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
                    <X size={18} />
                </button>

                <div className={styles.iconWrapper}>
                    <AlertTriangle size={26} color="#EF4444" />
                </div>

                <h2 className={styles.title}>{title}</h2>
                <p className={styles.message}>{message}</p>

                <div className={styles.actions}>
                    <button
                        className={styles.keepBtn}
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className={styles.confirmBtn}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'En cours…' : confirmLabel}
                    </button>
                </div>

            </div>
        </div>
    );
}
