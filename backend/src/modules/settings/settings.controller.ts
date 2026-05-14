import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './entity/setting.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('settings')
@UseGuards(RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Settings exposés publiquement (lus par le frontend client).
   * GET /api/settings/public
   */
  @Public()
  @Get('public')
  async findPublic(): Promise<Record<string, string>> {
    return await this.settingsService.findPublic();
  }

  /**
   * Liste tous les settings (ADMIN).
   * GET /api/settings/list
   */
  @Roles(UserRole.ADMIN)
  @Get('list')
  async findAll(): Promise<Setting[]> {
    return await this.settingsService.findAll();
  }

  /**
   * Détail d'un setting par clé (ADMIN).
   * GET /api/settings/:key
   */
  @Roles(UserRole.ADMIN)
  @Get(':key')
  async findByKey(@Param('key') key: string): Promise<Setting> {
    return await this.settingsService.findByKey(key);
  }

  /**
   * Mettre à jour un setting (ADMIN).
   * PUT /api/settings/:key
   */
  @Roles(UserRole.ADMIN)
  @Put(':key')
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ): Promise<Setting> {
    return await this.settingsService.update(key, dto);
  }
}
