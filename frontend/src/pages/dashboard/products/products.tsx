import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { productsApi, type ProductIngredientData } from '@/api/products.api';
import { ingredientsApi } from '@/api/ingredients.api';
import { ProductModel, ProductCategory, ProductCategoryLabel } from '@/models/product.model';
import { IngredientModel } from '@/models/ingredient.model';
import { formatPrice } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/validation';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Plus, Pencil, Power, Trash2, X, Search, Save, Upload } from 'lucide-react';
import { resolveImageUrl } from '@/utils/imageUrl';
import { ErrorModal } from '@/components/ui/ErrorModal';
import styles from './products.module.css';

interface IngredientFormRow {
    ingredientId: number | '';
    quantity: string;
    unit: string;
    isRequired: boolean;
    extraPrice: string;
}

interface ProductForm {
    name: string;
    description: string;
    basePrice: string;
    category: ProductCategory | '';
    isActive: boolean;
    isCustomizable: boolean;
    imageUrl: string;
    ingredients: IngredientFormRow[];
}

const EMPTY_INGREDIENT: IngredientFormRow = {
    ingredientId: '', quantity: '1', unit: '', isRequired: true, extraPrice: '0',
};

const EMPTY_FORM: ProductForm = {
    name: '', description: '', basePrice: '',
    category: '', isActive: true, isCustomizable: false, imageUrl: '',
    ingredients: [],
};

