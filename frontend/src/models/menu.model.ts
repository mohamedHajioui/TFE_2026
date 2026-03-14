import { Expose, Transform, Type } from 'class-transformer';
import { ProductModel } from './product.model';

export interface MenuCategoryConfig {
    required: boolean;
    quantity: number;
}

export interface MenuConfiguration {
    sandwich: MenuCategoryConfig;
    drink: MenuCategoryConfig;
    dessert: MenuCategoryConfig;
    side: MenuCategoryConfig;
}

export class MenuModel {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    description: string | null;

    @Expose()
    @Transform(({ value }) => parseFloat(value))
    price: number;

    @Expose()
    @Type(() => ProductModel)
    allowedProducts: ProductModel[];

    @Expose()
    configuration: MenuConfiguration;

    @Expose()
    availableFrom: string | null; // Format YYYY-MM-DD

    @Expose()
    availableTo: string | null;

    @Expose()
    isActive: boolean;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    createdAt: Date | null;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    updatedAt: Date | null;

    // Helpers
    get formattedPrice(): string {
        return `${this.price.toFixed(2)} €`;
    }

    get sandwiches(): ProductModel[] {
        return (this.allowedProducts ?? []).filter((p) => p.category === 'SANDWICH');
    }

    get drinks(): ProductModel[] {
        return (this.allowedProducts ?? []).filter((p) => p.category === 'DRINK');
    }

    get desserts(): ProductModel[] {
        return (this.allowedProducts ?? []).filter((p) => p.category === 'DESSERT');
    }

    get sides(): ProductModel[] {
        return (this.allowedProducts ?? []).filter((p) => p.category === 'SIDE');
    }

    isAvailableOn(date: string): boolean {
        if (!this.isActive) return false;
        if (this.availableFrom && date < this.availableFrom) return false;
        if (this.availableTo && date > this.availableTo) return false;
        return true;
    }
}