import { useState } from 'react';
import { MenuModel } from '@/models/menu.model';
import { ProductModel, ProductCategory } from '@/models/product.model';
import type {MenuChoices} from '@/models/order.model';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import { X, Check } from 'lucide-react';

interface MenuComposerProps {
    menu: MenuModel;
    onClose: () => void;
}

export function MenuComposer({ menu, onClose }: MenuComposerProps) {
    const { addMenu } = useCart();

    const sandwiches = menu.allowedProducts?.filter(p => p.category === ProductCategory.SANDWICH) ?? [];
    const drinks     = menu.allowedProducts?.filter(p => p.category === ProductCategory.DRINK) ?? [];
    const desserts   = menu.allowedProducts?.filter(p => p.category === ProductCategory.DESSERT) ?? [];
    const sides      = menu.allowedProducts?.filter(p => p.category === ProductCategory.SIDE) ?? [];

    const [choices, setChoices] = useState<MenuChoices>({
        sandwich: sandwiches[0]?.id,
        drink:    drinks[0]?.id,
        dessert:  desserts[0]?.id,
        side:     sides[0]?.id,
    });

    const isValid =
        (!menu.configuration?.sandwich?.required || choices.sandwich) &&
        (!menu.configuration?.drink?.required    || choices.drink) &&
        (!menu.configuration?.dessert?.required  || choices.dessert);

    const handleAdd = () => {
        if (!isValid) return;
        addMenu(menu, choices, 1);
        onClose();
    };

    return (
        // Overlay
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.75)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
            }}
        >
            {/* Modal */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '480px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 20px 16px',
                    borderBottom: '1px solid #2A2A2A',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    position: 'sticky',
                    top: 0,
                    background: '#1A1A1A',
                    zIndex: 1,
                }}>
                    <div>
                        <div className="badge-category" style={{ marginBottom: '8px' }}>Composer</div>
                        <h2 style={{
                            fontFamily: '"Oswald", sans-serif',
                            fontWeight: 700,
                            fontSize: '1.3rem',
                            color: '#FFF',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            margin: 0,
                        }}>{menu.name}</h2>
                        <div className="price-tag" style={{ fontSize: '1.2rem', marginTop: '4px' }}>
                            {formatPrice(Number(menu.price))}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px' }}
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

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

                {/* Footer */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #2A2A2A',
                    position: 'sticky',
                    bottom: 0,
                    background: '#1A1A1A',
                }}>
                    <button
                        className="btn-primary"
                        disabled={!isValid}
                        onClick={handleAdd}
                        style={{
                            width: '100%',
                            fontSize: '1rem',
                            padding: '12px',
                            opacity: isValid ? 1 : 0.5,
                        }}
                    >
                        Ajouter au panier · {formatPrice(Number(menu.price))}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Section catégorie

function CategorySection({ label, required, products, selectedId, onSelect }: {
    label: string;
    required: boolean;
    products: ProductModel[];
    selectedId?: number;
    onSelect: (id: number) => void;
}) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                    fontFamily: '"Oswald", sans-serif',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#FF8C00',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                }}>
                    {label}
                </span>
                {!required && (
                    <span style={{ color: '#444', fontSize: '0.72rem' }}>(optionnel)</span>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {products.map(product => {
                    const isSelected = selectedId === product.id;
                    return (
                        <button
                            key={product.id}
                            onClick={() => onSelect(product.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                padding: '12px 14px',
                                background: isSelected ? '#2A1A00' : '#111',
                                border: `1px solid ${isSelected ? '#FF8C00' : '#2A2A2A'}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'border-color 0.15s, background 0.15s',
                                textAlign: 'left',
                                width: '100%',
                            }}
                        >
                            {/* Image ou placeholder */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                ) : (
                                    <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#1A1A1A', flexShrink: 0 }} />
                                )}
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontFamily: '"Nunito", sans-serif',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        color: isSelected ? '#FF8C00' : '#FFF',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {product.name}
                                    </div>
                                    {product.description && (
                                        <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {product.description}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Checkmark */}
                            <div style={{
                                width: '22px', height: '22px',
                                borderRadius: '50%',
                                border: `2px solid ${isSelected ? '#FF8C00' : '#333'}`,
                                background: isSelected ? '#FF8C00' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.15s',
                            }}>
                                {isSelected && <Check size={13} color="#0D0D0D" strokeWidth={3} />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}