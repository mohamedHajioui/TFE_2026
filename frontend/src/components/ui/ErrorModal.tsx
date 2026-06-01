import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import styles from './ErrorModal.module.css';

interface ErrorModalProps {
    title?: string;
    message: string;
    onClose: () => void;
}

export function ErrorModal({ title = 'Action impossible', message, onClose }: ErrorModalProps) {

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose} aria-modal="true" role="alertdialog">
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
                    <X size={18} />
                </button>

                <div className={styles.iconWrapper}>
                    <AlertCircle size={26} color="#EF4444" />
                </div>

                <h2 className={styles.title}>{title}</h2>
                <p className={styles.message}>{message}</p>

                <button className={styles.closeAction} onClick={onClose}>
                    Compris
                </button>

            </div>
        </div>
    );
}
