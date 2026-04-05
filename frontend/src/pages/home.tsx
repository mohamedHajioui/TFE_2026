import { useState } from 'react';
import { useActiveMenus } from '@/hooks/useMenus';
import { MenuModel } from '@/models/menu.model';
import { MenuCard } from '@/components/menus/menu-card';
import { AppLayout } from '@/components/ui/appLayouth';
import { MenuComposer } from '@/components/menus/menu-composer';

export default function Home() {
    const { menus, isLoading, error } = useActiveMenus();
    const [selectedMenu, setSelectedMenu] = useState<MenuModel | null>(null);

    return (
        <AppLayout>

            {/* Hero */}
            <section style={{
                background: '#0A0A0C',
                padding: 'clamp(72px, 10vw, 120px) 24px clamp(64px, 8vw, 100px)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Halo ambiant */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `
                        radial-gradient(ellipse 60% 50% at 20% 60%, #FFAA0010 0%, transparent 70%),
                        radial-gradient(ellipse 50% 40% at 80% 40%, #FFAA0008 0%, transparent 70%)
                    `,
                }} />

                <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
                    {/* Pill tag */}
                    <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: '#FFAA0015',
                            border: '1px solid #FFAA0035',
                            color: '#FFAA00',
                            fontFamily: '"Nunito", sans-serif',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '5px 14px',
                            borderRadius: '100px',
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFAA00', display: 'inline-block' }} />
                            Sandwicherie · Pasta Bar
                        </span>
                    </div>

                    {/* Titre */}
                    <h1 style={{
                        fontFamily: '"Oswald", sans-serif',
                        fontWeight: 700,
                        fontSize: 'clamp(2.2rem, 6vw, 4rem)',
                        color: '#F4F4F5',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        lineHeight: 1.05,
                        marginBottom: '24px',
                    }}>
                        Commandez en ligne,{' '}
                        <span style={{
                            color: '#FFAA00',
                            display: 'block',
                        }}>
                            récupérez en 15 min
                        </span>
                    </h1>

                    {/* Sous-titre */}
                    <p style={{
                        color: '#71717A',
                        fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                        maxWidth: '440px',
                        margin: '0 auto 40px',
                        lineHeight: 1.7,
                        fontFamily: '"Nunito", sans-serif',
                        fontWeight: 400,
                    }}>
                        Des sandwichs frais préparés à la commande, avec retrait en boutique ou livraison à domicile.
                    </p>

                    {/* CTA */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-primary" style={{ fontSize: '0.92rem', padding: '12px 28px' }}>
                            Voir la carte
                        </button>
                        <button className="btn-outline" style={{ fontSize: '0.92rem', padding: '12px 28px' }}>
                            Nos menus
                        </button>
                    </div>
                </div>
            </section>

            {/* Bande infos */}
            <div style={{
                background: '#13131A',
                borderTop: '1px solid #FFFFFF0A',
                borderBottom: '1px solid #FFFFFF0A',
                padding: '14px 24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0',
                flexWrap: 'wrap',
                rowGap: '8px',
            }}>
                {[
                    { label: 'Lun–Ven 8h–21h · Sam 9h–22h' },
                    { label: 'Retrait en boutique' },
                    { label: 'Livraison disponible' },
                ].map((item, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {i > 0 && (
                            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#3F3F46', display: 'inline-block', margin: '0 12px' }} />
                        )}
                        <span style={{
                            fontFamily: '"Nunito", sans-serif',
                            fontWeight: 600,
                            fontSize: 'clamp(0.75rem, 1.8vw, 0.82rem)',
                            color: '#71717A',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            whiteSpace: 'nowrap',
                        }}>
                            {item.label}
                        </span>
                    </span>
                ))}
            </div>

            {/* Section menus */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(48px, 7vw, 80px) 20px' }}>

                {/* Header section */}
                <div style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div className="section-header" style={{ marginBottom: '10px' }}>
                            Nos menus du jour
                        </div>
                        <p style={{ color: '#52525B', fontSize: '0.88rem', margin: 0, fontFamily: '"Nunito", sans-serif' }}>
                            Des formules avantageuses pour composer votre repas complet.
                        </p>
                    </div>
                    {!isLoading && !error && menus.length > 0 && (
                        <span style={{
                            background: '#1C1C26',
                            border: '1px solid #FFFFFF0F',
                            color: '#71717A',
                            fontSize: '0.78rem',
                            fontFamily: '"Nunito", sans-serif',
                            padding: '4px 12px',
                            borderRadius: '100px',
                        }}>
                            {menus.length} disponible{menus.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Loading */}
                {isLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0' }}>
                        <div className="spinner" />
                        <span style={{ color: '#52525B', fontSize: '0.85rem', fontFamily: '"Nunito", sans-serif' }}>Chargement des menus...</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ background: '#1C1015', border: '1px solid #4A1A1A', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                        <p style={{ color: '#F87171', fontWeight: 600, margin: '0 0 4px', fontFamily: '"Nunito", sans-serif' }}>Impossible de charger les menus</p>
                        <p style={{ color: '#7F1D1D', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                    </div>
                )}

                {/* Vide */}
                {!isLoading && !error && menus.length === 0 && (
                    <div style={{ background: '#13131A', border: '1px solid #FFFFFF0A', borderRadius: '16px', padding: '60px 24px', textAlign: 'center' }}>
                        <p style={{ color: '#52525B', fontFamily: '"Oswald", sans-serif', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                            Aucun menu disponible aujourd'hui
                        </p>
                        <p style={{ color: '#3F3F46', fontSize: '0.83rem', margin: 0 }}>Consultez notre carte pour commander à la pièce.</p>
                    </div>
                )}

                {/* Grille menus */}
                {!isLoading && !error && menus.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
                        {menus.map(menu => (
                            <MenuCard key={menu.id} menu={menu} onSelect={setSelectedMenu} />
                        ))}
                    </div>
                )}
            </section>

            {/* Modal composer */}
            {selectedMenu && (
                <MenuComposer menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
            )}
        </AppLayout>
    );
}