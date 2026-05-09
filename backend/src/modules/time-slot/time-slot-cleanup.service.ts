import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { TimeSlot } from './entity/time-slot.entity';

/**
 * Service de nettoyage automatique des créneaux expirés.
 *
 * Un créneau est considéré expiré si sa date + heure de fin est passée.
 * La tâche tourne toutes les 30 minutes.
 */
@Injectable()
export class TimeSlotCleanupService {
  private readonly logger = new Logger(TimeSlotCleanupService.name);

  constructor(
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepo: Repository<TimeSlot>,
  ) {}

  /**
   * Supprime tous les créneaux dont la date est passée (avant aujourd'hui).
   * Pour les créneaux du jour, supprime ceux dont l'heure de fin est passée.
   * Tourne toutes les 30 minutes.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredSlots(): Promise<void> {
    const now = new Date();

    // Date du jour au format YYYY-MM-DD
    const todayStr = now.toISOString().split('T')[0];

    // Heure actuelle au format HH:MM
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      // Supprimer tous les créneaux des jours passés
      const pastResult = await this.timeSlotRepo
        .createQueryBuilder()
        .delete()
        .from(TimeSlot)
        .where('date < :today', { today: todayStr })
        .execute();

      // Supprimer les créneaux du jour dont l'heure de fin est passée
      const todayResult = await this.timeSlotRepo
        .createQueryBuilder()
        .delete()
        .from(TimeSlot)
        .where('date = :today AND "endTime" <= :currentTime', {
          today: todayStr,
          currentTime,
        })
        .execute();

      const total = (pastResult.affected ?? 0) + (todayResult.affected ?? 0);

      if (total > 0) {
        this.logger.log(`[Cleanup] ${total} créneau(x) expiré(s) supprimé(s).`);
      }
    } catch (err) {
      this.logger.error(`[Cleanup] Erreur : ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
