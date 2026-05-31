import { useState, useMemo } from 'react';
import { ProductModel, ProductIngredientModel, ProductCategory } from '@/models/product.model';
import { IngredientCategory } from '@/models/ingredient.model';
import type { ProductCustomization } from '@/models/order.model';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/imageUrl';
import { X, Check, Minus, Plus, ShoppingBag, Sandwich } from 'lucide-react';
import styles from './product-customizer.module.css';

interface ProductCustomizerProps {
    product: ProductModel;
    onAdd: (quantity: number, customization: ProductCustomization) => void;
    onClose: () => void;
}

export function ProductCustomizer({ product, onAdd, onClose }: ProductCustomizerProps) {
    const baseIngredients = product.requiredIngredients;
    const extraIngredients = product.optionalIngredients;

    const breadOptions = (product.productIngredients ?? []).filter(
        (pi) => pi.ingredient?.category === IngredientCategory.BREAD && pi.ingredient?.isAvailable,
    );
    const isSandwich = product.category === ProductCategory.SANDWICH;
    const showBreadChoice = isSandwich && breadOptions.length > 1;

    const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
    const [extraIds, setExtraIds] = useState<Set<number>>(new Set());
    const [selectedBread, setSelectedBread] = useState<string>(
        breadOptions.length > 0 ? breadOptions[0].ingredient.name : '',
    );
    const [quantity, setQuantity] = useState(1);

    const toggleBase = (ingredientId: number) => {
        setRemovedIds((prev) => {
            const next = new Set(prev);
            if (next.has(ingredientId)) {
                next.delete(ingredientId);
            } else {
                next.add(ingredientId);
            }
            return next;
        });
    };

    const toggleExtra = (pi: ProductIngredientModel) => {
        if (!pi.ingredient?.isAvailable) return;
        const ingredientId = pi.ingredient.id;
        setExtraIds((prev) => {
            const next = new Set(prev);
            if (next.has(ingredientId)) {
                next.delete(ingredientId);
            } else {
                next.add(ingredientId);
            }
            return next;
        });
    };

    const unitPrice = useMemo(() => {
        let price = Number(product.basePrice);
        for (const ingredientId of extraIds) {
            const pi = product.productIngredients?.find(
                (pi) => pi.ingredient?.id === ingredientId,
            );
            if (pi?.extraPrice) price += Number(pi.extraPrice);
        }
        return price;
    }, [product, extraIds]);

    const totalPrice = unitPrice * quantity;

    const handleAdd = () => {
        const customization: ProductCustomization = {};
        if (removedIds.size > 0) customization.removed = Array.from(removedIds);
        if (extraIds.size > 0) customization.extra = Array.from(extraIds);
        if (showBreadChoice && selectedBread) customization.breadType = selectedBread;

        const hasCustomization = removedIds.size > 0 || extraIds.size > 0 || !!customization.breadType;
        onAdd(quantity, hasCustomization ? customization : {});
    };

    const imgSrc = resolveImageUrl(product.imageUrl);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    {imgSrc ? (
                        <img src={imgSrc} alt={product.name} className={styles.headerImg} />
                    ) : (
                        <div className={styles.headerImgPlaceholder}>
                            <Sandwich size={24} />
                        </div>
                    )}
                    <div className={styles.headerInfo}>
                        <div className={styles.headerName}>{product.name}</div>
                        {product.description && (
                            <div className={styles.headerDesc}>{product.description}</div>
                        )}
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    {showBreadChoice && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>Choix du pain</div>
                            {breadOptions.map((pi) => {
                                const name = pi.ingredient.name;
                                const isSelected = selectedBread === name;
                                return (
                                    <div
                                        key={pi.id}
                                        className={styles.ingredientRow}
                                        onClick={() => setSelectedBread(name)}
                                    >
                                        <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                                            {isSelected && <Check size={13} color="#0A0A0C" strokeWidth={3} />}
                                        </div>
                                        <span className={styles.ingredientName}>{name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {baseIngredients.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                Ingrédients de base
                            </div>
                            {baseIngredients.map((pi) => {
                                const id = pi.ingredient?.id;
                                if (!id) return null;
                                const isRemoved = removedIds.has(id);
                                return (
                                    <div
                                        key={pi.id}
                                        className={styles.ingredientRow}
                                        onClick={() => toggleBase(id)}
                                    >
                                        <div
                                            className={`${styles.checkbox} ${!isRemoved ? styles.checkboxChecked : ''}`}
                                        >
                                            {!isRemoved && <Check size={13} color="#0A0A0C" strokeWidth={3} />}
                                        </div>
                                        <span
                                            className={`${styles.ingredientName} ${isRemoved ? styles.ingredientNameRemoved : ''}`}
                                        >
                                            {pi.ingredient.name}
                                        </span>
                                        <span className={styles.ingredientIncluded}>Inclus</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {extraIngredients.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                Suppléments
                            </div>
                            {extraIngredients.map((pi) => {
                                const id = pi.ingredient?.id;
                                if (!id) return null;
                                const isAdded = extraIds.has(id);
                                const unavailable = !pi.ingredient?.isAvailable;
                                return (
                                    <div
                                        key={pi.id}
                                        className={`${styles.ingredientRow} ${unavailable ? styles.ingredientRowDisabled : ''}`}
                                        onClick={() => !unavailable && toggleExtra(pi)}
                                    >
                                        <div
                                            className={`${styles.checkbox} ${isAdded ? styles.checkboxChecked : ''}`}
                                        >
                                            {isAdded && <Check size={13} color="#0A0A0C" strokeWidth={3} />}
                                        </div>
                                        <span className={styles.ingredientName}>
                                            {pi.ingredient.name}
                                            {unavailable && ' (indisponible)'}
                                        </span>
                                        {Number(pi.extraPrice) > 0 && (
                                            <span className={styles.ingredientExtra}>
                                                +{formatPrice(Number(pi.extraPrice))}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className={styles.quantitySection}>
                        <span className={styles.quantityLabel}>Quantité</span>
                        <div className={styles.quantityControls}>
                            <button
                                className={styles.qtyBtn}
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                            >
                                <Minus size={14} />
                            </button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button
                                className={styles.qtyBtn}
                                onClick={() => setQuantity((q) => q + 1)}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <span className={styles.totalPrice}>{formatPrice(totalPrice)}</span>
                    <button
                        className={`btn-primary ${styles.addToCartBtn}`}
                        onClick={handleAdd}
                    >
                        <ShoppingBag size={16} />
                        Ajouter au panier
                    </button>
                </div>
            </div>
        </div>
    );
}
