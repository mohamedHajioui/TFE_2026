import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entity/cart-item.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { SyncCartDto } from './dto/sync-cart.dto';
import { Product } from '../products/entity/product.entity';
import { Menu } from '../menus/entity/menu.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  /**
   * Récupérer le panier complet d'un utilisateur avec les relations hydratées.
   */
  async getCart(userId: number): Promise<CartItem[]> {
    return this.cartItemRepository.find({
      where: { user: { id: userId } },
      relations: [
        'product',
        'product.productIngredients',
        'product.productIngredients.ingredient',
        'menu',
        'menu.allowedProducts',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Ajouter un item au panier.
   * Si un produit identique (même productId + même customization) existe déjà,
   * on incrémente la quantité. Les menus sont toujours ajoutés séparément.
   */
  async addItem(userId: number, dto: AddCartItemDto): Promise<CartItem[]> {
    if (dto.itemType === 'product') {
      if (!dto.productId) {
        throw new BadRequestException('productId requis pour un item de type product');
      }

      const product = await this.productRepository.findOne({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException(`Produit ${dto.productId} introuvable`);
      }

      // Vérifier si le même produit avec la même customization existe déjà
      const existingItems = await this.cartItemRepository.find({
        where: {
          user: { id: userId },
          itemType: 'product',
          product: { id: dto.productId },
        },
      });

      const match = existingItems.find(
        (item) =>
          JSON.stringify(item.customization) ===
          JSON.stringify(dto.customization ?? null),
      );

      if (match) {
        match.quantity += dto.quantity;
        await this.cartItemRepository.save(match);
      } else {
        const cartItem = this.cartItemRepository.create({
          user: { id: userId } as any,
          itemType: 'product',
          product: { id: dto.productId } as any,
          quantity: dto.quantity,
          customization: dto.customization ?? null,
          specialInstructions: dto.specialInstructions ?? null,
        });
        await this.cartItemRepository.save(cartItem);
      }
    } else {
      // Menu — toujours un nouvel item
      if (!dto.menuId) {
        throw new BadRequestException('menuId requis pour un item de type menu');
      }

      const menu = await this.menuRepository.findOne({
        where: { id: dto.menuId },
      });
      if (!menu) {
        throw new NotFoundException(`Menu ${dto.menuId} introuvable`);
      }

      const cartItem = this.cartItemRepository.create({
        user: { id: userId } as any,
        itemType: 'menu',
        menu: { id: dto.menuId } as any,
        quantity: dto.quantity,
        menuChoices: dto.menuChoices ?? null,
        specialInstructions: dto.specialInstructions ?? null,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.getCart(userId);
  }

  /**
   * Modifier la quantité d'un item du panier.
   */
  async updateItemQuantity(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartItem[]> {
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, user: { id: userId } },
    });

    if (!item) {
      throw new NotFoundException(`Item de panier ${itemId} introuvable`);
    }

    item.quantity = dto.quantity;
    await this.cartItemRepository.save(item);

    return this.getCart(userId);
  }

  /**
   * Supprimer un item du panier.
   */
  async removeItem(userId: number, itemId: number): Promise<CartItem[]> {
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, user: { id: userId } },
    });

    if (!item) {
      throw new NotFoundException(`Item de panier ${itemId} introuvable`);
    }

    await this.cartItemRepository.remove(item);

    return this.getCart(userId);
  }

  /**
   * Vider complètement le panier.
   */
  async clearCart(userId: number): Promise<void> {
    await this.cartItemRepository.delete({ user: { id: userId } });
  }

  /**
   * Synchroniser le panier local (mémoire) avec le panier DB.
   * Appelé au login : on fusionne les items locaux dans le panier existant.
   * - Produits identiques (même productId + customization) → on additionne les quantités
   * - Menus → toujours ajoutés comme nouveaux items
   */
  async syncCart(userId: number, dto: SyncCartDto): Promise<CartItem[]> {
    for (const itemDto of dto.items) {
      await this.addItem(userId, itemDto);
    }
    return this.getCart(userId);
  }
}
