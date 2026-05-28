import { useState } from 'react';
import { MenuModel } from '@/models/menu.model';
import { ProductModel, ProductCategory } from '@/models/product.model';
import type { MenuChoices } from '@/models/order.model';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import { X, Check } from 'lucide-react';
import styles from './menu-composer.module.css';

interface MenuComposerProps {
    menu: MenuModel;
    onClose: () => void;
}

export function MenuComposer({ menu, onClose }: MenuComposerProps) {
    const { addMenu } = useCart();

    const activeProducts = menu.allowedProducts?.filter(p => p.isActive) ?? [];
    const sandwiches = activeProducts.filter(p => p.category === ProductCategory.SANDWICH);
    const drinks = activeProducts.filter(p => p.category === ProductCategory.DRINK);
    const desserts = activeProducts.filter(p => p.category === ProductCategory.DESSERT);
    const sides = activeProducts.filter(p => p.category === ProductCategory.SIDE);

    const [choices, setChoices] = useState<MenuChoices>({
        sandwich: sandwiches[0]?.id,
        drink: drinks[0]?.id,
        dessert: desserts[0]?.id,
        side: sides[0]?.id,
    });

    const isValid =
        (!menu.configuration?.sandwich?.required || choices.sandwich) &&
        (!menu.configuration?.drink?.required || choices.drink) &&
        (!menu.configuration?.dessert?.required || choices.dessert);

    const handleAdd = () => {
        if (!isValid) return;
        addMenu(menu, choices, 1);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                <div className={styles.modalHeader}>
                    <div>
                        <div className={`badge-category ${styles.modalBadge}`}>Composer</div>
                        <h2 className={styles.modalTitle}>{menu.name}</h2>
                        <div className="price-tag">{formatPrice(Number(menu.price))}</div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={22} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {sandwiches.length > 0 && (
                        <CategorySection
                            label="Sandwich"
                            required={menu.configuration?.sandwich?.required ?? true}
                            products={sandwiches}
                            selectedId={choices.sandwich}
                            onSelect={id => setChoices(c => ({ ...c, sandwich: id }))}
                        />
                    )}
                    {drinks.length > 0 && (
                        <CategorySection
                            label="Boisson"
                            required={menu.configuration?.drink?.required ?? true}
                            products={drinks}
                            selectedId={choices.drink}
                            onSelect={id => setChoices(c => ({ ...c, drink: id }))}
                        />
                    )}
                    {desserts.length > 0 && (
                        <CategorySection
                            label="Dessert"
                            required={menu.configuration?.dessert?.required ?? false}
                            products={desserts}
                            selectedId={choices.dessert}
                            onSelect={id => setChoices(c => ({ ...c, dessert: id }))}
                        />
                    )}
                    {sides.length > 0 && (
                        <CategorySection
                            label="Accompagnement"
                            required={menu.configuration?.side?.required ?? false}
                            products={sides}
                            selectedId={choices.side}
                            onSelect={id => setChoices(c => ({ ...c, side: id }))}
                        />
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={`btn-primary ${styles.addBtn}`}
                        disabled={!isValid}
                        onClick={handleAdd}
                        style={{ opacity: isValid ? 1 : 0.5 }}
                    >
                        Ajouter au panier · {formatPrice(Number(menu.price))}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CategorySection({ label, required, products, selectedId, onSelect }: {
    label: string;
    required: boolean;
    products: ProductModel[];
    selectedId?: number;
    onSelect: (id: number) => void;
}) {
    return (
        <div className={styles.category}>
            <div className={styles.categoryHeader}>
                <span className={styles.categoryLabel}>{label}</span>
                {!required && <span className={styles.categoryOptional}>(optionnel)</span>}
            </div>

            <div className={styles.productList}>
                {products.map(product => {
                    const isSelected = selectedId === product.id;
                    return (
                        <button
                            key={product.id}
                            onClick={() => onSelect(product.id)}
                            className={`${styles.productBtn} ${isSelected ? styles.productBtnSelected : ''}`}
                        >
                            <div className={styles.productInfo}>
                                {product.imageUrl
                                    ? <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                                    : <div className={styles.productImagePlaceholder} />
                                }
                                <div style={{ minWidth: 0 }}>
                                    <div className={`${styles.productName} ${isSelected ? styles.productNameSelected : ''}`}>
                                        {product.name}
                                    </div>
                                    {product.description && (
                                        <div className={styles.productDesc}>{product.description}</div>
                                    )}
                                </div>
                            </div>

                            <div className={`${styles.checkmark} ${isSelected ? styles.checkmarkSelected : ''}`}>
                                {isSelected && <Check size={13} color="#0A0A0C" strokeWidth={3} />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}