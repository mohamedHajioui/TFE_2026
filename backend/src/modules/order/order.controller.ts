import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateManualOrderDto } from './dto/create-manual-order.dto';
import { DeliveryEstimateDto } from './dto/delivery-estimate.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { Order } from './entity/order.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entity/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('orders')
@UseGuards(RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Estimer le prix de livraison depuis lat/lng.
   */
  @Public()
  @Post('delivery-estimate')
  estimateDelivery(@Body() dto: DeliveryEstimateDto): {
    fee: number;
    distanceKm: number;
    outOfRange: boolean;
    label: string;
  } {
    return this.orderService.estimateDelivery(dto.customerLat, dto.customerLng);
  }

  /**
   * Créer une commande manuelle — ADMIN/EMPLOYEE (client sur place).
   * POST /api/orders/manual
   * Directement PAID + CONFIRMED, stock déduit immédiatement.
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post('manual')
  async createManual(
    @CurrentUser() user: User,
    @Body() dto: CreateManualOrderDto,
  ): Promise<Order> {
    return await this.orderService.createManualOrder(user.id, dto);
  }

  /**
   * Créer une commande — USER CONNECTÉ.
   */
  @Post('create')
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateOrderDto,
  ): Promise<Order> {
    return await this.orderService.create(user.id, dto);
  }

  /**
   * Créer une commande — INVITÉ (sans authentification).
   * POST /api/orders/guest/create
   */
  @Public()
  @Post('guest/create')
  async createGuest(@Body() dto: CreateOrderDto): Promise<Order> {
    return await this.orderService.createGuest(dto);
  }

  /**
   * Retrouver la dernière adresse utilisée par un invité pour un email donné.
   * Permet de préremplir le formulaire checkout. Public (invités l'appellent).
   *
   * GET /api/orders/guest/last-address?email=foo@bar.com
   */
  @Public()
  @Get('guest/last-address')
  async getLastGuestAddress(
    @Query('email') email: string,
    @Query('guestToken') guestToken: string,
  ): Promise<object | null> {
    if (!email || !guestToken) return null;
    return await this.orderService.getLastGuestAddress(email, guestToken);
  }

  /** Mes commandes (user connecté) */
  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: User): Promise<Order[]> {
    return await this.orderService.getMyOrders(user.id);
  }

  /**
   * Liste pour ADMIN/EMPLOYEE — UNIQUEMENT les commandes payées (règle métier).
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('list')
  async findAll(@Query() queryDto: QueryOrderDto): Promise<Order[]> {
    return await this.orderService.findAll(queryDto, undefined, true);
  }

  @Roles(UserRole.ADMIN)
  @Get('statistics')
  async getStatistics() {
    return await this.orderService.getStatistics();
  }

  /** Détail d'une commande */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Order> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.EMPLOYEE) {
      return await this.orderService.findOne(id);
    }
    return await this.orderService.findOne(id, user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return await this.orderService.updateStatus(id, dto);
  }

  @Put(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.cancel(id, user.id);
  }
}
