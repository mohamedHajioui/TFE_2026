import { useState, useRef, useCallback } from 'react';

export interface AddressSuggestion {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
    lat: number;
    lng: number;
    raw: {
        road?: string;
        house_number?: string;
        postcode?: string;
        city?: string;
        town?: string;
        village?: string;
        country?: string;
    };
}

export interface ResolvedAddress {
    street: string;
    number: string;
    box: string;
    postalCode: string;
    city: string;
    country: string;
    complement: string;
    lat: number;
    lng: number;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: {
        road?: string;
        house_number?: string;
        postcode?: string;
        city?: string;
        town?: string;
        village?: string;
        country?: string;
        municipality?: string;
    };
}

/**
 * Hook d'autocomplétion d'adresse via Nominatim (OpenStreetMap).
 * La recherche est déclenchée manuellement via `search(query)`.
 */
export function useAddressAutocomplete() {
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [resolved, setResolved] = useState<ResolvedAddress | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    /**
     * Lance la recherche avec debounce.
     * Appelée à chaque frappe dans l'input.
     */
    const search = useCallback((query: string) => {
        // Annuler le timer précédent
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        // Pas assez de caractères → vider
        if (!query || query.length < 3) {
            setSuggestions([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        debounceTimer.current = setTimeout(async () => {
            // Annuler la requête précédente
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            try {
                const params = new URLSearchParams({
                    q: query,
                    format: 'json',
                    addressdetails: '1',
                    limit: '5',
                    countrycodes: 'be',
                    'accept-language': 'fr',
                });

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                    {
                        signal: abortRef.current!.signal,
                        headers: { 'Accept-Language': 'fr' },
                    },
                );

                if (!response.ok) {
                    setIsLoading(false);
                    return;
                }

                const results: NominatimResult[] = await response.json();

                // Dédupliquer par coordonnées (arrondi à 4 décimales)
                const seen = new Set<string>();
                const unique = results.filter(r => {
                    const key = `${parseFloat(r.lat).toFixed(4)},${parseFloat(r.lon).toFixed(4)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                setSuggestions(
                    unique.map(r => {
                        const addr = r.address;
                        const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '';
                        const mainText = [addr.road, addr.house_number].filter(Boolean).join(' ') || r.display_name.split(',')[0];
                        const secondaryText = [addr.postcode, city, 'Belgique'].filter(Boolean).join(', ');

                        return {
                            placeId: String(r.place_id),
                            description: r.display_name,
                            mainText,
                            secondaryText,
                            lat: parseFloat(r.lat),
                            lng: parseFloat(r.lon),
                            raw: {
                                road: addr.road,
                                house_number: addr.house_number,
                                postcode: addr.postcode,
                                city,
                                country: addr.country,
                            },
                        };
                    }),
                );
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('[Nominatim] Erreur:', err);
                }
            } finally {
                setIsLoading(false);
            }
        }, 400);
    }, []);

    /**
     * Sélectionne une suggestion et résout l'adresse complète.
     */
    const selectSuggestion = useCallback((suggestion: AddressSuggestion) => {
        setSuggestions([]);

        setResolved({
            street: suggestion.raw.road ?? '',
            number: suggestion.raw.house_number ?? '',
            box: '',
            postalCode: suggestion.raw.postcode ?? '',
            city: suggestion.raw.city ?? '',
            country: 'Belgium',
            complement: '',
            lat: suggestion.lat,
            lng: suggestion.lng,
        });

        // Retourner le label formaté pour que le composant l'affiche
        const label = [suggestion.raw.road, suggestion.raw.house_number]
            .filter(Boolean)
            .join(' ') || suggestion.mainText;
        return `${label}, ${suggestion.secondaryText}`;
    }, []);

    const clearSuggestions = useCallback(() => setSuggestions([]), []);

    return {
        suggestions,
        selectSuggestion,
        resolved,
        isLoading,
        search,
        clearSuggestions,
    };
}
