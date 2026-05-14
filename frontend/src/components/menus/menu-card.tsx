import { MenuModel } from '@/models/menu.model';
import { formatPrice } from '@/utils/format';
import styles from './menu-card.module.css';

interface MenuCardProps {
    menu: MenuModel;
    onSelect?: (menu: MenuModel) => void;
}

export function MenuCard({ menu, onSelect }: MenuCardProps) {
    const sandwiches = menu.allowedProducts?.filter(p => p.category === 'SANDWICH') ?? [];
    const drinks = menu.allowedProducts?.filter(p => p.category === 'DRINK') ?? [];
    const desserts = menu.allowedProducts?.filter(p => p.category === 'DESSERT') ?? [];
    const sides = menu.allowedProducts?.filter(p => p.category === 'SIDE') ?? [];

    const totalSeparate = menu.allowedProducts?.reduce((sum, p) => sum + Number(p.basePrice), 0) ?? 0;
    const savings = totalSeparate - Number(menu.price);

    const menuImage =
        menu.allowedProducts?.find(p => p.category === 'SANDWICH' && p.imageUrl)?.imageUrl ??
        menu.allowedProducts?.find(p => p.imageUrl)?.imageUrl ??
        null;

    return (
        <div className={`card-dark ${styles.card}`}>

            <div className={styles.imageWrapper}>
                {menuImage
                    ? <img src={menuImage} alt={menu.name} className={styles.image} />
                    : <div className={styles.imagePlaceholder} />
                }
                <div className={styles.badgeWrapper}>
                    <span className="badge-category">Menu</span>
                </div>
                {savings > 0 && (
                    <div className={styles.savingsBadge}>-{formatPrice(savings)}</div>
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.title}>{menu.name}</h3>
                        {menu.description && (
                            <p className={styles.description}>{menu.description}</p>
                        )}
                    </div>
                    <div className="price-tag">{formatPrice(Number(menu.price))}</div>
                </div>

                <div className="divider-orange" />

                <div className={styles.composition}>
                    {sandwiches.length > 0 && <MenuRow label="Sandwich" items={sandwiches.map(p => p.name)} required={menu.configuration?.sandwich?.required} />}
                    {drinks.length > 0 && <MenuRow label="Boisson" items={drinks.map(p => p.name)} required={menu.configuration?.drink?.required} />}
                    {desserts.length > 0 && <MenuRow label="Dessert" items={desserts.map(p => p.name)} required={menu.configuration?.dessert?.required} />}
                    {sides.length > 0 && <MenuRow label="Accompagnement" items={sides.map(p => p.name)} required={menu.configuration?.side?.required} />}
                </div>

                {(menu.availableFrom || menu.availableTo) && (
                    <div className={styles.availability}>
                        {menu.availableFrom && menu.availableTo
                            ? `Du ${menu.availableFrom} au ${menu.availableTo}`
                            : menu.availableFrom
                                ? `À partir du ${menu.availableFrom}`
                                : `Jusqu'au ${menu.availableTo}`}
                    </div>
                )}

                <button className={`btn-primary ${styles.selectBtn}`} onClick={() => onSelect?.(menu)}>
                    Composer ce menu
                </button>
            </div>
        </div>
    );
}

function MenuRow({ label, items, required }: { label: string; items: string[]; required?: boolean }) {
    return (
        <div className={styles.compositionRow}>
            <span className={styles.compositionLabel}>{label}{required === false ? ' *' : ''}</span>
            <span className={styles.compositionItems}>{items.join(', ')}</span>
        </div>
    );
}