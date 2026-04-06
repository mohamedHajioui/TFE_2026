import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { ingredientsApi, type CreateIngredientData } from '@/api/ingredients.api';
import { IngredientModel, IngredientCategory, IngredientCategoryLabel } from '@/models/ingredient.model';
import { Plus, Minus, Search, AlertTriangle, X, Save, Pencil } from 'lucide-react';
import styles from './AdminIngredients.module.css';

type AdjustMode = 'add' | 'remove';

interface AdjustModal {
    ingredient: IngredientModel;
    mode: AdjustMode;
    quantity: string;
    reason: string;
    error: string | null;
    saving: boolean;
}

interface IngredientForm {
    name: string;
    category: IngredientCategory | '';
    currentStock: string;
    minStock: string;
    unit: string;
    costPerUnit: string;
}

const EMPTY_FORM: IngredientForm = {
    name: '', category: '', currentStock: '0',
    minStock: '0', unit: 'kg', costPerUnit: '0',
};

export default function AdminIngredients() {
    const [ingredients, setIngredients] = useState<IngredientModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState<IngredientCategory | ''>('');
    const [alertOnly, setAlertOnly] = useState(false);
    const [modal, setModal] = useState<AdjustModal | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<IngredientModel | null>(null);
    const [form, setForm] = useState<IngredientForm>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setIsLoading(true);
        try { setIngredients(await ingredientsApi.findAll()); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = ingredients.filter(ing => {
        const matchSearch = !search || ing.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = !catFilter || ing.category === catFilter;
        const matchAlert = !alertOnly || Number(ing.currentStock) <= Number(ing.minStock);
        return matchSearch && matchCat && matchAlert;
    });

    const alertCount = ingredients.filter(i => Number(i.currentStock) <= Number(i.minStock)).length;

    const getStockStatus = (ing: IngredientModel) => {
        if (Number(ing.currentStock) <= 0) return 'empty';
        if (Number(ing.currentStock) <= Number(ing.minStock)) return 'alert';
        return 'ok';
    };

    // Ajustement stock

    const openAdjust = (ingredient: IngredientModel, mode: AdjustMode) => {
        setModal({ ingredient, mode, quantity: '', reason: '', error: null, saving: false });
    };

    const handleAdjust = async () => {
        if (!modal) return;
        const qty = Number(modal.quantity);
        if (!modal.quantity || isNaN(qty) || qty <= 0) {
            setModal(m => m ? { ...m, error: 'La quantité doit être un nombre positif.' } : null);
            return;
        }
        setModal(m => m ? { ...m, saving: true, error: null } : null);
        try {
            const adjustment = modal.mode === 'add' ? qty : -qty;
            await ingredientsApi.adjustStock(
                modal.ingredient.id,
                adjustment,
                modal.reason || (modal.mode === 'add' ? 'Réapprovisionnement' : 'Consommation'),
            );
            await load();
            setModal(null);
        } catch (err: any) {
            setModal(m => m ? { ...m, saving: false, error: err?.response?.data?.message ?? 'Erreur lors de l\'ajustement.' } : null);
        }
    };

    const newStock = modal
        ? modal.mode === 'add'
            ? Number(modal.ingredient.currentStock) + (Number(modal.quantity) || 0)
            : Number(modal.ingredient.currentStock) - (Number(modal.quantity) || 0)
        : 0;

    // Création ingrédient

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError(null);
        setCreateOpen(true);
    };

    const openEdit = (ing: IngredientModel) => {
        setEditing(ing);
        setForm({
            name: ing.name,
            category: ing.category,
            currentStock: String(Number(ing.currentStock)),
            minStock: String(Number(ing.minStock)),
            unit: ing.unit,
            costPerUnit: String(Number(ing.costPerUnit ?? 0)),
        });
        setFormError(null);
        setEditOpen(true);
    };

    const handleEdit = async () => {
        if (!editing) return;
        if (!form.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
        if (!form.category) { setFormError('La catégorie est obligatoire.'); return; }

        setSaving(true);
        setFormError(null);
        try {
            await ingredientsApi.update(editing.id, {
                name: form.name.trim(),
                category: form.category as IngredientCategory,
                minStock: Number(form.minStock) || 0,
                unit: form.unit.trim(),
                costPerUnit: Number(form.costPerUnit) || 0,
            });
            await load();
            setEditOpen(false);
            setEditing(null);
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? 'Une erreur est survenue.');
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = async () => {
        if (!form.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
        if (!form.category) { setFormError('La catégorie est obligatoire.'); return; }
        if (!form.unit.trim()) { setFormError('L\'unité est obligatoire.'); return; }

        setSaving(true);
        setFormError(null);

        const payload: CreateIngredientData = {
            name: form.name.trim(),
            category: form.category as IngredientCategory,
            currentStock: Number(form.currentStock) || 0,
            minStock:  Number(form.minStock) || 0,
            unit: form.unit.trim(),
            costPerUnit: Number(form.costPerUnit) || 0,
            isAvailable: true,
        };

        try {
            await ingredientsApi.create(payload);
            await load();
            setCreateOpen(false);
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? 'Une erreur est survenue.');
        } finally {
            setSaving(false);
        }
    };

    const f = (key: keyof IngredientForm, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    return (
        <AdminLayout>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <div className="section-header">Stocks & Ingrédients</div>
                    <p className={styles.headerSub}>
                        Suivez et ajustez les niveaux de stock en temps réel.
                        {alertCount > 0 && (
                            <span style={{ color: '#F59E0B', marginLeft: '8px' }}>
                                ⚠ {alertCount} en alerte
                            </span>
                        )}
                    </p>
                </div>
                <button className={`btn-primary ${styles.createBtn}`} onClick={openCreate}>
                    <Plus size={16} /> Nouvel ingrédient
                </button>
            </div>

            {/* Filtres */}
            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <Search size={15} color="#52525B" className={styles.searchIcon} />
                    <input className={styles.searchInput} placeholder="Rechercher un ingrédient..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className={styles.select} value={catFilter} onChange={e => setCatFilter(e.target.value as any)}>
                    <option value="">Toutes les catégories</option>
                    {Object.entries(IngredientCategoryLabel).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
                <button className={`${styles.alertFilter} ${alertOnly ? styles.alertFilterActive : ''}`} onClick={() => setAlertOnly(p => !p)}>
                    <AlertTriangle size={14} /> Alertes seulement
                </button>
            </div>

            {isLoading && <div className={styles.loading}><div className="spinner" /></div>}

            {!isLoading && (
                <>
                    <div className={styles.count}>{filtered.length} ingrédient{filtered.length > 1 ? 's' : ''}</div>
                    <div className={styles.table}>
                        <div className={styles.tableHead}>
                            {['Ingrédient', 'Catégorie', 'Stock actuel', 'Statut', 'Ajuster'].map(h => (
                                <div key={h} className={styles.tableHeadCell}>{h}</div>
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className={styles.emptyBox}>Aucun ingrédient trouvé.</div>
                        )}

                        {filtered.map(ing => {
                            const status = getStockStatus(ing);
                            return (
                                <div key={ing.id} className={styles.tableRow}>
                                    {/* Nom */}
                                    <div>
                                        <div className={styles.ingredientName}>
                                            {status !== 'ok' && <span className={styles.alertDot} />}
                                            {ing.name}
                                        </div>
                                        <div className={styles.ingredientUnit}>{ing.unit}</div>
                                    </div>

                                    {/* Catégorie */}
                                    <div><span className={styles.catBadge}>{ing.categoryLabel}</span></div>

                                    {/* Stock — simple, sans barre */}
                                    <div>
                                        <div className={styles.stockCurrent}>
                                            {Number(ing.currentStock).toFixed(1)} {ing.unit}
                                        </div>
                                        <div className={styles.stockMin}>
                                            Seuil d'alerte : {Number(ing.minStock)} {ing.unit}
                                        </div>
                                    </div>

                                    {/* Statut */}
                                    <div>
                                        <span className={`${styles.statusBadge} ${status === 'ok' ? styles.statusOk : status === 'alert' ? styles.statusAlert : styles.statusEmpty}`}>
                                            {status === 'ok' ? 'OK' : status === 'alert' ? 'Alerte' : 'Épuisé'}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className={styles.actions}>
                                        <button className={styles.actionBtn} title="Modifier" onClick={() => openEdit(ing)}>
                                            <Pencil size={13} color="#A1A1AA" />
                                        </button>
                                        <button className={styles.actionBtn} title="Ajouter du stock" onClick={() => openAdjust(ing, 'add')}>
                                            <Plus size={14} color="#4ADE80" />
                                        </button>
                                        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Retirer du stock" onClick={() => openAdjust(ing, 'remove')}>
                                            <Minus size={14} color="#F87171" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Modal ajustement stock */}
            {modal && (
                <div className={styles.overlay} onClick={() => setModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {modal.mode === 'add' ? 'Ajouter du stock' : 'Retirer du stock'}
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setModal(null)}><X size={20} /></button>
                        </div>
                        <div className={styles.modalBody}>
                            {modal.error && <div className={styles.errorBox}>{modal.error}</div>}
                            <div className={styles.stockInfo}>
                                <div className={styles.stockInfoName}>{modal.ingredient.name}</div>
                                <div className={styles.stockInfoCurrent}>
                                    Stock actuel : {Number(modal.ingredient.currentStock).toFixed(1)} {modal.ingredient.unit}
                                    {' · '}Seuil d'alerte : {Number(modal.ingredient.minStock)} {modal.ingredient.unit}
                                </div>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Quantité à {modal.mode === 'add' ? 'ajouter' : 'retirer'} ({modal.ingredient.unit}) *
                                </label>
                                <input className={styles.input} type="number" step="0.1" min="0.1" placeholder="Ex: 2.5"
                                       value={modal.quantity} autoFocus
                                       onChange={e => setModal(m => m ? { ...m, quantity: e.target.value } : null)} />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Raison (optionnel)</label>
                                <input className={styles.input}
                                       placeholder={modal.mode === 'add' ? 'Réapprovisionnement fournisseur' : 'Préparation cuisine'}
                                       value={modal.reason}
                                       onChange={e => setModal(m => m ? { ...m, reason: e.target.value } : null)} />
                            </div>
                            {modal.quantity && !isNaN(Number(modal.quantity)) && Number(modal.quantity) > 0 && (
                                <div className={styles.adjustPreview}>
                                    <span className={styles.adjustPreviewLabel}>Nouveau stock</span>
                                    <span className={`${styles.adjustPreviewValue} ${modal.mode === 'add' ? styles.adjustPreviewAdd : styles.adjustPreviewRemove}`}>
                                        {Math.max(0, newStock).toFixed(1)} {modal.ingredient.unit}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setModal(null)}>Annuler</button>
                            <button className={`btn-primary ${styles.saveBtn}`} onClick={handleAdjust}
                                    disabled={modal.saving}
                                    style={{ opacity: modal.saving ? 0.7 : 1, background: modal.mode === 'add' ? '#16a34a' : '#dc2626' }}>
                                <Save size={14} />
                                {modal.saving ? 'Enregistrement...' : modal.mode === 'add' ? 'Ajouter' : 'Retirer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal créer ingrédient */}
            {createOpen && (
                <div className={styles.overlay} onClick={() => setCreateOpen(false)}>
                    <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Nouvel ingrédient</h2>
                            <button className={styles.closeBtn} onClick={() => setCreateOpen(false)}><X size={20} /></button>
                        </div>
                        <div className={styles.modalBody}>
                            {formError && <div className={styles.errorBox}>{formError}</div>}

                            <div className={styles.formRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Nom *</label>
                                    <input className={styles.input} placeholder="Tomate" value={form.name} onChange={e => f('name', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Catégorie *</label>
                                    <select className={styles.input} value={form.category} onChange={e => f('category', e.target.value)}>
                                        <option value="">Choisir...</option>
                                        {Object.entries(IngredientCategoryLabel).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Stock initial</label>
                                    <input className={styles.input} type="number" step="0.1" min="0" placeholder="0" value={form.currentStock} onChange={e => f('currentStock', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Seuil d'alerte</label>
                                    <input className={styles.input} type="number" step="0.1" min="0" placeholder="0.5" value={form.minStock} onChange={e => f('minStock', e.target.value)} />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Unité *</label>
                                    <select className={styles.input} value={form.unit} onChange={e => f('unit', e.target.value)}>
                                        <option value="kg">kg</option>
                                        <option value="litres">litres</option>
                                        <option value="pièces">pièces</option>
                                        <option value="grammes">grammes</option>
                                        <option value="ml">ml</option>
                                    </select>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Coût / unité (€)</label>
                                    <input className={styles.input} type="number" step="0.01" min="0" placeholder="0.00" value={form.costPerUnit} onChange={e => f('costPerUnit', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setCreateOpen(false)}>Annuler</button>
                            <button className={`btn-primary ${styles.saveBtn}`} onClick={handleCreate}
                                    disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                                <Save size={14} />
                                {saving ? 'Création...' : 'Créer l\'ingrédient'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal éditer ingrédient */}
            {editOpen && editing && (
                <div className={styles.overlay} onClick={() => setEditOpen(false)}>
                    <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Modifier l'ingrédient</h2>
                            <button className={styles.closeBtn} onClick={() => setEditOpen(false)}><X size={20} /></button>
                        </div>
                        <div className={styles.modalBody}>
                            {formError && <div className={styles.errorBox}>{formError}</div>}

                            <div className={styles.formRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Nom *</label>
                                    <input className={styles.input} value={form.name} onChange={e => f('name', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Catégorie *</label>
                                    <select className={styles.input} value={form.category} onChange={e => f('category', e.target.value)}>
                                        <option value="">Choisir...</option>
                                        {Object.entries(IngredientCategoryLabel).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Seuil d'alerte</label>
                                    <input className={styles.input} type="number" step="0.1" min="0" value={form.minStock} onChange={e => f('minStock', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Unité *</label>
                                    <select className={styles.input} value={form.unit} onChange={e => f('unit', e.target.value)}>
                                        <option value="kg">kg</option>
                                        <option value="litres">litres</option>
                                        <option value="pièces">pièces</option>
                                        <option value="grammes">grammes</option>
                                        <option value="ml">ml</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Coût / unité (€)</label>
                                <input className={styles.input} type="number" step="0.01" min="0" value={form.costPerUnit} onChange={e => f('costPerUnit', e.target.value)} />
                            </div>

                            <div className={styles.stockInfo}>
                                <div className={styles.stockInfoCurrent}>
                                    Stock actuel : <strong>{Number(editing.currentStock).toFixed(1)} {editing.unit}</strong> — utilisez les boutons + / - pour modifier le stock.
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setEditOpen(false)}>Annuler</button>
                            <button className={`btn-primary ${styles.saveBtn}`} onClick={handleEdit}
                                    disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                                <Save size={14} />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}