import { useActiveMenus } from '@/hooks/useMenus';
import { MenuModel } from '@/models/menu.model';
import {MenuCard} from "@/components/menus/menu-card.tsx";
import {AppLayout} from "@/components/ui/appLayouth.tsx";

export default function Home() {
    const { menus, isLoading, error } = useActiveMenus();

    const handleSelectMenu = (menu: MenuModel) => {
        console.log('Menu sélectionné :', menu.name);
    };

    return (
        <AppLayout>
            <section style={{ background: '#0D0D0D', padding: '80px 24px', textAlign: 'center', borderBottom: '1px solid #1A1A1A', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, #FF8C0010 0%, transparent 60%), radial-gradient(circle at 80% 50%, #FF8C0008 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <span className="badge-category" style={{ fontSize: '0.8rem', padding: '4px 16px' }}>Sandwicherie · Pasta Bar</span>
                    </div>
                    <h1 style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 700, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: '20px' }}>
                        Commandez en ligne,<br />
                        <span style={{ color: '#FF8C00' }}>récupérez en 15 minutes</span>
                    </h1>
                    <p style={{ color: '#888', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.6, fontFamily: '"Nunito", sans-serif' }}>
                        Des sandwichs frais préparés à la commande, avec retrait en boutique ou livraison à domicile.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-primary" style={{ fontSize: '1rem', padding: '12px 32px' }}>Voir la carte</button>
                        <button className="btn-outline" style={{ fontSize: '1rem', padding: '12px 32px' }}>Nos menus</button>
                    </div>
                </div>
            </section>

            {/* Bannière infos */}
            <div style={{ background: '#FF8C00', padding: '12px 24px', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
                {[{text: 'Lun–Ven 8h–21h · Sam 9h–22h' }, { text: 'Retrait en boutique' }, { text: 'Livraison disponible' }].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}></span>
                        <span style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 500, fontSize: '0.85rem', color: '#0D0D0D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.text}</span>
                    </div>
                ))}
            </div>

            {/* Section Menus */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
                <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="section-header" style={{ display: 'inline-block' }}>Nos menus du jour</div>
                        {!isLoading && !error && menus.length > 0 && (
                            <span style={{ color: '#555', fontSize: '0.85rem' }}>{menus.length} menu{menus.length > 1 ? 's' : ''} disponible{menus.length > 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Des formules avantageuses pour composer votre repas complet.</p>
                </div>

                {isLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0' }}>
                        <div className="spinner" />
                        <span style={{ color: '#555', fontSize: '0.9rem' }}>Chargement des menus...</span>
                    </div>
                )}

                {error && (
                    <div style={{ background: '#1A0A0A', border: '1px solid #5A1A1A', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                        <p style={{ color: '#FF6B6B', fontWeight: 600, margin: '0 0 4px' }}>Impossible de charger les menus</p>
                        <p style={{ color: '#AA4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                    </div>
                )}

                {!isLoading && !error && menus.length === 0 && (
                    <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍽️</div>
                        <p style={{ color: '#888', fontFamily: '"Oswald", sans-serif', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Aucun menu disponible aujourd'hui</p>
                        <p style={{ color: '#555', fontSize: '0.85rem', margin: 0 }}>Consultez notre carte pour commander à la pièce.</p>
                    </div>
                )}

                {!isLoading && !error && menus.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {menus.map(menu => (
                            <MenuCard key={menu.id} menu={menu} onSelect={handleSelectMenu} />
                        ))}
                    </div>
                )}
            </section>
        </AppLayout>
    );
}