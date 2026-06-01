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
    lat: number | null;

    @Expose()
    lng: number | null;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    createdAt: Date | null;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    updatedAt: Date | null;

    get fullAddress(): string {
        const parts = [
            `${this.street} ${this.number}${this.box ? ` bte ${this.box}` : ''}`,
            `${this.postalCode} ${this.city}`,
            this.country,
        ];
        return parts.join(', ');
    }

    get shortAddress(): string {
        return `${this.street} ${this.number}, ${this.city}`;
    }
}