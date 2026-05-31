import {useState, useEffect, useCallback} from 'react';
import {DashboardLayout} from '@/components/layouts/DashboardLayout';
import {timeSlotsApi, type CreateTimeSlotData, type GenerateSlotsData} from '@/api/time-slots.api';
import {TimeSlotModel} from '@/models/time-slot.model';
import {useAuth} from '@/context/AuthContext';
import {UserRole} from '@/models';
import { getApiErrorMessage } from '@/utils/validation';
import {
    Plus, Trash2, RefreshCw, ChevronDown, ChevronUp,
    Zap, Calendar, AlertCircle, Check,
} from 'lucide-react';
import styles from './time-slots.module.css';

function ConfirmModal({
                          message,
                          onConfirm,
                          onCancel,
                      }: {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className={styles.modalOverlay} onClick={onCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalIcon}>
                    <Trash2 size={22} color="#EF4444"/>
                </div>
                <h3 className={styles.modalTitle}>Confirmer la suppression</h3>
                <p className={styles.modalMessage}>{message}</p>
                <div className={styles.modalActions}>
                    <button className={styles.modalBtnConfirm} onClick={onConfirm}>
                        Supprimer
                    </button>
                    <button className={styles.modalBtnCancel} onClick={onCancel}>
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
    } catch {
        return iso;
    }
}

function groupByDate(slots: TimeSlotModel[]): Map<string, TimeSlotModel[]> {
    const map = new Map<string, TimeSlotModel[]>();
    for (const slot of slots) {
        const key = slot.date;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(slot);
    }
    return map;
}

const today = new Date().toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

const DEFAULT_GENERATE: GenerateSlotsData = {
    dateFrom: today,
    dateTo: nextWeek,
    startTime: '11:00',
    endTime: '14:00',
    slotDuration: 30,
    maxCapacity: 10,
};

const DEFAULT_CREATE: CreateTimeSlotData = {
    date: today,
    startTime: '12:00',
    endTime: '12:30',
    maxCapacity: 10,
    isAvailable: true,
};

