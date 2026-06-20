import {
  Controller,
  Get,
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
import { UserService } from './user.service';

import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { User } from './entity/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UserRole } from './enums/user-role.enum';

@Controller('users')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Mon profil
   * GET /api/users/me
   */
  @Get('me')
  async getMyProfile(@CurrentUser() user: User): Promise<User> {
    return await this.userService.getMyProfile(user.id);
  }

  /**
   * Modifier mon profil
   * PUT /api/users/me/update
   */
  @Put('me/update')
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateMyProfileDto,
  ): Promise<User> {
    return await this.userService.updateMyProfile(user.id, updateUserDto);
  }

  /**
   * Changer mon mot de passe
   * PUT /api/users/me/change-password
   */
  @Put('me/change-password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return await this.userService.changePassword(user.id, changePasswordDto);
  }

  /**
   * Modifier un utilisateur (ADMIN)
   * PUT /api/users/:id/update
   */
  @Roles(UserRole.ADMIN)
  @Put(':id/update')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.updateUser(id, updateUserDto);
  }

  /**
   * Liste des utilisateurs (ADMIN)
   * GET /api/users/list
   */
  @Roles(UserRole.ADMIN)
  @Get('list')
  async findAll(@Query() queryDto: QueryUserDto): Promise<User[]> {
    return await this.userService.findAll(queryDto);
  }

  /**
   * Profil d'un utilisateur (ADMIN/EMPLOYEE)
   * GET /api/users/:id
   */
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.findOne(id);
  }

  /**
   * Activer/Désactiver un utilisateur (ADMIN)
   * PUT /api/users/:id/toggle-active
   */
  @Roles(UserRole.ADMIN)
  @Put(':id/toggle-active')
  async toggleActive(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.toggleActive(id);
  }

  /**
   * Supprimer un utilisateur (ADMIN)
   * DELETE /api/users/:id/delete
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.userService.remove(id);
  }
}
