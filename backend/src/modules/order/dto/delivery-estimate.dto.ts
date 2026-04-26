import { IsNumber } from 'class-validator';

export class DeliveryEstimateDto {
  @IsNumber()
  customerLat: number;

  @IsNumber()
  customerLng: number;
}
