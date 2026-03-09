import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TimeSlotService } from './time-slot.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { QueryTimeSlotDto } from './dto/query-time-slot.dto';
import { TimeSlot } from './entity/time-slot.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';


/**
 * Controller gérant les endpoints des créneaux horaires
 */
@Controller('time-slots')
@UseGuards(RolesGuard)
export class TimeSlotController {
  constructor(private readonly timeSlotService: TimeSlotService) {}

  /**
   * Liste tous les créneaux
   * GET /api/time-slots/list
   */
  @Public()
  @Get('list')
  async findAll(@Query() queryDto: QueryTimeSlotDto): Promise<TimeSlot[]> {
    return await this.timeSlotService.findAll(queryDto);
  }

  /**
   * Créneaux disponibles pour une date
   * GET /api/time-slots/available/2026-02-15
   */
  @Public()
  @Get('available/:date')
  async getAvailableSlots(@Param('date') date: string): Promise<TimeSlot[]> {
    return await this.timeSlotService.getAvailableSlots(date);
  }

  /**
   * Détail d'un créneau
   * GET /api/time-slots/:id
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TimeSlot> {
    return await this.timeSlotService.findOne(id);
  }

  /**
   * Vérifier disponibilité
   * GET /api/time-slots/:id/check-availability
   */
  @Public()
  @Get(':id/check-availability')
  async checkAvailability(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    available: boolean;
    currentBookings: number;
    maxCapacity: number;
  }> {
    const timeSlot = await this.timeSlotService.findOne(id);
    const available = await this.timeSlotService.isAvailable(id);

    return {
      available,
      currentBookings: timeSlot.currentBookings,
      maxCapacity: timeSlot.maxCapacity,
    };
  }

  /**
   * Créer un créneau
   * POST /api/time-slots/create
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post('create')
  async create(
    @Body() createTimeSlotDto: CreateTimeSlotDto,
  ): Promise<TimeSlot> {
    return await this.timeSlotService.create(createTimeSlotDto);
  }

  /**
   * Générer des créneaux en masse
   * POST /api/time-slots/generate
   */
  @Roles(UserRole.ADMIN)
  @Post('generate')
  async generateSlots(
    @Body()
    body: {
      dateFrom: string;
      dateTo: string;
      startTime: string;
      endTime: string;
      slotDuration: number;
      maxCapacity: number;
    },
  ): Promise<{ created: number; slots: TimeSlot[] }> {
    const slots = await this.timeSlotService.generateSlots(
      body.dateFrom,
      body.dateTo,
      body.startTime,
      body.endTime,
      body.slotDuration,
      body.maxCapacity,
    );

    return {
      created: slots.length,
      slots,
    };
  }

  /**
   * Modifier un créneau
   * PUT /api/time-slots/:id/update
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
  ): Promise<TimeSlot> {
    return await this.timeSlotService.update(id, updateTimeSlotDto);
  }

  /**
   * Supprimer un créneau
   * DELETE /api/time-slots/:id/delete
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.timeSlotService.remove(id);
  }
}
