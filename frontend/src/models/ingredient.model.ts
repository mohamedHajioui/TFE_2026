import { Expose, Transform } from 'class-transformer';

export enum IngredientCategory {
    BREAD = 'BREAD',
    PROTEIN = 'PROTEIN',
    CHEESE = 'CHEESE',
    VEGETABLE = 'VEGETABLE',
    SAUCE = 'SAUCE',
    SEASONING = 'SEASONING',
    OTHER = 'OTHER',
}

export const IngredientCategoryLabel: Record<IngredientCategory, string> = {
    [IngredientCategory.BREAD]: 'Pain',
    [IngredientCategory.PROTEIN]: 'Protéine',
    [IngredientCategory.CHEESE]: 'Fromage',
    [IngredientCategory.VEGETABLE]: 'Légume',
    [IngredientCategory.SAUCE]: 'Sauce',
    [IngredientCategory.SEASONING]: 'Assaisonnement',
    [IngredientCategory.OTHER]: 'Autre',
};

export class IngredientModel {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    category: IngredientCategory;

    @Expose()
    @Transform(({ value }) => parseFloat(value))
    currentStock: number;

    @Expose()
    @Transform(({ value }) => parseFloat(value))
    minStock: number;

    @Expose()
    unit: string;

    @Expose()
    @Transform(({ value }) => parseFloat(value))
    costPerUnit: number;

    @Expose()
    isAvailable: boolean;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    createdAt: Date | null;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    updatedAt: Date | null;

    // Helpers
    get categoryLabel(): string {
        return IngredientCategoryLabel[this.category];
    }

    get isLowStock(): boolean {
        return this.currentStock < this.minStock;
    }

    get isOutOfStock(): boolean {
        return this.currentStock <= 0;
    }


    get stockStatus(): 'ok' | 'low' | 'empty' {
        if (this.isOutOfStock) return 'empty';
        if (this.isLowStock) return 'low';
        return 'ok';
    }
}