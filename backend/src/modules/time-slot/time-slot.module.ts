import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TimeSlotController } from './time-slot.controller';
import { TimeSlotService } from './time-slot.service';
import { TimeSlotCleanupService } from './time-slot-cleanup.service';
import { TimeSlot } from './entity/time-slot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeSlot]),
    ScheduleModule.forRoot(), // Active le scheduler NestJS
  ],
  controllers: [TimeSlotController],
  providers: [TimeSlotService, TimeSlotCleanupService],
  exports: [TimeSlotService],
})
export class TimeSlotModule {}
