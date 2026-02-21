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
  async update(id: number, updateTimeSlotDto: UpdateTimeSlotDto): Promise<TimeSlot> {
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
   */
  async getAvailableSlots(date: string): Promise<TimeSlot[]> {
    return await this.timeSlotRepository
      .createQueryBuilder('timeSlot')
      .where('timeSlot.date = :date', { date })
      .andWhere('timeSlot.isAvailable = true')
      .andWhere('timeSlot.currentBookings < timeSlot.maxCapacity')
      .orderBy('timeSlot.startTime', 'ASC')
      .getMany();
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
    const slots: TimeSlot[] = [];
    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    // Pour chaque jour
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      // Générer les créneaux pour ce jour
      let currentTime = startTime;
      while (currentTime < endTime) {
        const [hours, minutes] = currentTime.split(':').map(Number);
        const slotEnd = new Date(0, 0, 0, hours, minutes + slotDuration);
        const endTimeStr = `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`;

        if (endTimeStr > endTime) break;

        const slot = this.timeSlotRepository.create({
          date: dateStr,
          startTime: currentTime,
          endTime: endTimeStr,
          maxCapacity,
          currentBookings: 0,
          isAvailable: true,
        });

        slots.push(slot);
        currentTime = endTimeStr;
      }
    }

    return await this.timeSlotRepository.save(slots);
  }
}
