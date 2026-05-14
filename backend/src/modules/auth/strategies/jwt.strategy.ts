import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entity/user.entity';
import { JwtPayload } from '../../../common/utils/jwt.util';
import express, { Request } from 'express';

/**
 * Stratégie JWT pour Passport
 *
 * Cette stratégie est automatiquement appelée par JwtAuthGuard
 * Elle valide le JWT et charge l'utilisateur depuis la DB
 *
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      // Extraire le JWT depuis le cookie 'accessToken'
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: express.Request) => {
          return request?.cookies?.accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
    });
  }

  /**
   * Méthode appelée automatiquement après validation du JWT
   */
  async validate(payload: JwtPayload): Promise<User> {
    // Charger l'utilisateur depuis la DB
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    // Vérifier que l'utilisateur existe
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier que le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    // Retourner l'utilisateur (sera injecté dans request.user)
    return user;
  }
}