export default function AdminProducts() {
    const [products, setProducts] = useState<ProductModel[]>([]);
    const [allIngredients, setAllIngredients] = useState<IngredientModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState<ProductCategory | ''>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProductModel | null>(null);
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<number | null>(null);
    const [toggleError, setToggleError] = useState<string | null>(null);
    const { imagePreview, uploading, fileInputRef, handleFileChange, openFilePicker, resetImage, setPreviewFromUrl } = useImageUpload();

    const load = async () => {
        setIsLoading(true);
        try {
            const [prods, ings] = await Promise.all([
                productsApi.findAll(),
                ingredientsApi.findAll({ isAvailable: true }),
            ]);
            setProducts(prods);
            setAllIngredients(ings);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = !catFilter || p.category === catFilter;
        return matchSearch && matchCat;
    });

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        resetImage();
        setModalOpen(true);
    };

    const openEdit = (p: ProductModel) => {
        setEditing(p);
        setForm({
            name: p.name,
            description: p.description ?? '',
            basePrice: String(Number(p.basePrice)),
            category: p.category,
            isActive: p.isActive,
            isCustomizable: p.isCustomizable,
            imageUrl: p.imageUrl ?? '',
            ingredients: (p.productIngredients ?? []).map(pi => ({
                ingredientId: pi.ingredient?.id ?? '',
                quantity: String(Number(pi.quantity)),
                unit: pi.unit ?? pi.ingredient?.unit ?? '',
                isRequired: pi.isRequired,
                extraPrice: String(Number(pi.extraPrice)),
            })),
        });
        setPreviewFromUrl(p.imageUrl);
        setFormError(null);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditing(null); resetImage(); };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormError(null);
        try {
            const url = await handleFileChange(e);
            if (url) setForm(prev => ({ ...prev, imageUrl: url }));
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Erreur lors de l'upload de l'image.");
        }
    };

    const addIngredientRow = () => {
        setForm(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { ...EMPTY_INGREDIENT }],
        }));
    };

    const removeIngredientRow = (index: number) => {
        setForm(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index),
        }));
    };

    const updateIngredientRow = (index: number, key: keyof IngredientFormRow, value: any) => {
        setForm(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((row, i) => {
                if (i !== index) return row;
                const updated = { ...row, [key]: value };
                if (key === 'ingredientId' && value) {
                    const ing = allIngredients.find(ig => ig.id === Number(value));
                    if (ing) updated.unit = ing.unit;
                }
                return updated;
            }),
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
        if (!form.category) { setFormError('La catégorie est obligatoire.'); return; }
        if (!form.basePrice || isNaN(Number(form.basePrice))) { setFormError('Le prix doit être un nombre valide.'); return; }

        for (const row of form.ingredients) {
            if (!row.ingredientId) { setFormError('Chaque ingrédient doit être sélectionné.'); return; }
            if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
                setFormError('La quantité de chaque ingrédient doit être un nombre positif.'); return;
            }
        }

        setSaving(true);
        setFormError(null);

        const ingredients: ProductIngredientData[] = form.ingredients.map(row => ({
            ingredientId: Number(row.ingredientId),
            quantity: Number(row.quantity),
            unit: row.unit || undefined,
            isRequired: row.isRequired,
            extraPrice: Number(row.extraPrice) || 0,
        }));

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            basePrice: Number(form.basePrice),
            category: form.category as ProductCategory,
            isActive: form.isActive,
            isCustomizable: form.isCustomizable,
            imageUrl: form.imageUrl.trim() || undefined,
            ingredients,
        };

        try {
            if (editing) { await productsApi.update(editing.id, payload); }
            else { await productsApi.create(payload); }
            await load();
            closeModal();
        } catch (err: unknown) {
            setFormError(getApiErrorMessage(err));
        } finally { setSaving(false); }
    };

    const handleToggle = async (p: ProductModel) => {
        setActionId(p.id);
        try {
            await productsApi.toggleActive(p.id);
            await load();
        } catch (err: unknown) {
            setToggleError(getApiErrorMessage(err));
        } finally { setActionId(null); }
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
        <DashboardLayout>
            {toggleError && (
                <ErrorModal
                    title="Réactivation impossible"
                    message={toggleError}
                    onClose={() => setToggleError(null)}
                />
            )}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <div className="section-header">Produits</div>
                    <p className={styles.headerSub}>Gerez le catalogue de produits visible par les clients.</p>
                </div>
                <button className={`btn-primary ${styles.createBtn}`} onClick={openCreate}>
                    <Plus size={16} /> Nouveau produit
                </button>
            </div>

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
                    <option value="">Toutes les categories</option>
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
                            {['Produit', 'Categorie', 'Prix', 'Statut', 'Actions'].map(h => (
                                <div key={h} className={styles.tableHeadCell}>{h}</div>
                            ))}
                        </div>

                        {filtered.length === 0 && <div className={styles.emptyBox}>Aucun produit trouve</div>}

                        {filtered.map(product => (
                            <div key={product.id} className={`${styles.tableRow} ${!product.isActive ? styles.tableRowInactive : ''}`}>
                                <div className={styles.productCell}>
                                    {product.imageUrl
                                        ? <img src={resolveImageUrl(product.imageUrl) ?? ''} alt={product.name} className={styles.productImage} />
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
                                    <button className={styles.actionBtn} title={product.isActive ? 'Desactiver' : 'Activer'} disabled={actionId === product.id} onClick={() => handleToggle(product)}>
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
                                    <input className={styles.input} placeholder="Sandwich Americain" value={form.name} onChange={e => f('name', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Categorie *</label>
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
                                    <label className={styles.label}>Prix de base (EUR) *</label>
                                    <input className={styles.input} type="number" step="0.01" min="0" placeholder="6.50" value={form.basePrice} onChange={e => f('basePrice', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Image du produit</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        style={{ display: 'none' }}
                                        onChange={handleImageUpload}
                                    />
                                    <div className={styles.uploadZone} onClick={openFilePicker}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className={styles.uploadPreview} />
                                        ) : (
                                            <div className={styles.uploadPlaceholder}>
                                                {uploading ? (
                                                    <div className="spinner" style={{ width: 24, height: 24 }} />
                                                ) : (
                                                    <>
                                                        <Upload size={20} color="#52525B" />
                                                        <span>Cliquez pour ajouter une image</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Pain blanc, fromage..." value={form.description} onChange={e => f('description', e.target.value)} />
                            </div>

                            <div className={styles.ingredientsSection}>
                                <div className={styles.ingredientsSectionHeader}>
                                    <label className={styles.label}>Ingredients</label>
                                    <button type="button" className={styles.addIngredientBtn} onClick={addIngredientRow}>
                                        <Plus size={13} /> Ajouter
                                    </button>
                                </div>

                                {form.ingredients.length === 0 && (
                                    <div className={styles.noIngredients}>
                                        Aucun ingredient lie. Ajoutez-en pour activer la gestion du stock et la personnalisation.
                                    </div>
                                )}

                                <div className={styles.ingredientsList}>
                                    {form.ingredients.map((row, idx) => (
                                        <div key={idx} className={styles.ingredientRow}>
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.label}>Ingredient *</label>
                                                <select
                                                    className={styles.ingredientSelect}
                                                    value={row.ingredientId}
                                                    onChange={e => updateIngredientRow(idx, 'ingredientId', e.target.value ? Number(e.target.value) : '')}
                                                >
                                                    <option value="">Choisir...</option>
                                                    {allIngredients.map(ing => (
                                                        <option key={ing.id} value={ing.id}>
                                                            {ing.name} ({Number(ing.currentStock)} {ing.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.label}>Qte</label>
                                                <input
                                                    className={styles.input}
                                                    type="number"
                                                    step="0.1"
                                                    min="0.1"
                                                    value={row.quantity}
                                                    onChange={e => updateIngredientRow(idx, 'quantity', e.target.value)}
                                                />
                                            </div>
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.label}>Type</label>
                                                <div className={styles.ingredientTypeToggle}>
                                                    <button
                                                        type="button"
                                                        className={`${styles.ingredientTypeBtn} ${row.isRequired ? styles.ingredientTypeBtnActive : ''}`}
                                                        onClick={() => updateIngredientRow(idx, 'isRequired', true)}
                                                    >
                                                        Base
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`${styles.ingredientTypeBtn} ${!row.isRequired ? styles.ingredientTypeBtnActive : ''}`}
                                                        onClick={() => updateIngredientRow(idx, 'isRequired', false)}
                                                    >
                                                        Extra
                                                    </button>
                                                </div>
                                            </div>
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.label}>Suppl.</label>
                                                <input
                                                    className={styles.input}
                                                    type="number"
                                                    step="0.10"
                                                    min="0"
                                                    value={row.extraPrice}
                                                    onChange={e => updateIngredientRow(idx, 'extraPrice', e.target.value)}
                                                    disabled={row.isRequired}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.removeIngredientBtn}
                                                onClick={() => removeIngredientRow(idx)}
                                            >
                                                <X size={14} color="#F87171" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Produit visible par les clients</span>
                                <button type="button" className={`${styles.toggle} ${form.isActive ? styles.toggleOn : ''}`} onClick={() => f('isActive', !form.isActive)}>
                                    <span className={`${styles.toggleThumb} ${form.isActive ? styles.toggleThumbOn : ''}`} />
                                </button>
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Personnalisable (retirer/ajouter ingredients)</span>
                                <button type="button" className={`${styles.toggle} ${form.isCustomizable ? styles.toggleOn : ''}`} onClick={() => f('isCustomizable', !form.isCustomizable)}>
                                    <span className={`${styles.toggleThumb} ${form.isCustomizable ? styles.toggleThumbOn : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={closeModal}>Annuler</button>
                            <button className={`btn-primary ${styles.saveBtn}`} onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                                <Save size={14} />
                                {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Creer le produit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
