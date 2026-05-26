import { useRef, useEffect } from 'react';
import { MapPin, Loader } from 'lucide-react';
import {
    useAddressAutocomplete,
    type ResolvedAddress,
} from '@/hooks/useAddressAutocomplete';
import styles from './AddressAutocompleteInput.module.css';

interface AddressAutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    onResolved: (address: ResolvedAddress) => void;
    placeholder?: string;
    required?: boolean;
    label?: string;
}

export function AddressAutocompleteInput({
    value,
    onChange,
    onResolved,
    placeholder = 'Votre adresse...',
    required = false,
    label,
}: AddressAutocompleteInputProps) {
    const {
        suggestions,
        selectSuggestion,
        resolved,
        isLoading,
        search,
        clearSuggestions,
    } = useAddressAutocomplete();

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (resolved) onResolved(resolved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolved]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                clearSuggestions();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [clearSuggestions]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        onChange(v);
        search(v);
    };

    const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
        const formattedLabel = selectSuggestion(suggestion);
        onChange(formattedLabel);
    };

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            {label && (
                <span className={styles.label}>
                    {label} {required && <span className={styles.required}>*</span>}
                </span>
            )}

            <div className={styles.inputWrapper}>
                <MapPin size={15} className={styles.inputIcon} />
                <input
                    type="text"
                    className={styles.input}
                    value={value}
                    onChange={handleInput}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                />
                {isLoading && (
                    <div className={styles.loader}>
                        <Loader size={14} className={styles.spin} />
                    </div>
                )}
            </div>

            {value.length > 0 && value.length < 3 && suggestions.length === 0 && (
                <div className={styles.hint}>Tapez au moins 3 caractères</div>
            )}

            {suggestions.length > 0 && (
                <ul className={styles.dropdown} role="listbox">
                    {suggestions.map(s => (
                        <li
                            key={s.placeId}
                            className={styles.suggestion}
                            role="option"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSuggestionClick(s);
                            }}
                        >
                            <MapPin size={13} className={styles.suggestionIcon} />
                            <div>
                                <div className={styles.suggestionMain}>{s.mainText}</div>
                                <div className={styles.suggestionSub}>{s.secondaryText}</div>
                            </div>
                        </li>
                    ))}
                    <li className={styles.attribution}>
                        &copy;{' '}
                        <a
                            href="https://www.openstreetmap.org/copyright"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            OpenStreetMap
                        </a>{' '}
                        contributors
                    </li>
                </ul>
            )}
        </div>
    );
}
