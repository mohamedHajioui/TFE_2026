import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useProducts } from '@/hooks/useProducts';
import { useActiveMenus } from '@/hooks/useMenus';
import { ordersApi, type CreateOrderItemData } from '@/api/orders.api';
import { ProductModel, ProductCategory, ProductCategoryLabel } from '@/models/product.model';
import type { MenuModel } from '@/models/menu.model';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/imageUrl';
import { getApiErrorMessage } from '@/utils/validation';
import {
    ShoppingBag, Trash2, Plus, Minus, X,
    CheckCircle2, AlertCircle,
} from 'lucide-react';
import styles from './pos.module.css';

interface POSProductItem {
    type: 'product';
    product: ProductModel;
    quantity: number;
    unitPrice: number;
}

interface POSMenuItem {
    type: 'menu';
    menu: MenuModel;
    quantity: number;
    unitPrice: number;
    menuChoices: Record<string, number | undefined>;
}

type POSItem = POSProductItem | POSMenuItem;

const CATEGORIES: { key: ProductCategory; label: string }[] = [
    { key: ProductCategory.SANDWICH, label: ProductCategoryLabel[ProductCategory.SANDWICH] },
    { key: ProductCategory.DRINK, label: ProductCategoryLabel[ProductCategory.DRINK] },
    { key: ProductCategory.DESSERT, label: ProductCategoryLabel[ProductCategory.DESSERT] },
    { key: ProductCategory.SIDE, label: ProductCategoryLabel[ProductCategory.SIDE] },
    { key: ProductCategory.SAUCE, label: ProductCategoryLabel[ProductCategory.SAUCE] },
];

