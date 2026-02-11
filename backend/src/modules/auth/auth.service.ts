import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entity/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload, JwtUtil } from '../../common/utils/jwt.util';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtUtil: JwtUtil,
  ) {}

  /**
   * Enregistre un nouvel utilisateur avec email, displayName, password, etc.
   * @param registerDto
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Vérifier si l'email existe déjà
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hacher le mot de passe
    const passwordHash = await CryptoUtil.hashPassword(registerDto.password);

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email: registerDto.email,
      displayName: registerDto.displayName,
      passwordHash,
      phoneNumber: registerDto.phoneNumber,
      // role: UserRole.CLIENT par défaut (défini dans l'entité)
      // isActive: true par défaut (défini dans l'entité)
    });

    // Sauvegarder en base de données
    const savedUser = await this.userRepository.save(user);

    // Générer les tokens JWT
    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };

    const tokens = this.jwtUtil.generateTokenPair(payload);

    // Retourner la réponse
    return {
      ...tokens,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        displayName: savedUser.displayName,
        role: savedUser.role,
      },
    };
  }

  /**
   * Authentifie un utilisateur avec son email et mot de passe
   * @param loginDto
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Trouver l'utilisateur par email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Votre compte est désactivé. Contactez un administrateur.',
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await CryptoUtil.comparePasswords(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer les tokens JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = this.jwtUtil.generateTokenPair(payload);

    // Retourner la réponse
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  /**
   * Génère un nouveau access token à partir d'un refresh token valide
   * @param refreshToken
   */

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Vérifier et décoder le refresh token
      const payload = this.jwtUtil.verifyRefreshToken(refreshToken);

      // Récupérer l'user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Utilisateur introuvable ou inactif');
      }

      // Générer un nouveau access token
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const tokens = this.jwtUtil.generateTokenPair(newPayload);

      // Retourner la réponse
      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  /**
   * Valide le payload du JWT et retourne l'utilisateur correspondant
   * @param payload
   */
  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }
}
