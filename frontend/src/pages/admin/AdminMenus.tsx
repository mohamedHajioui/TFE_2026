import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { menusApi } from '@/api/menus.api';
import { productsApi } from '@/api/products.api';
import { MenuModel } from '@/models/menu.model';
import { ProductModel, ProductCategory } from '@/models/product.model';
import { formatPrice } from '@/utils/format';
import { Plus, Pencil, Power, Trash2, X, Check, Save } from 'lucide-react';
import styles from './AdminMenus.module.css';

interface MenuForm {
    name: string;
    description: string;
    price: string;
    isActive: boolean;
    selectedProductIds: number[];
    config: {
        sandwich: { required: boolean };
        drink:    { required: boolean };
        dessert:  { required: boolean };
        side:     { required: boolean };
    };
}

const EMPTY_FORM: MenuForm = {
    name: '', description: '', price: '', isActive: true,
    selectedProductIds: [],
    config: {
        sandwich: { required: true },
        drink:    { required: true },
        dessert:  { required: false },
        side:     { required: false },
    },
};

const CATEGORY_LABEL: Record<string, string> = {
    SANDWICH: 'Sandwich', DRINK: 'Boisson', DESSERT: 'Dessert', SIDE: 'Accompagnement', SAUCE: 'Sauce',
};

