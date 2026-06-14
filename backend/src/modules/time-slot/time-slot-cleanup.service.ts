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

    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(now);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const currentTime = `${parts.find(p => p.type === 'hour')!.value}:${parts.find(p => p.type === 'minute')!.value}`;

    try {
      // Désactiver (au lieu de supprimer) les créneaux des jours passés
      const pastResult = await this.timeSlotRepo
        .createQueryBuilder()
        .update(TimeSlot)
        .set({ isAvailable: false })
        .where('date < :today AND "isAvailable" = true', { today: todayStr })
        .execute();

      // Désactiver les créneaux du jour dont l'heure de fin est passée
      const todayResult = await this.timeSlotRepo
        .createQueryBuilder()
        .update(TimeSlot)
        .set({ isAvailable: false })
        .where(
          'date = :today AND "endTime" <= :currentTime AND "isAvailable" = true',
          {
            today: todayStr,
            currentTime,
          },
        )
        .execute();

      const total = (pastResult.affected ?? 0) + (todayResult.affected ?? 0);

      if (total > 0) {
        this.logger.log(
          `[Cleanup] ${total} créneau(x) expiré(s) désactivé(s).`,
        );
      }
    } catch (err) {
      this.logger.error(
        `[Cleanup] Erreur : ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
