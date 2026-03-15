import { Expose, Transform, Type } from 'class-transformer';
import { IngredientModel } from './ingredient.model';

export enum ProductCategory {
    SANDWICH = 'SANDWICH',
    DRINK = 'DRINK',
    DESSERT = 'DESSERT',
    SIDE = 'SIDE',
    SAUCE = 'SAUCE',
}

export const ProductCategoryLabel: Record<ProductCategory, string> = {
    [ProductCategory.SANDWICH]: 'Sandwich',
    [ProductCategory.DRINK]: 'Boisson',
    [ProductCategory.DESSERT]: 'Dessert',
    [ProductCategory.SIDE]: 'Accompagnement',
    [ProductCategory.SAUCE]: 'Sauce',
};

export class ProductIngredientModel {
    @Expose()
    id: number;

    @Expose()
    @Type(() => IngredientModel)
    ingredient: IngredientModel;

    @Expose()
    @Transform(({ value }) => parseFloat(value))
    quantity: number;

    @Expose()
    unit: string | null;

    @Expose()
    isRequired: boolean;

    @Expose()
    @Transform(({ value }) => parseFloat(value))
    extraPrice: number;
}

export class ProductModel {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    category: ProductCategory;

    @Expose()
    description: string | null;

    @Expose()
    @Transform(({ value }) => parseFloat(value))
    basePrice: number;

    @Expose()
    imageUrl: string | null;

    @Expose()
    isActive: boolean;

    @Expose()
    isCustomizable: boolean;

    @Expose()
    @Type(() => ProductIngredientModel)
    productIngredients: ProductIngredientModel[];

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    createdAt: Date | null;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    updatedAt: Date | null;

    // Helpers
    get categoryLabel(): string {
        return ProductCategoryLabel[this.category];
    }

    get requiredIngredients(): ProductIngredientModel[] {
        return (this.productIngredients ?? []).filter((pi) => pi.isRequired);
    }

    get optionalIngredients(): ProductIngredientModel[] {
        return (this.productIngredients ?? []).filter((pi) => !pi.isRequired);
    }

    get formattedPrice(): string {
        return `${this.basePrice.toFixed(2)} €`;
    }
}