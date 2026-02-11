import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entity/user.entity';
import { JwtUtil } from '../../common/utils/jwt.util';

/**
 * Module d'authentification
 *
 * Gère:
 * - Inscription / Connexion
 * - Génération et validation des JWT
 * - Protection des routes via guards
 */
@Module({
  imports: [
    // Importer l'entité User pour pouvoir l'utiliser dans le service
    TypeOrmModule.forFeature([User]),

    // Configuration de Passport (stratégie JWT par défaut)
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configuration du module JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return {
          secret,
          signOptions: {
            expiresIn: '15m' as const,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtUtil,
  ],
  exports: [
    AuthService,
    JwtUtil,
  ],
})
export class AuthModule {}
