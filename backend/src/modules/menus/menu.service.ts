import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entity/menu.entity';
import { Product } from '../products/entity/product.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';

/**
 * Service gérant la logique métier des menus
 */
@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Récupérer tous les menus avec filtres
   */
  async findAll(queryDto: QueryMenuDto): Promise<Menu[]> {
    const { isActive, availableNow, date, search } = queryDto;

    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.allowedProducts', 'allowedProducts');

    // Filtrer par actif/inactif
    if (isActive !== undefined) {
      queryBuilder.andWhere('menu.isActive = :isActive', { isActive });
    }

    // Filtrer par disponibilité aujourd'hui
    if (availableNow) {
      const today = new Date().toISOString().split('T')[0];
      queryBuilder.andWhere(
        '(menu.availableFrom IS NULL OR menu.availableFrom <= :today)',
        { today },
      );
      queryBuilder.andWhere(
        '(menu.availableTo IS NULL OR menu.availableTo >= :today)',
        { today },
      );
    }

    // Filtrer par date spécifique
    if (date) {
      queryBuilder.andWhere(
        '(menu.availableFrom IS NULL OR menu.availableFrom <= :date)',
        { date },
      );
      queryBuilder.andWhere(
        '(menu.availableTo IS NULL OR menu.availableTo >= :date)',
        { date },
      );
    }

    // Recherche textuelle
    if (search) {
      queryBuilder.andWhere(
        '(menu.name ILIKE :search OR menu.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Trier par nom
    queryBuilder.orderBy('menu.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Récupérer un menu par ID
   */
  async findOne(id: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: ['allowedProducts'],
    });

    if (!menu) {
      throw new NotFoundException(`Menu avec l'ID ${id} introuvable`);
    }

    return menu;
  }

  /**
   * Créer un nouveau menu
   */
  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    // Vérifier si un menu avec ce nom existe déjà
    const existingMenu = await this.menuRepository.findOne({
      where: { name: createMenuDto.name },
    });

    if (existingMenu) {
      throw new ConflictException(`Un menu nommé "${createMenuDto.name}" existe déjà`);
    }

    // Valider les dates
    if (
      createMenuDto.availableFrom &&
      createMenuDto.availableTo &&
      createMenuDto.availableFrom > createMenuDto.availableTo
    ) {
      throw new BadRequestException('La date de début doit être avant la date de fin');
    }

    // Vérifier que tous les produits existent
    const products = await this.productRepository.findByIds(createMenuDto.productIds);

    if (products.length !== createMenuDto.productIds.length) {
      throw new BadRequestException('Un ou plusieurs produits sont introuvables');
    }

    // Calculer le prix total des produits pour info
    const totalProductsPrice = products.reduce(
      (sum, product) => sum + Number(product.basePrice),
      0,
    );

    // Vérifier que le prix du menu est inférieur au total (économie)
    if (createMenuDto.price >= totalProductsPrice) {
      throw new BadRequestException(
        `Le prix du menu (${createMenuDto.price}€) devrait être inférieur au total des produits (${totalProductsPrice}€) pour être avantageux`,
      );
    }

    // Créer le menu
    const menu = new Menu();
    menu.name = createMenuDto.name;
    menu.description = createMenuDto.description ?? null;
    menu.price = createMenuDto.price;
    menu.imageUrl = createMenuDto.imageUrl ?? null;
    menu.availableFrom = createMenuDto.availableFrom ?? null;
    menu.availableTo = createMenuDto.availableTo ?? null;
    menu.isActive = createMenuDto.isActive ?? true;
    menu.configuration = createMenuDto.configuration;
    menu.allowedProducts = products;

    return await this.menuRepository.save(menu);
  }

  /**
   * Mettre à jour un menu
   */
  async update(id: number, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.findOne(id);

    // Vérifier si le nouveau nom existe déjà
    if (updateMenuDto.name && updateMenuDto.name !== menu.name) {
      const existingMenu = await this.menuRepository.findOne({
        where: { name: updateMenuDto.name },
      });

      if (existingMenu) {
        throw new ConflictException(`Un menu nommé "${updateMenuDto.name}" existe déjà`);
      }
    }

    // Valider les dates si modifiées
    const newAvailableFrom = updateMenuDto.availableFrom ?? menu.availableFrom;
    const newAvailableTo = updateMenuDto.availableTo ?? menu.availableTo;

    if (newAvailableFrom && newAvailableTo && newAvailableFrom > newAvailableTo) {
      throw new BadRequestException('La date de début doit être avant la date de fin');
    }

    // Si les produits sont modifiés, les valider
    if (updateMenuDto.productIds) {
      const products = await this.productRepository.findByIds(updateMenuDto.productIds);

      if (products.length !== updateMenuDto.productIds.length) {
        throw new BadRequestException('Un ou plusieurs produits sont introuvables');
      }

      menu.allowedProducts = products;
    }

    // Mettre à jour les autres champs
    if (updateMenuDto.name) menu.name = updateMenuDto.name;
    if (updateMenuDto.description !== undefined) menu.description = updateMenuDto.description;
    if (updateMenuDto.price !== undefined) menu.price = updateMenuDto.price;
    if (updateMenuDto.imageUrl !== undefined) menu.imageUrl = updateMenuDto.imageUrl;
    if (updateMenuDto.isActive !== undefined) menu.isActive = updateMenuDto.isActive;
    if (updateMenuDto.availableFrom) menu.availableFrom = updateMenuDto.availableFrom;
    if (updateMenuDto.availableTo) menu.availableTo = updateMenuDto.availableTo;
    if (updateMenuDto.configuration !== undefined) menu.configuration = updateMenuDto.configuration;

    return await this.menuRepository.save(menu);
  }

  /**
   * Supprimer un menu
   */
  async remove(id: number): Promise<void> {
    const menu = await this.findOne(id);
    await this.menuRepository.remove(menu);
  }

  /**
   * Activer/désactiver un menu.
   * La réactivation est bloquée si une catégorie requise n'a plus de produit actif.
   */
  async toggleActive(id: number): Promise<Menu> {
    const menu = await this.findOne(id);

    if (!menu.isActive) {
      const config = menu.configuration;
      const products = menu.allowedProducts ?? [];
      const categories = ['sandwich', 'drink', 'dessert', 'side'] as const;

      for (const cat of categories) {
        const catConfig = config[cat];
        if (!catConfig?.required || catConfig.quantity === 0) continue;

        const catUpper = cat.toUpperCase();
        const activeInCategory = products.filter(
          (p) => p.category === catUpper && p.isActive,
        );

        if (activeInCategory.length === 0) {
          throw new BadRequestException(
            `Impossible de réactiver "${menu.name}" : aucun produit actif dans la catégorie "${cat}"`,
          );
        }
      }
    }

    menu.isActive = !menu.isActive;
    return await this.menuRepository.save(menu);
  }

  /**
   * Vérifier si un menu est disponible à une date donnée
   */
  async isAvailableOnDate(id: number, date: string): Promise<boolean> {
    const menu = await this.findOne(id);

    if (!menu.isActive) {
      return false;
    }

    const checkDate = new Date(date);

    if (menu.availableFrom && new Date(menu.availableFrom) > checkDate) {
      return false;
    }

    if (menu.availableTo && new Date(menu.availableTo) < checkDate) {
      return false;
    }

    return true;
  }

  /**
   * Calculer l'économie d'un menu par rapport à l'achat séparé
   */
  async calculateSavings(id: number): Promise<{
    menuPrice: number;
    totalProductsPrice: number;
    savings: number;
    savingsPercent: number;
  }> {
    const menu = await this.findOne(id);

    const totalProductsPrice = menu.allowedProducts.reduce(
      (sum, product) => sum + Number(product.basePrice),
      0,
    );

    const savings = totalProductsPrice - Number(menu.price);
    const savingsPercent = (savings / totalProductsPrice) * 100;

    return {
      menuPrice: Number(menu.price),
      totalProductsPrice,
      savings,
      savingsPercent: Math.round(savingsPercent * 100) / 100,
    };
  }

  /**
   * Récupérer les menus actifs et disponibles aujourd'hui.
   * Seuls les produits actifs sont inclus dans allowedProducts.
   */
  async getActiveMenus(): Promise<Menu[]> {
    const today = new Date().toISOString().split('T')[0];

    const menus = await this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.allowedProducts', 'allowedProducts')
      .where('menu.isActive = true')
      .andWhere(
        '(menu.availableFrom IS NULL OR menu.availableFrom <= :today)',
        { today },
      )
      .andWhere(
        '(menu.availableTo IS NULL OR menu.availableTo >= :today)',
        { today },
      )
      .orderBy('menu.name', 'ASC')
      .getMany();

    for (const menu of menus) {
      menu.allowedProducts = (menu.allowedProducts ?? []).filter(
        (p) => p.isActive,
      );
    }

    return menus;
  }
}
