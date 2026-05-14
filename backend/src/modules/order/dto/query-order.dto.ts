import { IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, OrderType, PaymentStatus } from '../entity/order.entity';

/**
 * DTO pour filtrer les commandes
 */
export class QueryOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  date?: string; // Filtrer par date de retrait/livraison

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number; // Pour admin: voir les commandes d'un user spécifique
}
