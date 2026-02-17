import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './entity/product.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/entity/user.entity';

/**
 * Controller gérant les endpoints des produits
 */
@Controller('products')
@UseGuards(RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ============================================
  // ROUTES PUBLIQUES (GET - Lecture)
  // ============================================

  /**
   * Liste tous les produits avec filtres optionnels
   * GET /api/products/list?category=SANDWICH&isActive=true
   */
  @Public()
  @Get('list')
  async findAll(@Query() queryDto: QueryProductDto): Promise<Product[]> {
    return await this.productService.findAll(queryDto);
  }

  /**
   * Recherche par catégorie
   * GET /api/products/category/SANDWICH
   */
  @Public()
  @Get('category/:category')
  async findByCategory(
    @Param('category') category: string,
  ): Promise<Product[]> {
    return await this.productService.findByCategory(category);
  }

  /**
   * Vérifier la disponibilité d'un produit
   * GET /api/products/1/check-availability
   */
  @Public()
  @Get(':id/check-availability')
  async checkAvailability(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ available: boolean; productName: string }> {
    const product = await this.productService.findOne(id);
    const available = await this.productService.isProductAvailable(id);
    return {
      available,
      productName: product.name,
    };
  }

  /**
   * Récupérer un produit par ID
   * GET /api/products/1
   */
  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return await this.productService.findOne(id);
  }

  // ============================================
  // ROUTES PROTÉGÉES (POST/PUT/DELETE - Écriture)
  // ============================================

  /**
   * Créer un nouveau produit
   * POST /api/products/create
   *
   * Body exemple:
   * {
   *   "name": "Sandwich Américain",
   *   "category": "SANDWICH",
   *   "basePrice": 6.50
   * }
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post('create')
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return await this.productService.create(createProductDto);
  }

  /**
   * Activer/Désactiver un produit
   * PUT /api/products/1/toggle
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/toggle')
  async toggleActive(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return await this.productService.toggleActive(id);
  }

  /**
   * Mettre à jour un produit
   * PUT /api/products/1/update
   *
   * Body exemple:
   * {
   *   "basePrice": 7.00,
   *   "description": "Nouvelle description"
   * }
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return await this.productService.update(id, updateProductDto);
  }

  /**
   * Supprimer un produit
   * DELETE /api/products/1/delete
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.productService.remove(id);
  }
}
