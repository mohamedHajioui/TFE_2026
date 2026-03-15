import { useActiveMenus } from '@/hooks/useMenus';
import {MenuCard} from "@/components/menus/menu-card.tsx";


export default function Home() {
    const { menus, isLoading, error } = useActiveMenus();

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Navbar simple */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🥖</span>
                    <span className="text-xl font-bold text-slate-900">La Sandwicherie</span>
                </div>
                <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
                    <a href="#menus" className="hover:text-slate-900 transition-colors">Menus</a>
                    <a href="#products" className="hover:text-slate-900 transition-colors">Produits</a>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                        Commander
                    </button>
                </nav>
            </header>

            {/* Hero */}
            <section className="bg-slate-900 text-white px-6 py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">Commandez en ligne,<br />récupérez en 15 minutes</h1>
                <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                    Des sandwichs frais préparés à la commande, avec retrait en boutique ou livraison.
                </p>
                <button className="bg-white text-slate-900 font-semibold px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors text-lg">
                    Voir le catalogue
                </button>
            </section>

            {/* Section Menus */}
            <section id="menus" className="max-w-6xl mx-auto px-6 py-16">
                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Nos menus du jour</h2>
                    <p className="text-slate-500">
                        Des formules avantageuses pour composer votre repas complet.
                    </p>
                </div>

                {/* État chargement */}
                {isLoading && (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                            <span className="text-sm">Chargement des menus...</span>
                        </div>
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600 font-medium mb-1">Impossible de charger les menus</p>
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Aucun menu */}
                {!isLoading && !error && menus.length === 0 && (
                    <div className="bg-slate-100 rounded-xl p-12 text-center text-slate-400">
                        <p className="text-lg font-medium mb-1">Aucun menu disponible aujourd'hui</p>
                        <p className="text-sm">Revenez bientôt ou consultez notre catalogue de produits.</p>
                    </div>
                )}

                {/* Grille de menus */}
                {!isLoading && !error && menus.length > 0 && (
                    <>
                        <p className="text-sm text-slate-400 mb-6">
                            {menus.length} menu{menus.length > 1 ? 's' : ''} disponible{menus.length > 1 ? 's' : ''} aujourd'hui
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {menus.map(menu => (
                                <MenuCard key={menu.id} menu={menu} />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}