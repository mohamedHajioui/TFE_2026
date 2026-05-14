import { Expose, Transform } from 'class-transformer';

export class AddressModel {
    @Expose()
    id: number;

    @Expose()
    street: string;

    @Expose()
    number: string;

    @Expose()
    box: string | null;

    @Expose()
    postalCode: string;

    @Expose()
    city: string;

    @Expose()
    country: string;

    @Expose()
    complement: string | null;

    @Expose()
    label: string | null;

    @Expose()
    isDefault: boolean;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    createdAt: Date | null;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    updatedAt: Date | null;

    // Helper : adresse formatée sur une ligne
    get fullAddress(): string {
        const parts = [
            `${this.street} ${this.number}${this.box ? ` bte ${this.box}` : ''}`,
            `${this.postalCode} ${this.city}`,
            this.country,
        ];
        return parts.join(', ');
    }

    // Helper : adresse courte (rue + numéro + ville)
    get shortAddress(): string {
        return `${this.street} ${this.number}, ${this.city}`;
    }
}