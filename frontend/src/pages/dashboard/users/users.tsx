import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { usersApi } from '@/api/users.api';
import { UserModel, UserRole, UserRoleLabel } from '@/models/user.model';
import { Search, Power, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/utils/validation';
import styles from './users.module.css';

const ROLE_STYLE: Record<UserRole, string> = {
    [UserRole.ADMIN]:    styles.roleAdmin,
    [UserRole.EMPLOYEE]: styles.roleEmployee,
    [UserRole.CLIENT]:   styles.roleClient,
};

export default function AdminUsers() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
    const [editing, setEditing] = useState<UserModel | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT);
    const [formError, setFormError] = useState<string | null>(null);
    const [formOk, setFormOk] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);

    const load = async () => {
        setIsLoading(true);
        try { setUsers(await usersApi.findAll()); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = users.filter(u => {
        const matchSearch = !search ||
            u.displayName.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const openEdit = (u: UserModel) => {
        setEditing(u);
        setSelectedRole(u.role);
        setFormError(null);
        setFormOk(null);
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        setFormError(null);
        setFormOk(null);
        try {
            await usersApi.adminUpdate(editing.id, { role: selectedRole });
            await load();
            setFormOk('Rôle mis à jour.');
        } catch (err: unknown) {
            setFormError(getApiErrorMessage(err));
        } finally { setSaving(false); }
    };

    const handleToggle = async (u: UserModel) => {
        if (u.id === currentUser?.id) return;
        setActionId(u.id);
        try { await usersApi.toggleActive(u.id); await load(); }
        finally { setActionId(null); }
    };

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <div className="section-header">Utilisateurs</div>
                    <p className={styles.headerSub}>Gérez les rôles et accès des comptes.</p>
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <Search size={15} color="#52525B" className={styles.searchIcon} />
                    <input className={styles.searchInput} placeholder="Rechercher par nom ou email..."
                           value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className={styles.select} value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}>
                    <option value="">Tous les rôles</option>
                    {Object.entries(UserRoleLabel).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
            </div>

            {isLoading && <div className={styles.loading}><div className="spinner" /></div>}

            {!isLoading && (
                <>
                    <div className={styles.count}>{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</div>
                    <div className={styles.table}>
                        <div className={styles.tableHead}>
                            {['Utilisateur', 'Rôle', 'Téléphone', 'Statut', 'Actions'].map(h => (
                                <div key={h} className={styles.tableHeadCell}>{h}</div>
                            ))}
                        </div>

                        {filtered.length === 0 && <div className={styles.emptyBox}>Aucun utilisateur trouvé.</div>}

                        {filtered.map(u => {
                            const isSelf = u.id === currentUser?.id;
                            return (
                                <div key={u.id} className={styles.tableRow}>
                                    <div className={styles.userCell}>
                                        <div className={styles.avatar}>{u.displayName.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <div className={styles.userName}>
                                                {u.displayName}
                                                {isSelf && <span style={{ color: 'var(--sg-amber)', fontSize: '0.7rem', marginLeft: '6px' }}>(vous)</span>}
                                            </div>
                                            <div className={styles.userEmail}>{u.email}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`${styles.roleBadge} ${ROLE_STYLE[u.role]}`}>
                                            {UserRoleLabel[u.role]}
                                        </span>
                                    </div>
                                    <div className={styles.userPhone}>
                                        {u.phoneNumber ?? <span style={{ color: '#3F3F46' }}>—</span>}
                                    </div>
                                    <div>
                                        <span className={`${styles.statusBadge} ${u.isActive ? styles.statusActive : styles.statusInactive}`}>
                                            {u.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    <div className={styles.actions}>
                                        <button className={styles.actionBtn} title="Modifier le rôle" onClick={() => openEdit(u)}>
                                            <Save size={13} color="#A1A1AA" />
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${isSelf ? styles.actionBtnDisabled : styles.actionBtnDanger}`}
                                            title={u.isActive ? 'Désactiver' : 'Activer'}
                                            disabled={isSelf || actionId === u.id}
                                            onClick={() => handleToggle(u)}
                                        >
                                            <Power size={13} color={u.isActive ? '#4ADE80' : '#F87171'} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {editing && (
                <div className={styles.overlay} onClick={() => setEditing(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Modifier le rôle</h2>
                            <button className={styles.closeBtn} onClick={() => setEditing(null)}><X size={20} /></button>
                        </div>

                        <div className={styles.modalBody}>
                            {formError && <div className={styles.errorBox}>{formError}</div>}
                            {formOk    && <div className={styles.successBox}>{formOk}</div>}

                            <div className={styles.userInfoBox}>
                                <div className={styles.avatar}>{editing.displayName.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div className={styles.userInfoName}>{editing.displayName}</div>
                                    <div className={styles.userInfoEmail}>{editing.email}</div>
                                    {editing.phoneNumber && (
                                        <div className={styles.userInfoEmail}>{editing.phoneNumber}</div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Rôle</label>
                                <select
                                    className={styles.input}
                                    value={selectedRole}
                                    onChange={e => setSelectedRole(e.target.value as UserRole)}
                                    disabled={editing.id === currentUser?.id}
                                >
                                    {Object.entries(UserRoleLabel).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                                {editing.id === currentUser?.id && (
                                    <span className={styles.inputHint}>Vous ne pouvez pas modifier votre propre rôle.</span>
                                )}
                            </div>

                            <button
                                className={`btn-primary ${styles.saveBtn}`}
                                onClick={handleSave}
                                disabled={saving || editing.id === currentUser?.id}
                                style={{ opacity: (saving || editing.id === currentUser?.id) ? 0.5 : 1 }}
                            >
                                <Save size={14} />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>

                            {editing.id !== currentUser?.id && (
                                <>
                                    <div className="divider-orange" />
                                    <div className={styles.sectionTitle}>Zone dangereuse</div>
                                    <div className={styles.dangerZone}>
                                        <div className={styles.dangerText}>
                                            {editing.isActive
                                                ? "Désactiver ce compte bloquera l'accès à l'application."
                                                : "Réactiver ce compte restaurera l'accès à l'application."}
                                        </div>
                                        <button className={styles.dangerBtn}
                                                onClick={() => { handleToggle(editing); setEditing(null); }}>
                                            {editing.isActive ? 'Désactiver' : 'Réactiver'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
