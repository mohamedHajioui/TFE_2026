import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { ProductModel, ProductCategory, ProductCategoryLabel } from '@/models/product.model';
import type { ProductCustomization } from '@/models/order.model';
import { formatPrice } from '@/utils/format';
import { ShoppingBag, Sandwich, Coffee, IceCream, Salad, Droplets, SlidersHorizontal } from 'lucide-react';
import { resolveImageUrl } from '@/utils/imageUrl';
import { ProductCustomizer } from '@/components/products/product-customizer';
import styles from './products.module.css';

const CATEGORY_ORDER: ProductCategory[] = [
    ProductCategory.SANDWICH,
    ProductCategory.DRINK,
    ProductCategory.DESSERT,
    ProductCategory.SIDE,
    ProductCategory.SAUCE,
];

const CATEGORY_ICONS: Record<ProductCategory, React.ReactNode> = {
    [ProductCategory.SANDWICH]: <Sandwich size={15} />,
    [ProductCategory.DRINK]: <Coffee size={15} />,
    [ProductCategory.DESSERT]: <IceCream size={15} />,
    [ProductCategory.SIDE]: <Salad size={15} />,
    [ProductCategory.SAUCE]: <Droplets size={15} />,
};

export default function Products() {
    const { products, isLoading, error } = useProducts({ isActive: true });
    const { addProduct } = useCart();
    const [activeCategory, setActiveCategory] = useState<ProductCategory | 'ALL'>('ALL');
    const [customizingProduct, setCustomizingProduct] = useState<ProductModel | null>(null);

    const handleAddProduct = (product: ProductModel) => {
        if (product.isCustomizable && product.productIngredients?.length > 0) {
            setCustomizingProduct(product);
        } else {
            addProduct(product, 1);
        }
    };

    const handleCustomizedAdd = (quantity: number, customization: ProductCustomization) => {
        if (customizingProduct) {
            addProduct(customizingProduct, quantity, customization);
            setCustomizingProduct(null);
        }
    };

    const grouped = useMemo(() => {
        const map = new Map<ProductCategory, ProductModel[]>();
        for (const cat of CATEGORY_ORDER) {
            const catProducts = products.filter(p => p.category === cat);
            if (catProducts.length > 0) map.set(cat, catProducts);
        }
        return map;
    }, [products]);

    const availableCategories = useMemo(() => Array.from(grouped.keys()), [grouped]);

    const filteredGroups = useMemo(() => {
        if (activeCategory === 'ALL') return grouped;
        const map = new Map<ProductCategory, ProductModel[]>();
        const items = grouped.get(activeCategory as ProductCategory);
        if (items) map.set(activeCategory as ProductCategory, items);
        return map;
    }, [grouped, activeCategory]);

    return (
        <AppLayout>
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div className={styles.badgeWrapper}>
                        <span className={styles.badge}>
                            <span className={styles.badgeDot} />
                            La carte
                        </span>
                    </div>
                    <h1 className={styles.title}>
                        Notre <span className={styles.titleAccent}>carte</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Commandez à la pièce : sandwichs, boissons, desserts et accompagnements.
                        Composez votre repas comme vous le souhaitez.
                    </p>
                </div>
            </section>

            <section className={styles.content}>
                {isLoading && (
                    <div className={styles.loading}>
                        <div className="spinner" />
                        <span className={styles.loadingText}>Chargement de la carte...</span>
                    </div>
                )}

                {error && (
                    <div className={styles.emptyBox}>
                        <p className={styles.emptyTitle}>Impossible de charger la carte</p>
                        <p className={styles.emptyText}>{error}</p>
                    </div>
                )}

                {!isLoading && !error && products.length === 0 && (
                    <div className={styles.emptyBox}>
                        <p className={styles.emptyTitle}>Aucun produit disponible</p>
                        <p className={styles.emptyText}>Revenez bientôt pour découvrir notre carte.</p>
                    </div>
                )}

                {!isLoading && !error && products.length > 0 && (
                    <>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeCategory === 'ALL' ? styles.tabActive : ''}`}
                                onClick={() => setActiveCategory('ALL')}
                            >
                                Tout
                                <span className={styles.tabCount}>{products.length}</span>
                            </button>
                            {availableCategories.map(cat => (
                                <button
                                    key={cat}
                                    className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {CATEGORY_ICONS[cat]}
                                    {ProductCategoryLabel[cat]}
                                    <span className={styles.tabCount}>{grouped.get(cat)?.length ?? 0}</span>
                                </button>
                            ))}
                        </div>

                        {Array.from(filteredGroups.entries()).map(([cat, catProducts]) => (
                            <div key={cat} className={styles.categorySection}>
                                <div className={styles.categoryHeader}>
                                    <h2 className={styles.categoryTitle}>
                                        {ProductCategoryLabel[cat]}s
                                    </h2>
                                    <span className={styles.categoryCount}>
                                        {catProducts.length} produit{catProducts.length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className={styles.grid}>
                                    {catProducts.map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAdd={() => handleAddProduct(product)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </section>

            {customizingProduct && (
                <ProductCustomizer
                    product={customizingProduct}
                    onAdd={handleCustomizedAdd}
                    onClose={() => setCustomizingProduct(null)}
                />
            )}
        </AppLayout>
    );
}

function ProductCard({ product, onAdd }: { product: ProductModel; onAdd: () => void }) {
    const imgSrc = resolveImageUrl(product.imageUrl);
    const isCustom = product.isCustomizable && product.productIngredients?.length > 0;

    return (
        <div className={`card-dark ${styles.card}`}>
            <div style={{ position: 'relative' }}>
                {imgSrc
                    ? <img src={imgSrc} alt={product.name} className={styles.cardImage} />
                    : <div className={styles.cardImagePlaceholder}>
                        {CATEGORY_ICONS[product.category]}
                      </div>
                }
                {isCustom && (
                    <span className={styles.customBadge}>
                        <SlidersHorizontal size={11} />
                        Personnalisable
                    </span>
                )}
            </div>
            <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                    <div className={styles.cardName}>{product.name}</div>
                </div>
                {product.description && (
                    <div className={styles.cardDesc}>{product.description}</div>
                )}
                <div className={styles.cardFooter}>
                    <span className="price-tag" style={{ fontSize: '1.1rem' }}>
                        {formatPrice(Number(product.basePrice))}
                    </span>
                    <button className={`btn-primary ${styles.addBtn}`} onClick={onAdd}>
                        {isCustom ? <SlidersHorizontal size={14} /> : <ShoppingBag size={14} />}
                        {isCustom ? 'Personnaliser' : 'Ajouter'}
                    </button>
                </div>
            </div>
        </div>
    );
}
