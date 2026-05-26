import { useEffect, useState } from 'react';
import { settingsApi } from '@/api/settings.api';

/**
 * Hook qui charge les settings publics (DELIVERY_ENABLED, DELIVERY_FEE).
 * À utiliser sur la page checkout pour savoir si on peut proposer la livraison
 * et afficher les bons frais.
 */
export function usePublicSettings() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetch = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await settingsApi.getPublic();
                if (!cancelled) setSettings(data);
            } catch {
                if (!cancelled) setError('Impossible de charger les réglages');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        fetch();
        return () => {
            cancelled = true;
        };
    }, []);

    const deliveryEnabled = settings.DELIVERY_ENABLED === 'true';
    const deliveryFee = Number(settings.DELIVERY_FEE ?? '0');

    return {
        settings,
        deliveryEnabled,
        deliveryFee: Number.isFinite(deliveryFee) ? deliveryFee : 0,
        isLoading,
        error,
    };
}