export default function AdminPOS() {
    const { products, isLoading: productsLoading } = useProducts();
    const { menus, isLoading: menusLoading } = useActiveMenus();

    const [activeTab, setActiveTab] = useState<ProductCategory | 'menu'>(ProductCategory.SANDWICH);
    const [cartItems, setCartItems] = useState<POSItem[]>([]);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredProducts = useMemo(() => {
        if (activeTab === 'menu') return [];
        return products.filter((p) => p.category === activeTab);
    }, [products, activeTab]);

    const subtotal = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        [cartItems],
    );
    const totalItems = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
        [cartItems],
    );

    const addProduct = (product: ProductModel) => {
        setCartItems((prev) => {
            const idx = prev.findIndex(
                (item) => item.type === 'product' && (item as POSProductItem).product.id === product.id,
            );
            if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
                return updated;
            }
            return [
                ...prev,
                { type: 'product', product, quantity: 1, unitPrice: Number(product.basePrice) },
            ];
        });
        setSuccess(null);
    };

    const addMenu = (menu: MenuModel) => {
        setCartItems((prev) => [
            ...prev,
            {
                type: 'menu',
                menu,
                quantity: 1,
                unitPrice: Number(menu.price),
                menuChoices: {},
            },
        ]);
        setSuccess(null);
    };

    const updateQty = (index: number, qty: number) => {
        if (qty <= 0) {
            setCartItems((prev) => prev.filter((_, i) => i !== index));
        } else {
            setCartItems((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], quantity: qty };
                return updated;
            });
        }
    };

    const removeItem = (index: number) => {
        setCartItems((prev) => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCartItems([]);
        setNote('');
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        if (cartItems.length === 0) {
            setError('Ajoutez au moins un article.');
            return;
        }

        setSubmitting(true);

        try {
            const items: CreateOrderItemData[] = cartItems.map((item) => {
                if (item.type === 'product') {
                    return {
                        itemType: 'product' as const,
                        productId: item.product.id,
                        quantity: item.quantity,
                    };
                }
                return {
                    itemType: 'menu' as const,
                    menuId: item.menu.id,
                    quantity: item.quantity,
                    menuChoices: item.menuChoices,
                };
            });

            const order = await ordersApi.createManual({
                items,
                customerNote: note || undefined,
            });

            setSuccess(`Commande ${order.orderNumber} créée avec succès !`);
            setCartItems([]);
            setNote('');
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Erreur lors de la création de la commande.'));
        } finally {
            setSubmitting(false);
        }
    };

    const isLoading = productsLoading || menusLoading;

    return (
        <DashboardLayout>
            <div className={styles.page}>
                <div className={styles.catalog}>
                    <div className={styles.header}>
                        <div className="section-header">Caisse</div>
                        <p className={styles.headerSub}>
                            Encodez les commandes des clients sur place.
                        </p>
                    </div>

                    <div className={styles.tabs}>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.key}
                                className={`${styles.tab} ${activeTab === cat.key ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(cat.key)}
                            >
                                {cat.label}
                            </button>
                        ))}
                        <button
                            className={`${styles.tab} ${activeTab === 'menu' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('menu')}
                        >
                            Menus
                        </button>
                    </div>

                    {isLoading ? (
                        <div className={styles.loading}><div className="spinner" /></div>
                    ) : activeTab === 'menu' ? (
                        <div className={styles.menuGrid}>
                            {menus.map((menu) => (
                                <div
                                    key={menu.id}
                                    className={styles.menuCard}
                                    onClick={() => addMenu(menu)}
                                >
                                    <div className={styles.menuCardName}>{menu.name}</div>
                                    <div className={styles.menuCardPrice}>{formatPrice(Number(menu.price))}</div>
                                    {menu.description && (
                                        <div className={styles.menuCardDesc}>{menu.description}</div>
                                    )}
                                </div>
                            ))}
                            {menus.length === 0 && (
                                <p style={{ color: '#52525B', fontFamily: 'Nunito, sans-serif' }}>
                                    Aucun menu disponible aujourd'hui.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.productGrid}>
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className={`${styles.productCard} ${!product.isActive ? styles.productCardDisabled : ''}`}
                                    onClick={() => product.isActive && addProduct(product)}
                                >
                                    {product.imageUrl ? (
                                        <img
                                            src={resolveImageUrl(product.imageUrl) ?? ''}
                                            alt={product.name}
                                            className={styles.productImg}
                                        />
                                    ) : (
                                        <div className={styles.productImgPlaceholder} />
                                    )}
                                    <div className={styles.productCardName}>{product.name}</div>
                                    <div className={styles.productCardPrice}>
                                        {formatPrice(Number(product.basePrice))}
                                    </div>
                                    {!product.isActive && (
                                        <div className={styles.productCardUnavailable}>Indisponible</div>
                                    )}
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <p style={{ color: '#52525B', fontFamily: 'Nunito, sans-serif' }}>
                                    Aucun produit dans cette catégorie.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.cartPanel}>
                        <div className={styles.cartHeader}>
                            <div className={styles.cartTitle}>
                                <ShoppingBag size={16} style={{ marginRight: 8, verticalAlign: '-2px' }} />
                                Panier ({totalItems})
                            </div>
                            {cartItems.length > 0 && (
                                <button className={styles.cartClearBtn} onClick={clearCart}>
                                    <Trash2 size={12} /> Vider
                                </button>
                            )}
                        </div>

                        <div className={styles.cartItems}>
                            {cartItems.length === 0 ? (
                                <div className={styles.cartEmpty}>
                                    Cliquez sur un produit pour l'ajouter.
                                </div>
                            ) : (
                                cartItems.map((item, index) => (
                                    <div key={index} className={styles.cartItem}>
                                        <div className={styles.cartItemInfo}>
                                            <div className={styles.cartItemName}>
                                                {item.type === 'product' ? item.product.name : item.menu.name}
                                            </div>
                                            <div className={styles.cartItemPrice}>
                                                {formatPrice(item.unitPrice)}
                                            </div>
                                        </div>
                                        <div className={styles.cartItemActions}>
                                            <button
                                                className={styles.qtyBtn}
                                                onClick={() => updateQty(index, item.quantity - 1)}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className={styles.qtyValue}>{item.quantity}</span>
                                            <button
                                                className={styles.qtyBtn}
                                                onClick={() => updateQty(index, item.quantity + 1)}
                                            >
                                                <Plus size={12} />
                                            </button>
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => removeItem(index)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.cartFooter}>
                            <div className={styles.cartTotalRow}>
                                <span>Total</span>
                                <span className={styles.cartTotalPrice}>{formatPrice(subtotal)}</span>
                            </div>

                            <textarea
                                className={styles.noteInput}
                                placeholder="Note (optionnel)..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                            />

                            {error && (
                                <div className={styles.errorBox}>
                                    <AlertCircle size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className={styles.successBox}>
                                    <CheckCircle2 size={14} />
                                    {success}
                                </div>
                            )}

                            <button
                                className={`btn-primary ${styles.submitBtn}`}
                                disabled={submitting || cartItems.length === 0}
                                onClick={handleSubmit}
                            >
                                {submitting ? 'Création...' : 'Valider la commande'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
