import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entity/order.entity';

/**
 * DTO pour changer le statut d'une commande (ADMIN/EMPLOYEE)
 */
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Statut invalide' })
  @IsNotEmpty({ message: 'Statut requis' })
  status: OrderStatus;

  @IsString({ message: 'Note interne invalide' })
  @IsOptional()
  internalNote?: string;
}
