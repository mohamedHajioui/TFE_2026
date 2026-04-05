import { AdminLayout } from './AdminLayout';
import { Link } from 'react-router-dom';
import { Package, UtensilsCrossed, ShoppingBag, Users } from 'lucide-react';

export default function AdminDashboard() {
    const cards = [
        { label: 'Produits', href: '/admin/products', icon: Package, desc: 'Gérer le catalogue' },
        { label: 'Menus', href: '/admin/menus', icon: UtensilsCrossed, desc: 'Gérer les formules' },
        { label: 'Commandes', href: '/admin/orders', icon: ShoppingBag, desc: 'Suivre les commandes' },
        { label: 'Utilisateurs',href: '/admin/users', icon: Users, desc: 'Gérer les comptes' },
    ];

    return (
        <AdminLayout>
            <div style={{ marginBottom: '32px' }}>
                <div className="section-header" style={{ display: 'inline-block', marginBottom: '8px' }}>Dashboard</div>
                <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>Bienvenue dans l'espace d'administration.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {cards.map(card => {
                    const Icon = card.icon;
                    return (
                        <Link key={card.href} to={card.href} style={{ textDecoration: 'none' }}>
                            <div className="card-dark" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ width: '44px', height: '44px', background: '#2A1A00', border: '1px solid #FF8C00', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={22} color="#FF8C00" />
                                </div>
                                <div>
                                    <div style={{ fontFamily: '"Oswald", sans-serif', fontWeight: 600, fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {card.label}
                                    </div>
                                    <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '3px' }}>{card.desc}</div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </AdminLayout>
    );
}