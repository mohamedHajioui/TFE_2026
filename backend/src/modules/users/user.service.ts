import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';

import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Récupérer tous les utilisateurs (ADMIN)
   */
  async findAll(queryDto: QueryUserDto): Promise<User[]> {
    const { role, isActive, search } = queryDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.displayName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['addresses', 'orders'],
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    return user;
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getMyProfile(userId: number): Promise<User> {
    return await this.findOne(userId);
  }

  /**
   * Modifier le profil de l'utilisateur connecté
   */
  async updateMyProfile(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findOne(userId);

    // Vérifier si le nouveau displayName existe déjà
    if (
      updateUserDto.displayName &&
      updateUserDto.displayName !== user.displayName
    ) {
      const existing = await this.userRepository.findOne({
        where: { displayName: updateUserDto.displayName },
      });

      if (existing) {
        throw new ConflictException(
          `Le nom "${updateUserDto.displayName}" est déjà utilisé`,
        );
      }
    }

    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Vérifier le mot de passe actuel
    const isValid = await CryptoUtil.comparePasswords(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSame = await CryptoUtil.comparePasswords(
      changePasswordDto.newPassword,
      user.passwordHash,
    );

    if (isSame) {
      throw new BadRequestException(
        "Le nouveau mot de passe doit être différent de l'ancien",
      );
    }

    // Hacher et sauvegarder
    user.passwordHash = await CryptoUtil.hashPassword(
      changePasswordDto.newPassword,
    );

    await this.userRepository.save(user);

    return { message: 'Mot de passe modifié avec succès' };
  }

  /**
   * Activer/désactiver un utilisateur (ADMIN)
   */
  async toggleActive(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    return await this.userRepository.save(user);
  }

  /**
   * Supprimer un utilisateur (ADMIN)
   */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    // Vérifier s'il a des commandes
    if (user.orders && user.orders.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${user.orders.length} commande(s) associée(s)`,
      );
    }

    await this.userRepository.remove(user);
  }
}
