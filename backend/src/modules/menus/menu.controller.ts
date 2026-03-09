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
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { Menu } from './entity/menu.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';


/**
 * Controller gérant les endpoints des menus
 */
@Controller('menus')
@UseGuards(RolesGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * Liste tous les menus
   * GET /api/menus/list
   */
  @Public()
  @Get('list')
  async findAll(@Query() queryDto: QueryMenuDto): Promise<Menu[]> {
    return await this.menuService.findAll(queryDto);
  }

  /**
   * Menus actifs disponibles aujourd'hui
   * GET /api/menus/active
   */
  @Public()
  @Get('active')
  async getActiveMenus(): Promise<Menu[]> {
    return await this.menuService.getActiveMenus();
  }

  /**
   * Calculer l'économie d'un menu
   * GET /api/menus/:id/savings
   */
  @Public()
  @Get(':id/savings')
  async calculateSavings(@Param('id', ParseIntPipe) id: number) {
    return await this.menuService.calculateSavings(id);
  }

  /**
   * Vérifier disponibilité à une date
   * GET /api/menus/:id/available/:date
   */
  @Public()
  @Get(':id/available/:date')
  async checkAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Param('date') date: string,
  ): Promise<{ available: boolean }> {
    const available = await this.menuService.isAvailableOnDate(id, date);
    return { available };
  }

  /**
   * Détail d'un menu
   * GET /api/menus/:id
   */
  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Menu> {
    return await this.menuService.findOne(id);
  }

  /**
   * Créer un menu
   * POST /api/menus/create
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Post('create')
  async create(@Body() createMenuDto: CreateMenuDto): Promise<Menu> {
    return await this.menuService.create(createMenuDto);
  }

  /**
   * Modifier un menu
   * PUT /api/menus/:id/update
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuDto: UpdateMenuDto,
  ): Promise<Menu> {
    return await this.menuService.update(id, updateMenuDto);
  }

  /**
   * Activer/Désactiver un menu
   * PUT /api/menus/:id/toggle
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Put(':id/toggle')
  async toggleActive(@Param('id', ParseIntPipe) id: number): Promise<Menu> {
    return await this.menuService.toggleActive(id);
  }

  /**
   * Supprimer un menu
   * DELETE /api/menus/:id/delete
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.menuService.remove(id);
  }
}
