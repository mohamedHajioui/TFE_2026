import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entity/address.entity';
import { User } from '../users/entity/user.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

/**
 * Service gérant la logique métier des adresses
 */
@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Récupérer toutes les adresses d'un utilisateur
   */
  async findMyAddresses(userId: number): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Récupérer une adresse par ID
   */
  async findOne(id: number, userId: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!address) {
      throw new NotFoundException(`Adresse avec l'ID ${id} introuvable`);
    }

    // Vérifier que l'adresse appartient bien à l'utilisateur
    if (address.user.id !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette adresse");
    }

    return address;
  }

  /**
   * Créer une nouvelle adresse
   */
  async create(
    userId: number,
    createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Vérifier si c'est la première adresse
    const existingAddresses = await this.addressRepository.count({
      where: { user: { id: userId } },
    });

    // Créer l'adresse
    const address = this.addressRepository.create({
      ...createAddressDto,
      user,
      country: createAddressDto.country || 'Belgium',
      isDefault: existingAddresses === 0, // Première adresse = défaut
    });

    return await this.addressRepository.save(address);
  }

  /**
   * Mettre à jour une adresse
   */
  async update(
    id: number,
    userId: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);

    Object.assign(address, updateAddressDto);

    return await this.addressRepository.save(address);
  }

  /**
   * Définir une adresse comme adresse par défaut
   */
  async setAsDefault(id: number, userId: number): Promise<Address> {
    const address = await this.findOne(id, userId);

    // Retirer le défaut des autres adresses
    await this.addressRepository.update(
      { user: { id: userId }, isDefault: true },
      { isDefault: false },
    );

    // Définir cette adresse comme défaut
    address.isDefault = true;

    return await this.addressRepository.save(address);
  }

  /**
   * Supprimer une adresse
   */
  async remove(id: number, userId: number): Promise<void> {
    const address = await this.findOne(id, userId);

    // Vérifier si c'est l'adresse par défaut
    if (address.isDefault) {
      const otherAddresses = await this.addressRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: 'ASC' },
      });

      // Si c'est la seule adresse, autoriser la suppression
      if (otherAddresses.length > 1) {
        throw new BadRequestException(
          "Impossible de supprimer l'adresse par défaut. Définissez d'abord une autre adresse comme défaut.",
        );
      }
    }

    await this.addressRepository.remove(address);
  }

  /**
   * Récupérer l'adresse par défaut d'un utilisateur
   */
  async getDefaultAddress(userId: number): Promise<Address | null> {
    return await this.addressRepository.findOne({
      where: { user: { id: userId }, isDefault: true },
    });
  }

  /**
   * Vérifier qu'un utilisateur a au moins une adresse (pour livraison)
   */
  async hasAddresses(userId: number): Promise<boolean> {
    const count = await this.addressRepository.count({
      where: { user: { id: userId } },
    });

    return count > 0;
  }
}
