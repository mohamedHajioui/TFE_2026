import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { productsApi } from '@/api/products.api';
import { ProductModel, ProductCategory, ProductCategoryLabel } from '@/models/product.model';
import { formatPrice } from '@/utils/format';
import { Plus, Pencil, Power, Trash2, X, Search, Save } from 'lucide-react';
import styles from './AdminProducts.module.css';

interface ProductForm {
    name: string;
    description: string;
    basePrice: string;
    category: ProductCategory | '';
    isActive: boolean;
    isCustomizable: boolean;
    imageUrl: string;
}

const EMPTY_FORM: ProductForm = {
    name: '', description: '', basePrice: '',
    category: '', isActive: true, isCustomizable: false, imageUrl: '',
};

export default function AdminProducts() {
    const [products, setProducts] = useState<ProductModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState<ProductCategory | ''>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProductModel | null>(null);
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
    const [saving, setSaving]= useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [actionId, setActionId]  = useState<number | null>(null);

    const load = async () => {
        setIsLoading(true);
        try { setProducts(await productsApi.findAll()); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = !catFilter || p.category === catFilter;
        return matchSearch && matchCat;
    });

    const openCreate = () => {
        setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true);
    };

    const openEdit = (p: ProductModel) => {
        setEditing(p);
        setForm({
            name: p.name, description: p.description ?? '', basePrice: String(Number(p.basePrice)),
            category: p.category, isActive: p.isActive, isCustomizable: p.isCustomizable,
            imageUrl: p.imageUrl ?? '',
        });
        setFormError(null); setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditing(null); };

    const handleSave = async () => {
        if (!form.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
        if (!form.category) { setFormError('La catégorie est obligatoire.'); return; }
        if (!form.basePrice || isNaN(Number(form.basePrice))) { setFormError('Le prix doit être un nombre valide.'); return; }

        setSaving(true); setFormError(null);

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            basePrice: Number(form.basePrice),
            category: form.category as ProductCategory,
            isActive: form.isActive,
            isCustomizable: form.isCustomizable,
            imageUrl: form.imageUrl.trim() || undefined,
        };

        try {
            if (editing) { await productsApi.update(editing.id, payload); }
            else { await productsApi.create(payload); }
            await load(); closeModal();
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? 'Une erreur est survenue.');
        } finally { setSaving(false); }
    };

    const handleToggle = async (p: ProductModel) => {
        setActionId(p.id);
        try { await productsApi.toggleActive(p.id); await load(); }
        finally { setActionId(null); }
    };

    const handleDelete = async (p: ProductModel) => {
        if (!confirm(`Supprimer "${p.name}" ?`)) return;
        setActionId(p.id);
        try { await productsApi.remove(p.id); await load(); }
        catch { alert('Impossible de supprimer ce produit.'); }
        finally { setActionId(null); }
    };

    const f = (key: keyof ProductForm, value: any) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <AdminLayout>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <div className="section-header">Produits</div>
                    <p className={styles.headerSub}>Gérez le catalogue de produits visible par les clients.</p>
                </div>
                <button className={`btn-primary ${styles.createBtn}`} onClick={openCreate}>
                    <Plus size={16} /> Nouveau produit
                </button>
            </div>

            {/* Filtres */}
            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <Search size={15} color="#52525B" className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Rechercher un produit..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select className={styles.select} value={catFilter} onChange={e => setCatFilter(e.target.value as any)}>
                    <option value="">Toutes les catégories</option>
                    {Object.entries(ProductCategoryLabel).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
            </div>

            {isLoading && <div className={styles.loading}><div className="spinner" /></div>}

            {!isLoading && (
                <>
                    <div className={styles.count}>{filtered.length} produit{filtered.length > 1 ? 's' : ''}</div>
                    <div className={styles.table}>
                        <div className={styles.tableHead}>
                            {['Produit', 'Catégorie', 'Prix', 'Statut', 'Actions'].map(h => (
                                <div key={h} className={styles.tableHeadCell}>{h}</div>
                            ))}
                        </div>

                        {filtered.length === 0 && <div className={styles.emptyBox}>Aucun produit trouvé</div>}

                        {filtered.map(product => (
                            <div key={product.id} className={`${styles.tableRow} ${!product.isActive ? styles.tableRowInactive : ''}`}>
                                <div className={styles.productCell}>
                                    {product.imageUrl
                                        ? <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                                        : <div className={styles.productImagePlaceholder} />
                                    }
                                    <div>
                                        <div className={styles.productName}>{product.name}</div>
                                        {product.description && <div className={styles.productDesc}>{product.description}</div>}
                                    </div>
                                </div>
                                <div><span className={styles.catBadge}>{product.categoryLabel}</span></div>
                                <div className="price-tag" style={{ fontSize: '0.95rem' }}>{formatPrice(Number(product.basePrice))}</div>
                                <div>
                                    <span className={`${styles.statusBadge} ${product.isActive ? styles.statusActive : styles.statusInactive}`}>
                                        {product.isActive ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                                <div className={styles.actions}>
                                    <button className={styles.actionBtn} title="Modifier" onClick={() => openEdit(product)}>
                                        <Pencil size={13} color="#A1A1AA" />
                                    </button>
                                    <button className={styles.actionBtn} title={product.isActive ? 'Désactiver' : 'Activer'} disabled={actionId === product.id} onClick={() => handleToggle(product)}>
                                        <Power size={13} color={product.isActive ? '#4ADE80' : '#F87171'} />
                                    </button>
                                    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Supprimer" disabled={actionId === product.id} onClick={() => handleDelete(product)}>
                                        <Trash2 size={13} color="#F87171" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
                            <button className={styles.closeBtn} onClick={closeModal}><X size={20} /></button>
                        </div>

                        <div className={styles.modalBody}>
                            {formError && <div className={styles.errorBox}>{formError}</div>}

                            <div className={styles.formRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Nom *</label>
                                    <input className={styles.input} placeholder="Sandwich Américain" value={form.name} onChange={e => f('name', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Catégorie *</label>
                                    <select className={styles.input} value={form.category} onChange={e => f('category', e.target.value)}>
                                        <option value="">Choisir...</option>
                                        {Object.entries(ProductCategoryLabel).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Prix de base (€) *</label>
                                    <input className={styles.input} type="number" step="0.01" min="0" placeholder="6.50" value={form.basePrice} onChange={e => f('basePrice', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>URL image</label>
                                    <input className={styles.input} placeholder="https://..." value={form.imageUrl} onChange={e => f('imageUrl', e.target.value)} />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Pain blanc, jambon, fromage..." value={form.description} onChange={e => f('description', e.target.value)} />
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Produit visible par les clients</span>
                                <button type="button" className={`${styles.toggle} ${form.isActive ? styles.toggleOn : ''}`} onClick={() => f('isActive', !form.isActive)}>
                                    <span className={`${styles.toggleThumb} ${form.isActive ? styles.toggleThumbOn : ''}`} />
                                </button>
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Personnalisable (retirer/ajouter ingrédients)</span>
                                <button type="button" className={`${styles.toggle} ${form.isCustomizable ? styles.toggleOn : ''}`} onClick={() => f('isCustomizable', !form.isCustomizable)}>
                                    <span className={`${styles.toggleThumb} ${form.isCustomizable ? styles.toggleThumbOn : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={closeModal}>Annuler</button>
                            <button className={`btn-primary ${styles.saveBtn}`} onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                                <Save size={14} />
                                {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Créer le produit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}