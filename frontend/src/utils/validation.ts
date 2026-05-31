/**
 * Vérifie si un email est valide
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Vérifie si un mot de passe respecte les règles du backend
 * (min 8 chars, majuscule, minuscule, chiffre ou caractère spécial)
 */
export function isValidPassword(password: string): boolean {
    return (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /(\d|\W)/.test(password)
    );
}

/**
 * Vérifie si un numéro de téléphone belge est valide
 * Formats acceptés: +32470123456, 0470123456
 */
export function isValidBelgianPhone(phone: string): boolean {
    return /^(\+32|0)[1-9]\d{7,8}$/.test(phone);
}

/**
 * Vérifie si un code postal belge est valide (4 chiffres)
 */
export function isValidPostalCode(postalCode: string): boolean {
    return /^\d{4}$/.test(postalCode);
}

/**
 * Retourne les erreurs de validation du mot de passe (pour affichage)
 */
export function getPasswordErrors(password: string): string[] {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Minimum 8 caractères');
    if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
    if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule');
    if (!/(\d|\W)/.test(password)) errors.push('Au moins un chiffre ou caractère spécial');
    return errors;
}

/**
 * Extrait le message d'erreur d'une réponse Axios
 */
export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const msg = (error as { response?: { data?: { message?: string | string[] } } })
            ?.response?.data?.message;
        if (Array.isArray(msg)) return msg.join(', ');
        if (typeof msg === 'string') return msg;
    }
    return fallback;
}