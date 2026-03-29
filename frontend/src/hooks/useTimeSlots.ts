import { useState, useEffect, useCallback } from 'react';
import { timeSlotsApi } from '@/api';
import { TimeSlotModel } from '@/models';

/**
 * Créneaux disponibles pour une date donnée
 */
export function useAvailableTimeSlots(date: string) {
    const [slots, setSlots] = useState<TimeSlotModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSlots = useCallback(async () => {
        if (!date) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await timeSlotsApi.getAvailableSlots(date);
            setSlots(data);
        } catch {
            setError('Impossible de charger les créneaux');
        } finally {
            setIsLoading(false);
        }
    }, [date]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    return { slots, isLoading, error, refetch: fetchSlots };
}