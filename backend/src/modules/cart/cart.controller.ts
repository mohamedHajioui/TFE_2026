import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { SyncCartDto } from './dto/sync-cart.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entity/user.entity';
import { CartItem } from './entity/cart-item.entity';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Récupérer le panier de l'utilisateur connecté.
   * GET /api/cart
   */
  @Get()
  async getCart(@CurrentUser() user: User): Promise<CartItem[]> {
    return this.cartService.getCart(user.id);
  }

  /**
   * Ajouter un item au panier.
   * POST /api/cart/items
   */
  @Post('items')
  async addItem(
    @CurrentUser() user: User,
    @Body() dto: AddCartItemDto,
  ): Promise<CartItem[]> {
    return this.cartService.addItem(user.id, dto);
  }

  /**
   * Modifier la quantité d'un item.
   * PUT /api/cart/items/:id
   */
  @Put('items/:id')
  async updateItemQuantity(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartItem[]> {
    return this.cartService.updateItemQuantity(user.id, id, dto);
  }

  /**
   * Supprimer un item du panier.
   * DELETE /api/cart/items/:id
   */
  @Delete('items/:id')
  async removeItem(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CartItem[]> {
    return this.cartService.removeItem(user.id, id);
  }

  /**
   * Vider complètement le panier.
   * DELETE /api/cart
   */
  @Delete()
  async clearCart(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.cartService.clearCart(user.id);
    return { message: 'Panier vidé' };
  }

  /**
   * Synchroniser le panier local avec le panier DB (appelé au login).
   * POST /api/cart/sync
   */
  @Post('sync')
  async syncCart(
    @CurrentUser() user: User,
    @Body() dto: SyncCartDto,
  ): Promise<CartItem[]> {
    return this.cartService.syncCart(user.id, dto);
  }
}
