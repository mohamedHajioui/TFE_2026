import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entity/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload, JwtUtil } from '../../common/utils/jwt.util';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

export interface GoogleUserData {
  email: string;
  displayName: string;
  googleId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtUtil: JwtUtil,
  ) {}

  /* Register */

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const passwordHash = await CryptoUtil.hashPassword(registerDto.password);

    const user = this.userRepository.create({
      email: registerDto.email,
      displayName: registerDto.displayName,
      passwordHash,
      phoneNumber: registerDto.phoneNumber,
    });

    const savedUser = await this.userRepository.save(user);
    return this.buildAuthResponse(savedUser);
  }

  /* Login */

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Votre compte est désactivé. Contactez un administrateur.',
      );
    }

    // Compte Google sans mot de passe
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Ce compte utilise la connexion Google. Cliquez sur "Continuer avec Google".',
      );
    }

    const isPasswordValid = await CryptoUtil.comparePasswords(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.buildAuthResponse(user);
  }

  /* Google OAuth */

  /**
   * Trouve ou crée un utilisateur depuis les données Google OAuth.
   *
   * Logique :
   *  1. Si un user avec ce googleId existe → connexion directe
   *  2. Sinon si un user avec cet email existe → on lie le googleId au compte
   *  3. Sinon → on crée un nouveau compte (sans mot de passe)
   */
  async findOrCreateGoogleUser(data: GoogleUserData): Promise<User> {
    // 1. Chercher par googleId
    let user = await this.userRepository.findOne({
      where: { googleId: data.googleId },
    });
    if (user) {
      if (!user.isActive) throw new UnauthorizedException('Compte désactivé');
      return user;
    }

    // 2. Chercher par email (lier le googleId au compte existant)
    user = await this.userRepository.findOne({
      where: { email: data.email },
    });
    if (user) {
      if (!user.isActive) throw new UnauthorizedException('Compte désactivé');
      user.googleId = data.googleId;
      return await this.userRepository.save(user);
    }

    // 3. Créer un nouveau compte Google (pas de mot de passe)
    const newUser = this.userRepository.create({
      email: data.email,
      displayName: data.displayName,
      googleId: data.googleId,
      passwordHash: null,
      isActive: true,
    });

    return await this.userRepository.save(newUser);
  }

  /* Refresh */

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtUtil.verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Utilisateur introuvable ou inactif');
      }

      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  /* Validate (JWT Guard) */

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) return null;
    return user;
  }

  /* Helper */

  private buildAuthResponse(user: User): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = this.jwtUtil.generateTokenPair(payload);

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
}
