import { MenuModel } from '@/models/menu.model';
import { formatPrice } from '@/utils/format';


interface MenuCardProps {
    menu: MenuModel;
    onSelect?: (menu: MenuModel) => void;
}

export function MenuCard({ menu, onSelect }: MenuCardProps) {
    const sandwiches = menu.allowedProducts?.filter(p => p.category === 'SANDWICH') ?? [];
    const drinks     = menu.allowedProducts?.filter(p => p.category === 'DRINK') ?? [];
    const desserts   = menu.allowedProducts?.filter(p => p.category === 'DESSERT') ?? [];
    const sides      = menu.allowedProducts?.filter(p => p.category === 'SIDE') ?? [];

    const totalSeparate = menu.allowedProducts?.reduce(
        (sum, p) => sum + Number(p.basePrice), 0
    ) ?? 0;
    const savings = totalSeparate - Number(menu.price);

    // Cherche une image dans les produits du menu (du sandwich en priorité)
    const menuImage =
        menu.allowedProducts?.find(p => p.category === 'SANDWICH' && p.imageUrl)?.imageUrl ??
        menu.allowedProducts?.find(p => p.imageUrl)?.imageUrl ??
        null;

    return (
        <div className="card-dark" style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Image */}
            <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                {menuImage ? (
                    <img
                        src={menuImage}
                        alt={menu.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{
                        height: '100%',
                        background: '#1A1A1A',
                        borderBottom: '1px solid #2A2A2A',
                    }} />
                )}

                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span className="badge-category">Menu</span>
                </div>

                {savings > 0 && (
                    <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: '#16a34a', color: 'white',
                        fontFamily: '"Nunito", sans-serif', fontWeight: 700,
                        fontSize: '0.72rem', padding: '3px 10px', borderRadius: '2px',
                    }}>
                        -{formatPrice(savings)}
                    </div>
                )}
            </div>

            {/* Contenu */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>

                {/* Titre + prix */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                        <h3 style={{
                            fontFamily: '"Oswald", sans-serif', fontWeight: 600,
                            fontSize: '1.15rem', color: '#FFFFFF',
                            textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0,
                        }}>
                            {menu.name}
                        </h3>
                        {menu.description && (
                            <p style={{ color: '#888', fontSize: '0.8rem', margin: '4px 0 0' }}>
                                {menu.description}
                            </p>
                        )}
                    </div>
                    <div className="price-tag" style={{ whiteSpace: 'nowrap' }}>
                        {formatPrice(Number(menu.price))}
                    </div>
                </div>

                <div className="divider-orange" />

                {/* Composition */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sandwiches.length > 0 && (
                        <MenuRow label="Sandwich" items={sandwiches.map(p => p.name)} required={menu.configuration?.sandwich?.required} />
                    )}
                    {drinks.length > 0 && (
                        <MenuRow label="Boisson" items={drinks.map(p => p.name)} required={menu.configuration?.drink?.required} />
                    )}
                    {desserts.length > 0 && (
                        <MenuRow label="Dessert" items={desserts.map(p => p.name)} required={menu.configuration?.dessert?.required} />
                    )}
                    {sides.length > 0 && (
                        <MenuRow label="Accompagnement" items={sides.map(p => p.name)} required={menu.configuration?.side?.required} />
                    )}
                </div>

                {/* Disponibilité */}
                {(menu.availableFrom || menu.availableTo) && (
                    <div style={{ fontSize: '0.72rem', color: '#555', paddingTop: '8px', borderTop: '1px solid #2A2A2A' }}>
                        {menu.availableFrom && menu.availableTo
                            ? `Du ${menu.availableFrom} au ${menu.availableTo}`
                            : menu.availableFrom
                                ? `À partir du ${menu.availableFrom}`
                                : `Jusqu'au ${menu.availableTo}`}
                    </div>
                )}

                {/* Bouton */}
                <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: 'auto' }}
                    onClick={() => onSelect?.(menu)}
                >
                    Composer ce menu
                </button>
            </div>
        </div>
    );
}

function MenuRow({ label, items, required }: { label: string; items: string[]; required?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontSize: '0.83rem' }}>
            <span style={{
                fontFamily: '"Oswald", sans-serif',
                fontWeight: 500,
                fontSize: '0.78rem',
                color: '#FF8C00',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                minWidth: '100px',
                flexShrink: 0,
            }}>
                {label}{required === false ? ' *' : ''}
            </span>
            <span style={{ color: '#AAA' }}>{items.join(', ')}</span>
        </div>
    );
}