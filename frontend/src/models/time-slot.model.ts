import { Expose } from 'class-transformer';

export class TimeSlotModel {
    @Expose()
    id: number;

    @Expose()
    date: string; // YYYY-MM-DD

    @Expose()
    startTime: string; // HH:MM

    @Expose()
    endTime: string; // HH:MM

    @Expose()
    maxCapacity: number;

    @Expose()
    currentBookings: number;

    @Expose()
    isAvailable: boolean;

    get isFull(): boolean {
        return this.currentBookings >= this.maxCapacity;
    }

    get isBookable(): boolean {
        return this.isAvailable && !this.isFull;
    }

    get availableSpots(): number {
        return Math.max(0, this.maxCapacity - this.currentBookings);
    }

    get label(): string {
        return `${this.startTime} - ${this.endTime}`;
    }

    get fullLabel(): string {
        return `${this.date} | ${this.startTime} - ${this.endTime}`;
    }

    get occupancyPercent(): number {
        if (this.maxCapacity === 0) return 100;
        return Math.round((this.currentBookings / this.maxCapacity) * 100);
    }
}