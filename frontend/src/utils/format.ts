export function formatPrice(value: number): string {
    return new Intl.NumberFormat('fr-BE', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

export function formatDate(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat('fr-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export function formatDateTime(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat('fr-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function formatTimeSlot(startTime: string, endTime: string): string {
    const fmt = (t: string) => t.replace(':', 'h');
    return `${fmt(startTime)} - ${fmt(endTime)}`;
}

export function formatPhone(phone: string): string {
    return phone.replace(/(\+32|0)(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}

export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + '…';
}