export default function AdminTimeSlots() {
    const {user} = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const [slots, setSlots] = useState<TimeSlotModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createData, setCreateData] = useState<CreateTimeSlotData>(DEFAULT_CREATE);
    const [creating, setCreating] = useState(false);

    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [generateData, setGenerateData] = useState<GenerateSlotsData>(DEFAULT_GENERATE);
    const [generating, setGenerating] = useState(false);

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    };

    const fetchSlots = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await timeSlotsApi.findAll({dateFrom, dateTo});
            setSlots(data);
        } catch {
            setError('Impossible de charger les créneaux.');
        } finally {
            setIsLoading(false);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);
        try {
            await timeSlotsApi.create(createData);
            showSuccess('Créneau créé avec succès.');
            setShowCreateForm(false);
            setCreateData(DEFAULT_CREATE);
            await fetchSlots();
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Impossible de créer le créneau.'));
        } finally {
            setCreating(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setError(null);
        try {
            const result = await timeSlotsApi.generateSlots(generateData);
            showSuccess(`${result.created} créneau(x) générés avec succès.`);
            setShowGenerateForm(false);
            await fetchSlots();
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Impossible de générer les créneaux.'));
        } finally {
            setGenerating(false);
        }
    };

    const requestDelete = (id: number, label: string) => {
        setConfirmDelete({id, label});
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        const {id} = confirmDelete;
        setConfirmDelete(null);
        setDeletingId(id);
        try {
            await timeSlotsApi.remove(id);
            showSuccess('Créneau supprimé.');
            setSlots(prev => prev.filter(s => s.id !== id));
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Impossible de supprimer ce créneau (commandes associées ?).'));
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleAvailable = async (slot: TimeSlotModel) => {
        try {
            await timeSlotsApi.update(slot.id, {isAvailable: !slot.isAvailable});
            setSlots(prev => prev.map(s =>
                s.id === slot.id ? {...s, isAvailable: !s.isAvailable} as TimeSlotModel : s,
            ));
        } catch {
            setError('Impossible de modifier la disponibilité.');
        }
    };

    const grouped = groupByDate(slots);

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div>
                    <div className="section-header">Créneaux horaires</div>
                    <p className={styles.headerSub}>
                        Gérez les plages horaires disponibles pour la commande.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    {isAdmin && (
                        <button
                            className={styles.btnGenerate}
                            onClick={() => {
                                setShowGenerateForm(p => !p);
                                setShowCreateForm(false);
                            }}
                        >
                            <Zap size={15}/>
                            Générer automatiquement
                        </button>
                    )}
                    <button
                        className={styles.btnCreate}
                        onClick={() => {
                            setShowCreateForm(p => !p);
                            setShowGenerateForm(false);
                        }}
                    >
                        <Plus size={15}/>
                        Nouveau créneau
                    </button>
                </div>
            </div>

            {success && (
                <div className={styles.successBox}>
                    <Check size={14}/> {success}
                </div>
            )}
            {error && (
                <div className={styles.errorBox}>
                    <AlertCircle size={14}/> {error}
                </div>
            )}

            {showCreateForm && (
                <div className={`card-dark ${styles.formCard}`}>
                    <h3 className={styles.formTitle}>
                        <Plus size={16}/> Nouveau créneau
                    </h3>
                    <form onSubmit={handleCreate} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Date</label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={createData.date}
                                    onChange={e => setCreateData(p => ({...p, date: e.target.value}))}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Heure début</label>
                                <input
                                    type="time"
                                    className={styles.formInput}
                                    value={createData.startTime}
                                    onChange={e => setCreateData(p => ({...p, startTime: e.target.value}))}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Heure fin</label>
                                <input
                                    type="time"
                                    className={styles.formInput}
                                    value={createData.endTime}
                                    onChange={e => setCreateData(p => ({...p, endTime: e.target.value}))}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Capacité max</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    value={createData.maxCapacity}
                                    min={1}
                                    onChange={e => setCreateData(p => ({...p, maxCapacity: Number(e.target.value)}))}
                                    required
                                />
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button type="submit" className={styles.btnPrimary} disabled={creating}>
                                {creating ? 'Création...' : 'Créer le créneau'}
                            </button>
                            <button
                                type="button"
                                className={styles.btnCancel}
                                onClick={() => setShowCreateForm(false)}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showGenerateForm && isAdmin && (
                <div className={`card-dark ${styles.formCard}`}>
                    <h3 className={styles.formTitle}>
                        <Zap size={16}/> Génération automatique
                    </h3>
                    <p className={styles.formDesc}>
                        Génère des créneaux de durée fixe entre deux heures, pour chaque jour de la période.
                    </p>
                    <form onSubmit={handleGenerate} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Du</label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={generateData.dateFrom}
                                    onChange={e => setGenerateData(p => ({...p, dateFrom: e.target.value}))}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Au</label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={generateData.dateTo}
                                    onChange={e => setGenerateData(p => ({...p, dateTo: e.target.value}))}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Heure début</label>
                                <input
                                    type="time"
                                    className={styles.formInput}
                                    value={generateData.startTime}
                                    onChange={e => setGenerateData(p => ({...p, startTime: e.target.value}))}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Heure fin</label>
                                <input
                                    type="time"
                                    className={styles.formInput}
                                    value={generateData.endTime}
                                    onChange={e => setGenerateData(p => ({...p, endTime: e.target.value}))}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Durée créneau (min)</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    value={generateData.slotDuration}
                                    min={5}
                                    step={5}
                                    onChange={e => setGenerateData(p => ({...p, slotDuration: Number(e.target.value)}))}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Capacité par créneau</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    value={generateData.maxCapacity}
                                    min={1}
                                    onChange={e => setGenerateData(p => ({...p, maxCapacity: Number(e.target.value)}))}
                                    required
                                />
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button type="submit" className={styles.btnPrimary} disabled={generating}>
                                {generating ? 'Génération...' : 'Générer les créneaux'}
                            </button>
                            <button
                                type="button"
                                className={styles.btnCancel}
                                onClick={() => setShowGenerateForm(false)}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className={styles.filters}>
                <div className={styles.filterField}>
                    <label className={styles.filterLabel}>Du</label>
                    <input
                        type="date"
                        className={styles.filterInput}
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                </div>
                <div className={styles.filterField}>
                    <label className={styles.filterLabel}>Au</label>
                    <input
                        type="date"
                        className={styles.filterInput}
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                    />
                </div>
                <button className={styles.refreshBtn} onClick={fetchSlots}>
                    <RefreshCw size={14}/> Actualiser
                </button>
            </div>

            {isLoading && (
                <div className={styles.loading}>
                    <div className="spinner"/>
                </div>
            )}

            {!isLoading && slots.length === 0 && (
                <div className={styles.emptyBox}>
                    <Calendar size={32} color="#3F3F46"/>
                    <p className={styles.emptyTitle}>Aucun créneau sur cette période</p>
                    <p className={styles.emptyText}>
                        Créez des créneaux manuellement ou utilisez la génération automatique.
                    </p>
                </div>
            )}

            {!isLoading && slots.length > 0 && (
                <div className={styles.dayList}>
                    {Array.from(grouped.entries()).map(([date, daySlots]) => (
                        <DayGroup
                            key={date}
                            date={date}
                            slots={daySlots}
                            isAdmin={isAdmin}
                            deletingId={deletingId}
                            onDelete={requestDelete}
                            onToggle={handleToggleAvailable}
                        />
                    ))}
                </div>
            )}

            {confirmDelete && (
                <ConfirmModal
                    message={`Supprimer le créneau ${confirmDelete.label} ? Cette action est irréversible.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </DashboardLayout>
    );
}

function DayGroup({
                      date,
                      slots,
                      isAdmin,
                      deletingId,
                      onDelete,
                      onToggle,
                  }: {
    date: string;
    slots: TimeSlotModel[];
    isAdmin: boolean;
    deletingId: number | null;
    onDelete: (id: number, label: string) => void;
    onToggle: (slot: TimeSlotModel) => void;
}) {
    const [expanded, setExpanded] = useState(true);

    const totalCapacity = slots.reduce((s, sl) => s + sl.maxCapacity, 0);
    const totalBooked = slots.reduce((s, sl) => s + (sl.currentBookings ?? 0), 0);

    return (
        <div className={styles.dayGroup}>
            <button
                className={styles.dayHeader}
                onClick={() => setExpanded(p => !p)}
            >
                <div className={styles.dayInfo}>
                    <span className={styles.dayTitle}>{formatDate(date)}</span>
                    <span className={styles.dayMeta}>
                        {slots.length} créneau{slots.length > 1 ? 'x' : ''} · {totalBooked}/{totalCapacity} places réservées
                    </span>
                </div>
                {expanded ? <ChevronUp size={16} color="#71717A"/> : <ChevronDown size={16} color="#71717A"/>}
            </button>

            {expanded && (
                <div className={styles.slotList}>
                    {slots.map(slot => (
                        <SlotRow
                            key={slot.id}
                            slot={slot}
                            isAdmin={isAdmin}
                            isDeleting={deletingId === slot.id}
                            onDelete={onDelete}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SlotRow({
                     slot,
                     isDeleting,
                     onDelete,
                     onToggle,
                 }: {
    slot: TimeSlotModel;
    isAdmin: boolean;
    isDeleting: boolean;
    onDelete: (id: number, label: string) => void;
    onToggle: (slot: TimeSlotModel) => void;
}) {
    const booked = slot.currentBookings ?? 0;
    const pct = Math.round((booked / slot.maxCapacity) * 100);
    const isFull = booked >= slot.maxCapacity;

    return (
        <div className={`${styles.slotRow} ${!slot.isAvailable ? styles.slotRowDisabled : ''}`}>
            <div className={styles.slotTime}>
                {slot.startTime} – {slot.endTime}
            </div>

            <div className={styles.slotCapacity}>
                <div className={styles.slotCapacityBar}>
                    <div
                        className={styles.slotCapacityFill}
                        style={{
                            width: `${pct}%`,
                            background: isFull ? '#EF4444' : pct > 70 ? '#F59E0B' : 'var(--sg-amber)',
                        }}
                    />
                </div>
                <span className={styles.slotCapacityText}>
                    {booked}/{slot.maxCapacity} places
                </span>
            </div>

            <div className={styles.slotStatus}>
                <span
                    className={slot.isAvailable ? styles.badgeActive : styles.badgeInactive}
                >
                    {slot.isAvailable ? 'Actif' : 'Désactivé'}
                </span>
            </div>

            <div className={styles.slotActions}>
                <button
                    className={styles.btnToggle}
                    onClick={() => onToggle(slot)}
                    title={slot.isAvailable ? 'Désactiver' : 'Activer'}
                >
                    {slot.isAvailable ? 'Désactiver' : 'Activer'}
                </button>
                <button
                    className={styles.btnDelete}
                    onClick={() => onDelete(slot.id, `${slot.startTime}–${slot.endTime}`)}
                    disabled={isDeleting}
                    title="Supprimer"
                >
                    <Trash2 size={14}/>
                </button>
            </div>
        </div>
    );
}