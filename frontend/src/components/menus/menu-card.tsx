import { MenuModel } from '@/models/menu.model';
import { formatPrice } from '@/utils/format';

interface MenuCardProps {
    menu: MenuModel;
}

export function MenuCard({ menu }: MenuCardProps) {
    const sandwiches = menu.allowedProducts?.filter(p => p.category === 'SANDWICH') ?? [];
    const drinks     = menu.allowedProducts?.filter(p => p.category === 'DRINK') ?? [];
    const desserts   = menu.allowedProducts?.filter(p => p.category === 'DESSERT') ?? [];
    const sides      = menu.allowedProducts?.filter(p => p.category === 'SIDE') ?? [];

    const totalSeparate = menu.allowedProducts?.reduce(
        (sum, p) => sum + Number(p.basePrice), 0
    ) ?? 0;
    const savings = totalSeparate - Number(menu.price);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">{menu.name}</h3>
                    {menu.description && (
                        <p className="text-sm text-slate-500 mt-0.5">{menu.description}</p>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-slate-900">
                        {formatPrice(Number(menu.price))}
                    </div>
                    {savings > 0 && (
                        <div className="text-xs text-emerald-600 font-medium mt-0.5">
                            Économie de {formatPrice(savings)}
                        </div>
                    )}
                </div>
            </div>

            {/* Contenu du menu */}
            <div className="flex flex-col gap-2">
                {sandwiches.length > 0 && (
                    <MenuSection
                        icon="🥖"
                        label={menu.configuration?.sandwich?.required ? '1 sandwich' : '1 sandwich (optionnel)'}
                        items={sandwiches.map(p => p.name)}
                    />
                )}
                {drinks.length > 0 && (
                    <MenuSection
                        icon="🥤"
                        label={menu.configuration?.drink?.required ? '1 boisson' : '1 boisson (optionnelle)'}
                        items={drinks.map(p => p.name)}
                    />
                )}
                {desserts.length > 0 && (
                    <MenuSection
                        icon="🍮"
                        label={menu.configuration?.dessert?.required ? '1 dessert' : '1 dessert (optionnel)'}
                        items={desserts.map(p => p.name)}
                    />
                )}
                {sides.length > 0 && (
                    <MenuSection
                        icon="🍟"
                        label={menu.configuration?.side?.required ? '1 accompagnement' : '1 accompagnement (optionnel)'}
                        items={sides.map(p => p.name)}
                    />
                )}
            </div>

            {/* Disponibilité */}
            {(menu.availableFrom || menu.availableTo) && (
                <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                    {menu.availableFrom && menu.availableTo
                        ? `Disponible du ${menu.availableFrom} au ${menu.availableTo}`
                        : menu.availableFrom
                            ? `Disponible à partir du ${menu.availableFrom}`
                            : `Disponible jusqu'au ${menu.availableTo}`}
                </div>
            )}

            {/* Bouton */}
            <button className="mt-auto w-full bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                Composer ce menu
            </button>
        </div>
    );
}

function MenuSection({ icon, label, items }: { icon: string; label: string; items: string[] }) {
    return (
        <div className="flex gap-2 text-sm">
            <span className="text-base leading-none mt-0.5">{icon}</span>
            <div>
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-400 mx-1">—</span>
                <span className="text-slate-500">{items.join(', ')}</span>
            </div>
        </div>
    );
}