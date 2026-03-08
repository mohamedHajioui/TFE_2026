import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entity/address.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entity/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

/**
 * Controller gérant les endpoints des adresses
 */
@Controller('addresses')
@UseGuards(RolesGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * Mes adresses
   * GET /api/addresses/my-addresses
   */
  @Get('my-addresses')
  async getMyAddresses(@CurrentUser() user: User): Promise<Address[]> {
    return await this.addressService.findMyAddresses(user.id);
  }

  /**
   * Mon adresse par défaut
   * GET /api/addresses/default
   */
  @Get('default')
  async getDefaultAddress(
    @CurrentUser() user: User,
  ): Promise<Address | { message: string }> {
    const address = await this.addressService.getDefaultAddress(user.id);

    if (!address) {
      return { message: 'Aucune adresse par défaut définie' };
    }

    return address;
  }

  /**
   * Détail d'une adresse
   * GET /api/addresses/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Address> {
    return await this.addressService.findOne(id, user.id);
  }

  /**
   * Créer une adresse
   * POST /api/addresses/create
   */
  @Post('create')
  async create(
    @CurrentUser() user: User,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    return await this.addressService.create(user.id, createAddressDto);
  }

  /**
   * Modifier une adresse
   * PUT /api/addresses/:id/update
   */
  @Put(':id/update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    return await this.addressService.update(id, user.id, updateAddressDto);
  }

  /**
   * Définir comme adresse par défaut
   * PUT /api/addresses/:id/set-default
   */
  @Put(':id/set-default')
  async setAsDefault(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Address> {
    return await this.addressService.setAsDefault(id, user.id);
  }

  /**
   * Supprimer une adresse
   * DELETE /api/addresses/:id/delete
   */
  @Delete(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return await this.addressService.remove(id, user.id);
  }
}
