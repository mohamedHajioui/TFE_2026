import { useEffect, useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, Euro, TrendingUp, Flame, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
    ordersApi,
    type OrderStatistics,
    type RevenueByPeriod,
    type TopIngredient,
    type PeakHour,
} from '@/api/orders.api';
import { getApiErrorMessage } from '@/utils/validation';
import styles from './statistics.module.css';

export default function DashboardStatistics() {
    const [stats, setStats] = useState<OrderStatistics | null>(null);
    const [revenue, setRevenue] = useState<RevenueByPeriod[]>([]);
    const [topIngredients, setTopIngredients] = useState<TopIngredient[]>([]);
    const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

    useEffect(() => {
        setLoading(true);
        setError('');
        (async () => {
            try {
                const [s, r, t, p] = await Promise.all([
                    ordersApi.getStatistics(),
                    ordersApi.getRevenueByPeriod(period, 30),
                    ordersApi.getTopIngredients(10),
                    ordersApi.getPeakHours(),
                ]);
                setStats(s);
                setRevenue(r);
                setTopIngredients(t);
                setPeakHours(p);
            } catch (err) {
                setError(getApiErrorMessage(err, 'Impossible de charger les statistiques'));
            } finally {
                setLoading(false);
            }
        })();
    }, [period]);

    const kpiCards = stats
        ? [
              { icon: ShoppingBag, value: String(stats.totalOrders), label: 'Commandes payées (total)' },
              { icon: Clock, value: String(stats.pendingOrders), label: 'En attente de préparation' },
              { icon: CheckCircle, value: String(stats.completedToday), label: "Terminées aujourd'hui" },
              { icon: Euro, value: `${stats.revenueToday.toFixed(2)} €`, label: "CA du jour" },
          ]
        : [];

    const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);
    const maxPeakOrders = Math.max(...peakHours.map((p) => p.orders), 1);

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div className="section-header">Statistiques</div>
                <p className={styles.headerSub}>Vue d'ensemble des performances.</p>
            </div>

            {loading && (
                <div className={styles.loading}>
                    <div className="spinner" />
                </div>
            )}

            {error && <div className={styles.errorBox}>{error}</div>}

            {!loading && !error && stats && (
                <>
                    <div className={styles.grid}>
                        {kpiCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.label} className={`card-dark ${styles.statCard}`}>
                                    <div className={styles.statIcon}>
                                        <Icon size={22} color="var(--sg-amber)" />
                                    </div>
                                    <div className={styles.statValue}>{card.value}</div>
                                    <div className={styles.statLabel}>{card.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.sectionsRow}>
                        <div className={`card-dark ${styles.sectionCard}`}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionTitleRow}>
                                    <TrendingUp size={18} color="var(--sg-amber)" />
                                    <span className={styles.sectionTitle}>Ventes par période</span>
                                </div>
                                <select
                                    className={styles.periodSelect}
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
                                >
                                    <option value="day">Par jour</option>
                                    <option value="week">Par semaine</option>
                                    <option value="month">Par mois</option>
                                </select>
                            </div>
                            {revenue.length === 0 ? (
                                <div className={styles.emptyText}>Aucune donnée</div>
                            ) : (
                                <div className={styles.barChart}>
                                    {revenue.map((r) => (
                                        <div key={r.date} className={styles.barCol}>
                                            <div className={styles.barValue}>{r.revenue.toFixed(0)} €</div>
                                            <div className={styles.barTrack}>
                                                <div
                                                    className={styles.barFill}
                                                    style={{ height: `${(r.revenue / maxRevenue) * 100}%` }}
                                                />
                                            </div>
                                            <div className={styles.barLabel}>
                                                {period === 'month' ? r.date : r.date.slice(5)}
                                            </div>
                                            <div className={styles.barOrders}>{r.orders} cmd</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.sectionsRow}>
                        <div className={`card-dark ${styles.sectionCard}`}>
                            <div className={styles.sectionTitleRow}>
                                <Flame size={18} color="var(--sg-amber)" />
                                <span className={styles.sectionTitle}>Ingrédients les plus utilisés</span>
                            </div>
                            {topIngredients.length === 0 ? (
                                <div className={styles.emptyText}>Aucune donnée</div>
                            ) : (
                                <div className={styles.rankList}>
                                    {topIngredients.map((ing, i) => (
                                        <div key={ing.ingredientName} className={styles.rankRow}>
                                            <span className={styles.rankNumber}>{i + 1}.</span>
                                            <span className={styles.rankName}>{ing.ingredientName}</span>
                                            <span className={styles.rankValue}>
                                                {ing.totalUsed.toFixed(1)} {ing.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={`card-dark ${styles.sectionCard}`}>
                            <div className={styles.sectionTitleRow}>
                                <BarChart3 size={18} color="var(--sg-amber)" />
                                <span className={styles.sectionTitle}>Heures de pointe</span>
                            </div>
                            {peakHours.length === 0 ? (
                                <div className={styles.emptyText}>Aucune donnée</div>
                            ) : (
                                <div className={styles.peakList}>
                                    {peakHours.map((p) => (
                                        <div key={p.hour} className={styles.peakRow}>
                                            <span className={styles.peakHour}>{String(p.hour).padStart(2, '0')}h</span>
                                            <div className={styles.peakBarTrack}>
                                                <div
                                                    className={styles.peakBarFill}
                                                    style={{ width: `${(p.orders / maxPeakOrders) * 100}%` }}
                                                />
                                            </div>
                                            <span className={styles.peakCount}>{p.orders}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
