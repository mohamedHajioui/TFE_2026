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
import { IngredientService } from './ingredient.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { QueryIngredientDto } from './dto/query-ingredient.dto';
import { Ingredient } from './entity/ingredient.entity';
import { StockMovement } from './entity/stock-movement.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';



@Controller('ingredients')
@UseGuards(RolesGuard)
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  /**
   * Liste tous les ingrédients
   * GET /api/ingredients/list
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('list')
  async findAll(@Query() queryDto: QueryIngredientDto): Promise<Ingredient[]> {
    return await this.ingredientService.findAll(queryDto);
  }

  /**
   * Ingrédients en stock faible
   * GET /api/ingredients/low-stock
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('low-stock')
  async findLowStock(): Promise<Ingredient[]> {
    return await this.ingredientService.findLowStock();
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('movements')
  async getMovements(
    @Query('ingredientId') ingredientId?: string,
    @Query('limit') limit?: string,
  ): Promise<StockMovement[]> {
    return await this.ingredientService.getMovements(
      ingredientId ? Number(ingredientId) : undefined,
      limit ? Number(limit) : 50,
    );
  }

  /**
   * Détail d'un ingrédient
   * GET /api/ingredients/:id
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Ingredient> {
    return await this.ingredientService.findOne(id);
  }

  /**
   * Créer un ingrédient
   * POST /api/ingredients/create
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post('create')
  async create(
    @Body() createIngredientDto: CreateIngredientDto,
  ): Promise<Ingredient> {
    return await this.ingredientService.create(createIngredientDto);
  }

  /**
   * Modifier un ingrédient
   * PUT /api/ingredients/:id/update
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ): Promise<Ingredient> {
    return await this.ingredientService.update(id, updateIngredientDto);
  }

  /**
   * Ajuster le stock
   * PUT /api/ingredients/:id/adjust-stock
   * Body: { "quantity": 10, "reason": "Réapprovisionnement" }
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/adjust-stock')
  async adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity: number; reason?: string },
  ): Promise<Ingredient> {
    return await this.ingredientService.adjustStock(id, body.quantity, body.reason);
  }

  /**
   * Supprimer un ingrédient
   * DELETE /api/ingredients/:id/delete
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.ingredientService.remove(id);
  }
}