export default function AdminMenus() {
    const [menus,     setMenus]     = useState<MenuModel[]>([]);
    const [products,  setProducts]  = useState<ProductModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing,   setEditing]   = useState<MenuModel | null>(null);
    const [form,      setForm]      = useState<MenuForm>(EMPTY_FORM);
    const [saving,    setSaving]    = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [actionId,  setActionId]  = useState<number | null>(null);

    const load = async () => {
        setIsLoading(true);
        try {
            const [m, p] = await Promise.all([menusApi.findAll(), productsApi.findAll()]);
            setMenus(m);
            setProducts(p);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setModalOpen(true);
    };

    const openEdit = (menu: MenuModel) => {
        setEditing(menu);
        setForm({
            name: menu.name,
            description: menu.description ?? '',
            price: String(Number(menu.price)),
            isActive: menu.isActive,
            selectedProductIds: menu.allowedProducts?.map(p => p.id) ?? [],
            config: {
                sandwich: { required: menu.configuration?.sandwich?.required ?? true },
                drink:    { required: menu.configuration?.drink?.required    ?? true },
                dessert:  { required: menu.configuration?.dessert?.required  ?? false },
                side:     { required: menu.configuration?.side?.required     ?? false },
            },
        });
        setFormError(null);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditing(null); };

    const handleSave = async () => {
        if (!form.name.trim())                      { setFormError('Le nom est obligatoire.'); return; }
        if (!form.price || isNaN(Number(form.price))) { setFormError('Le prix doit être un nombre valide.'); return; }
        if (form.selectedProductIds.length === 0)   { setFormError('Sélectionnez au moins un produit.'); return; }

        setSaving(true);
        setFormError(null);

        const payload = {
            name:        form.name.trim(),
            description: form.description.trim() || undefined,
            price:       Number(form.price),
            isActive:    form.isActive,
            productIds:  form.selectedProductIds,
            configuration: {
                sandwich: { required: form.config.sandwich.required, quantity: 1 },
                drink:    { required: form.config.drink.required,    quantity: 1 },
                dessert:  { required: form.config.dessert.required,  quantity: 1 },
                side:     { required: form.config.side.required,     quantity: 0 },
            },
        };

        try {
            if (editing) {
                await menusApi.update(editing.id, payload);
            } else {
                await menusApi.create(payload);
            }
            await load();
            closeModal();
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? 'Une erreur est survenue.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (menu: MenuModel) => {
        setActionId(menu.id);
        try { await menusApi.toggleActive(menu.id); await load(); }
        finally { setActionId(null); }
    };

    const handleDelete = async (menu: MenuModel) => {
        if (!confirm(`Supprimer "${menu.name}" ? Cette action est irréversible.`)) return;
        setActionId(menu.id);
        try { await menusApi.remove(menu.id); await load(); }
        catch { alert('Impossible de supprimer ce menu.'); }
        finally { setActionId(null); }
    };

    const toggleProduct = (id: number) => {
        setForm(f => ({
            ...f,
            selectedProductIds: f.selectedProductIds.includes(id)
                ? f.selectedProductIds.filter(x => x !== id)
                : [...f.selectedProductIds, id],
        }));
    };

    const selectedProducts = products.filter(p => form.selectedProductIds.includes(p.id));
    const categories = [...new Set(selectedProducts.map(p => p.category))];

    return (
        <AdminLayout>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <div className="section-header">Menus</div>
                    <p className={styles.headerSub}>Gérez les formules proposées aux clients.</p>
                </div>
                <button className={`btn-primary ${styles.createBtn}`} onClick={openCreate}>
                    <Plus size={16} /> Nouveau menu
                </button>
            </div>

            {isLoading && <div className={styles.loading}><div className="spinner" /></div>}

            {!isLoading && menus.length === 0 && (
                <div className={styles.emptyBox}>Aucun menu créé pour l'instant.</div>
            )}

            {!isLoading && menus.length > 0 && (
                <div className={styles.grid}>
                    {menus.map(menu => {
                        const sandwiches = menu.allowedProducts?.filter(p => p.category === 'SANDWICH') ?? [];
                        const drinks = menu.allowedProducts?.filter(p => p.category === 'DRINK') ?? [];
                        const desserts = menu.allowedProducts?.filter(p => p.category === 'DESSERT') ?? [];
                        const sides = menu.allowedProducts?.filter(p => p.category === 'SIDE') ?? [];
                        const totalSep = menu.allowedProducts?.reduce((s, p) => s + Number(p.basePrice), 0) ?? 0;
                        const savings = totalSep - Number(menu.price);

                        return (
                            <div key={menu.id} className={`card-dark ${styles.card} ${!menu.isActive ? styles.cardInactive : ''}`}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <div className={styles.cardName}>{menu.name}</div>
                                        {menu.description && <div className={styles.cardDesc}>{menu.description}</div>}
                                    </div>
                                    <div className={styles.cardPriceBlock}>
                                        <div className="price-tag">{formatPrice(Number(menu.price))}</div>
                                        {savings > 0 && <div className={styles.cardSaving}>-{formatPrice(savings)}</div>}
                                    </div>
                                </div>

                                <div className="divider-orange" />

                                <div className={styles.composition}>
                                    {sandwiches.length > 0 && <CompoRow label="Sandwich" items={sandwiches.map(p => p.name)} />}
                                    {drinks.length > 0     && <CompoRow label="Boisson"   items={drinks.map(p => p.name)} />}
                                    {desserts.length > 0   && <CompoRow label="Dessert"   items={desserts.map(p => p.name)} />}
                                    {sides.length > 0      && <CompoRow label="Accomp."   items={sides.map(p => p.name)} />}
                                </div>

                                <div className={styles.cardFooter}>
                                    <span className={`${styles.statusBadge} ${menu.isActive ? styles.statusActive : styles.statusInactive}`}>
                                        {menu.isActive ? 'Actif' : 'Inactif'}
                                    </span>
                                    <div className={styles.actions}>
                                        <button title="Modifier" className={styles.actionBtn} onClick={() => openEdit(menu)}>
                                            <Pencil size={13} color="#A1A1AA" />
                                        </button>
                                        <button title={menu.isActive ? 'Désactiver' : 'Activer'} className={styles.actionBtn} disabled={actionId === menu.id} onClick={() => handleToggle(menu)}>
                                            <Power size={13} color={menu.isActive ? '#4ADE80' : '#F87171'} />
                                        </button>
                                        <button title="Supprimer" className={`${styles.actionBtn} ${styles.actionBtnDanger}`} disabled={actionId === menu.id} onClick={() => handleDelete(menu)}>
                                            <Trash2 size={13} color="#F87171" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>

                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editing ? 'Modifier le menu' : 'Nouveau menu'}
                            </h2>
                            <button className={styles.closeBtn} onClick={closeModal}><X size={20} /></button>
                        </div>

                        <div className={styles.modalBody}>
                            {formError && <div className={styles.errorBox}>{formError}</div>}

                            <div className={styles.formRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Nom *</label>
                                    <input className={styles.input} placeholder="Menu Midi" value={form.name}
                                           onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Prix (€) *</label>
                                    <input className={styles.input} type="number" step="0.01" min="0" placeholder="10.00"
                                           value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea className={`${styles.input} ${styles.textarea}`}
                                          placeholder="Sandwich + boisson + dessert au choix"
                                          value={form.description}
                                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Menu visible par les clients</span>
                                <button type="button"
                                        className={`${styles.toggle} ${form.isActive ? styles.toggleOn : ''}`}
                                        onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                                    <span className={`${styles.toggleThumb} ${form.isActive ? styles.toggleThumbOn : ''}`} />
                                </button>
                            </div>

                            <div>
                                <div className={styles.sectionTitle}>Produits inclus *</div>
                                {['SANDWICH', 'DRINK', 'DESSERT', 'SIDE'].map(cat => {
                                    const catProducts = products.filter(p => p.category === cat && p.isActive);
                                    if (catProducts.length === 0) return null;
                                    return (
                                        <div key={cat} style={{ marginBottom: '12px' }}>
                                            <div style={{ color: '#52525B', fontSize: '0.72rem', fontFamily: '"Oswald", sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                                {CATEGORY_LABEL[cat]}
                                            </div>
                                            <div className={styles.productGrid}>
                                                {catProducts.map(product => {
                                                    const selected = form.selectedProductIds.includes(product.id);
                                                    return (
                                                        <div key={product.id}
                                                             className={`${styles.productCheckRow} ${selected ? styles.productCheckRowSelected : ''}`}
                                                             onClick={() => toggleProduct(product.id)}>
                                                            <div className={`${styles.checkbox} ${selected ? styles.checkboxChecked : ''}`}>
                                                                {selected && <Check size={11} color="#0A0A0C" strokeWidth={3} />}
                                                            </div>
                                                            <span className={`${styles.productName} ${selected ? styles.productNameSelected : ''}`}>
                                                                {product.name}
                                                            </span>
                                                            <span className={styles.productCategory}>
                                                                {formatPrice(Number(product.basePrice))}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {categories.length > 0 && (
                                <div>
                                    <div className={styles.sectionTitle}>Configuration</div>
                                    <div className={styles.configGrid}>
                                        {(Object.keys(form.config) as Array<keyof typeof form.config>)
                                            .filter(cat => categories.includes(cat.toUpperCase() as ProductCategory))
                                            .map(cat => (
                                                <div key={cat} className={styles.configItem}>
                                                    <span className={styles.configLabel}>{CATEGORY_LABEL[cat.toUpperCase()]} obligatoire</span>
                                                    <button type="button"
                                                            className={`${styles.toggle} ${form.config[cat].required ? styles.toggleOn : ''}`}
                                                            onClick={() => setForm(f => ({ ...f, config: { ...f.config, [cat]: { required: !f.config[cat].required } } }))}>
                                                        <span className={`${styles.toggleThumb} ${form.config[cat].required ? styles.toggleThumbOn : ''}`} />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={closeModal}>Annuler</button>
                            <button className={`btn-primary ${styles.saveBtn}`} onClick={handleSave}
                                    disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                                <Save size={14} />
                                {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Créer le menu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function CompoRow({ label, items }: { label: string; items: string[] }) {
    return (
        <div className={styles.compoRow}>
            <span className={styles.compoLabel}>{label}</span>
            <span className={styles.compoItems}>{items.join(', ')}</span>
        </div>
    );
}