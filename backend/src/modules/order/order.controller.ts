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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { Order } from './entity/order.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../users/entity/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('orders')
@UseGuards(RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Créer une commande
   * POST /api/orders/create
   */
  @Post('create')
  async create(
    @CurrentUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    return await this.orderService.create(user.id, createOrderDto);
  }

  /**
   * Mes commandes
   * GET /api/orders/my-orders
   */
  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: User): Promise<Order[]> {
    return await this.orderService.getMyOrders(user.id);
  }

  /**
   * Détail d'une commande
   * GET /api/orders/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Order> {
    // Si admin/employee, pas de restriction userId
    if (user.role === UserRole.ADMIN || user.role === UserRole.EMPLOYEE) {
      return await this.orderService.findOne(id);
    }

    // Sinon, vérifier que c'est bien sa commande
    return await this.orderService.findOne(id, user.id);
  }

  /**
   * Liste des commandes (ADMIN/EMPLOYEE)
   * GET /api/orders/list
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('list')
  async findAll(@Query() queryDto: QueryOrderDto): Promise<Order[]> {
    return await this.orderService.findAll(queryDto);
  }

  /**
   * Changer le statut (ADMIN/EMPLOYEE)
   * PUT /api/orders/:id/status
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return await this.orderService.updateStatus(id, updateStatusDto);
  }

  /**
   * Annuler une commande (CLIENT)
   * PUT /api/orders/:id/cancel
   */
  @Put(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.cancel(id, user.id);
  }

  /**
   * Statistiques (ADMIN)
   * GET /api/orders/statistics
   */
  @Roles(UserRole.ADMIN)
  @Get('statistics')
  async getStatistics() {
    return await this.orderService.getStatistics();
  }
}
