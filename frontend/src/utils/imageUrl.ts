// VITE_API_URL peut être "https://backend.run.app/api" ou "http://localhost:3000/api".
// Les images sont servies SANS le préfixe /api (ex: /uploads/xyz.jpg).
// On extrait donc l'URL de base du backend en retirant le suffixe "/api".
const rawApiUrl: string =
    (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';

export const BACKEND_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export function resolveImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_BASE_URL}${url}`;
}
