import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeSlot } from './entity/time-slot.entity';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { QueryTimeSlotDto } from './dto/query-time-slot.dto';

/**
 * Service gérant la logique métier des créneaux horaires
 */
@Injectable()
export class TimeSlotService {
  constructor(
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
  ) {}

  /**
   * Récupérer tous les créneaux avec filtres
   */
  async findAll(queryDto: QueryTimeSlotDto): Promise<TimeSlot[]> {
    const { date, dateFrom, dateTo, isAvailable, onlyFull } = queryDto;

    const queryBuilder = this.timeSlotRepository
      .createQueryBuilder('timeSlot')
      .leftJoinAndSelect('timeSlot.orders', 'orders');

    // Filtrer par date exacte
    if (date) {
      queryBuilder.andWhere('timeSlot.date = :date', { date });
    }

    // Filtrer par range de dates
    if (dateFrom && dateTo) {
      queryBuilder.andWhere('timeSlot.date BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    } else if (dateFrom) {
      queryBuilder.andWhere('timeSlot.date >= :dateFrom', { dateFrom });
    } else if (dateTo) {
      queryBuilder.andWhere('timeSlot.date <= :dateTo', { dateTo });
    }

    // Filtrer par disponibilité
    if (isAvailable !== undefined) {
      queryBuilder.andWhere('timeSlot.isAvailable = :isAvailable', {
        isAvailable,
      });

      // Si on filtre les créneaux disponibles, exclure aussi ceux dont l'heure est passée aujourd'hui
      if (isAvailable) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        queryBuilder.andWhere(
          '(timeSlot.date > :today OR (timeSlot.date = :today AND timeSlot.endTime > :currentTime))',
          { today, currentTime },
        );
      }
    }

    // Filtrer les créneaux complets
    if (onlyFull) {
      queryBuilder.andWhere('timeSlot.currentBookings >= timeSlot.maxCapacity');
    }

    // Trier par date et heure
    queryBuilder.orderBy('timeSlot.date', 'ASC');
    queryBuilder.addOrderBy('timeSlot.startTime', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Récupérer un créneau par ID
   */
  async findOne(id: number): Promise<TimeSlot> {
    const timeSlot = await this.timeSlotRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    if (!timeSlot) {
      throw new NotFoundException(`Créneau avec l'ID ${id} introuvable`);
    }

    return timeSlot;
  }

  /**
   * Créer un nouveau créneau
   */
  async create(createTimeSlotDto: CreateTimeSlotDto): Promise<TimeSlot> {
    // Valider que endTime > startTime
    if (createTimeSlotDto.endTime <= createTimeSlotDto.startTime) {
      throw new BadRequestException(
        "L'heure de fin doit être après l'heure de début",
      );
    }

    // Vérifier qu'il n'existe pas déjà un créneau qui se chevauche
    const overlapping = await this.timeSlotRepository
      .createQueryBuilder('timeSlot')
      .where('timeSlot.date = :date', { date: createTimeSlotDto.date })
      .andWhere(
        '(timeSlot.startTime < :endTime AND timeSlot.endTime > :startTime)',
        {
          startTime: createTimeSlotDto.startTime,
          endTime: createTimeSlotDto.endTime,
        },
      )
      .getOne();

    if (overlapping) {
      throw new ConflictException(
        `Un créneau existe déjà entre ${createTimeSlotDto.startTime} et ${createTimeSlotDto.endTime} le ${createTimeSlotDto.date}`,
      );
    }

    // Créer le créneau
    const timeSlot = this.timeSlotRepository.create({
      ...createTimeSlotDto,
      currentBookings: 0,
      isAvailable: createTimeSlotDto.isAvailable ?? true,
    });

    return await this.timeSlotRepository.save(timeSlot);
  }

  /**
   * Mettre à jour un créneau
   */
  async update(
    id: number,
    updateTimeSlotDto: UpdateTimeSlotDto,
  ): Promise<TimeSlot> {
    const timeSlot = await this.findOne(id);

    // Valider endTime > startTime si modifiés
    const newStartTime = updateTimeSlotDto.startTime ?? timeSlot.startTime;
    const newEndTime = updateTimeSlotDto.endTime ?? timeSlot.endTime;

    if (newEndTime <= newStartTime) {
      throw new BadRequestException(
        "L'heure de fin doit être après l'heure de début",
      );
    }

    // Valider currentBookings <= maxCapacity
    const newCurrentBookings =
      updateTimeSlotDto.currentBookings ?? timeSlot.currentBookings;
    const newMaxCapacity =
      updateTimeSlotDto.maxCapacity ?? timeSlot.maxCapacity;

    if (newCurrentBookings > newMaxCapacity) {
      throw new BadRequestException(
        'Les réservations actuelles ne peuvent pas dépasser la capacité maximale',
      );
    }

    // Mettre à jour
    Object.assign(timeSlot, updateTimeSlotDto);

    return await this.timeSlotRepository.save(timeSlot);
  }

  /**
   * Supprimer un créneau
   */
  async remove(id: number): Promise<void> {
    const timeSlot = await this.findOne(id);

    // Vérifier s'il y a des commandes liées
    if (timeSlot.orders && timeSlot.orders.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce créneau : ${timeSlot.orders.length} commande(s) associée(s)`,
      );
    }

    await this.timeSlotRepository.remove(timeSlot);
  }

  /**
   * Vérifier si un créneau est disponible
   */
  async isAvailable(id: number): Promise<boolean> {
    const timeSlot = await this.findOne(id);

    return (
      timeSlot.isAvailable && timeSlot.currentBookings < timeSlot.maxCapacity
    );
  }

  /**
   * Réserver une place dans un créneau
   */
  async bookSlot(id: number): Promise<TimeSlot> {
    const timeSlot = await this.findOne(id);

    if (!timeSlot.isAvailable) {
      throw new BadRequestException('Ce créneau est désactivé');
    }

    if (timeSlot.currentBookings >= timeSlot.maxCapacity) {
      throw new BadRequestException('Ce créneau est complet');
    }

    timeSlot.currentBookings += 1;

    return await this.timeSlotRepository.save(timeSlot);
  }

  /**
   * Libérer une place dans un créneau (annulation)
   */
  async releaseSlot(id: number): Promise<TimeSlot> {
    const timeSlot = await this.findOne(id);

    if (timeSlot.currentBookings <= 0) {
      throw new BadRequestException('Aucune réservation à annuler');
    }

    timeSlot.currentBookings -= 1;

    return await this.timeSlotRepository.save(timeSlot);
  }

  /**
   * Récupérer les créneaux disponibles pour une date
   * Filtre automatiquement les créneaux dont l'heure est déjà passée pour aujourd'hui
   */
  async getAvailableSlots(date: string): Promise<TimeSlot[]> {
    const now = new Date();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(now);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const currentTime = `${parts.find(p => p.type === 'hour')!.value}:${parts.find(p => p.type === 'minute')!.value}`;

    const qb = this.timeSlotRepository
      .createQueryBuilder('timeSlot')
      .where('timeSlot.date = :date', { date })
      .andWhere('timeSlot.isAvailable = true')
      .andWhere('timeSlot.currentBookings < timeSlot.maxCapacity');

    // Si la date demandée est aujourd'hui, exclure les créneaux dont l'heure de FIN est déjà passée
    if (date === today) {
      qb.andWhere('timeSlot.endTime > :currentTime', { currentTime });
    }

    qb.orderBy('timeSlot.startTime', 'ASC');

    return await qb.getMany();
  }

  /**
   * Générer des créneaux pour une période (helper pour admin)
   */
  async generateSlots(
    dateFrom: string,
    dateTo: string,
    startTime: string,
    endTime: string,
    slotDuration: number, // en minutes
    maxCapacity: number,
  ): Promise<TimeSlot[]> {
    if (endTime <= startTime) {
      throw new BadRequestException(
        "L'heure de fin doit être après l'heure de début",
      );
    }

    const slots: TimeSlot[] = [];
    const start = new Date(dateFrom + 'T00:00:00');
    const end = new Date(dateTo + 'T00:00:00');

    // Pour chaque jour
    const current = new Date(start);
    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

      // Générer les créneaux pour ce jour
      let slotStart = startTime;
      while (slotStart < endTime) {
        const [hours, minutes] = slotStart.split(':').map(Number);
        const slotEndDate = new Date(0, 0, 0, hours, minutes + slotDuration);
        const slotEndStr = `${String(slotEndDate.getHours()).padStart(2, '0')}:${String(slotEndDate.getMinutes()).padStart(2, '0')}`;

        if (slotEndStr > endTime) break;

        // Vérifier qu'il n'y a pas déjà un créneau qui chevauche
        const existing = await this.timeSlotRepository
          .createQueryBuilder('ts')
          .where('ts.date = :date', { date: dateStr })
          .andWhere(
            '(ts.startTime < :end AND ts.endTime > :start)',
            { start: slotStart, end: slotEndStr },
          )
          .getOne();

        if (!existing) {
          const slot = this.timeSlotRepository.create({
            date: dateStr,
            startTime: slotStart,
            endTime: slotEndStr,
            maxCapacity,
            currentBookings: 0,
            isAvailable: true,
          });
          slots.push(slot);
        }

        slotStart = slotEndStr;
      }

      current.setDate(current.getDate() + 1);
    }

    if (slots.length === 0) {
      throw new ConflictException(
        'Aucun créneau créé : tous les créneaux existent déjà pour cette période.',
      );
    }

    return await this.timeSlotRepository.save(slots);
  }
}
