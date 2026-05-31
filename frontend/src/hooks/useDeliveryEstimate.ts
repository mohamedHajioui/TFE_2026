import { useState, useEffect } from 'react';
import { apiClient } from '@/api/axios.config';

export interface DeliveryEstimate {
    fee: number;
    distanceKm: number;
    outOfRange: boolean;
    label: string;
}

/**
 * Appelle POST /api/orders/delivery-estimate dès que lat/lng change.
 * Le prix est calculé côté backend — aucun calcul ici.
 */
export function useDeliveryEstimate(lat: number | null, lng: number | null) {
    const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (lat === null || lng === null) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEstimate(null);
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        apiClient
            .post<DeliveryEstimate>('/orders/delivery-estimate', { customerLat: lat, customerLng: lng })
            .then(res => { if (!cancelled) setEstimate(res.data); })
            .catch(() => { if (!cancelled) setEstimate(null); })
            .finally(() => { if (!cancelled) setIsLoading(false); });

        return () => { cancelled = true; };
    }, [lat, lng]);

    return {
        fee: estimate?.fee ?? 0,
        distanceKm: estimate?.distanceKm ?? null,
        outOfRange: estimate?.outOfRange ?? false,
        label: estimate?.label ?? '—',
        isLoading,
    };
}