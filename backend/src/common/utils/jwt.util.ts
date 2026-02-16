import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Payload contenu dans le JWT
 */
export interface JwtPayload {
  sub: number; // User ID (convention JWT : "sub" = subject)
  email: string;
  role: string;
}

/**
 * Paire de tokens (access + refresh)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Utilitaire pour la gestion des JWT (JSON Web Tokens)
 * Gère la création, vérification et décodage des tokens
 */
@Injectable()
export class JwtUtil {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Génère un access token (courte durée - 15min par défaut)
   * Utilisé pour les requêtes API normales
   *
   * @param payload - Données à encoder dans le token
   * @returns string - Access token JWT
   *
   * @example
   * const token = jwtUtil.generateAccessToken({
   *   sub: 1,
   *   email: 'user@example.com',
   *   role: 'CLIENT'
   * });
   */
  generateAccessToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    // 15 minutes en secondes
    const expiresIn = this.configService.get<number>('JWT_EXPIRATION_SECONDS') || '15m';

    return this.jwtService.sign({ ...payload }, { secret, expiresIn });
  }

  /**
   * Génère un refresh token (longue durée - 7 jours par défaut)
   * Utilisé pour obtenir un nouveau access token sans re-login
   *
   * @param payload - Données à encoder dans le token
   * @returns string - Refresh token JWT
   *
   * @example
   * const refreshToken = jwtUtil.generateRefreshToken({
   *   sub: 1,
   *   email: 'user@example.com',
   *   role: 'CLIENT'
   * });
   */
  generateRefreshToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    // 7 jours en secondes (7 * 24 * 60 * 60 = 604800)
    const expiresIn = this.configService.get<number>('JWT_REFRESH_EXPIRATION_SECONDS') || '7d';

    return this.jwtService.sign({ ...payload }, { secret, expiresIn });
  }

  /**
   * Génère une paire de tokens (access + refresh) en une seule opération
   * C'est la méthode principale à utiliser lors du login/register
   *
   * @param payload - Données à encoder dans les tokens
   * @returns TokenPair - Objet contenant accessToken et refreshToken
   *
   * @example
   * const tokens = jwtUtil.generateTokenPair({
   *   sub: 1,
   *   email: 'user@example.com',
   *   role: 'CLIENT'
   * });
   * // Résultat: { accessToken: "eyJ...", refreshToken: "eyJ..." }
   */
  generateTokenPair(payload: JwtPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Vérifie et décode un access token
   * Lance une exception si le token est invalide ou expiré
   *
   * @param token - Access token à vérifier
   * @returns JwtPayload - Payload décodé
   * @throws UnauthorizedException si le token est invalide
   *
   * @example
   * try {
   *   const payload = jwtUtil.verifyAccessToken(token);
   *   console.log(payload.sub); // User ID
   * } catch (error) {
   *   console.log('Token invalide');
   * }
   */
  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Vérifie et décode un refresh token
   * Lance une exception si le token est invalide ou expiré
   *
   * @param token - Refresh token à vérifier
   * @returns JwtPayload - Payload décodé
   * @throws UnauthorizedException si le token est invalide
   *
   * @example
   * try {
   *   const payload = jwtUtil.verifyRefreshToken(refreshToken);
   *   // Générer un nouveau access token
   * } catch (error) {
   *   console.log('Refresh token invalide - Reconnexion requise');
   * }
   */
  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  /**
   * Décode un token SANS le vérifier
   * N'utilisez ceci QUE pour le debug ou affichage
   * Ne pas utiliser pour la sécurité !
   *
   * @param token - Token à décoder
   * @returns any - Payload décodé (ou null si invalide)
   *
   * @example
   * const payload = jwtUtil.decodeToken(token);
   * console.log('User ID:', payload?.sub);
   * console.log('Expire à:', new Date(payload?.exp * 1000));
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  /**
   * Extrait le token du header Authorization
   * Format attendu: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
   *
   * @param authHeader - Header Authorization complet
   * @returns string | null - Token extrait ou null
   *
   * @example
   * const token = jwtUtil.extractTokenFromHeader(
   *   'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
   * );
   * // Résultat: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  /**
   * Vérifie si un token est expiré (sans lancer d'exception)
   *
   * @param token - Token à vérifier
   * @returns boolean - true si expiré
   *
   * @example
   * if (jwtUtil.isTokenExpired(token)) {
   *   console.log('Token expiré, demander un refresh');
   * }
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Obtient le temps restant avant expiration (en secondes)
   *
   * @param token - Token à analyser
   * @returns number - Secondes restantes (0 si expiré)
   *
   * @example
   * const remaining = jwtUtil.getTimeUntilExpiration(token);
   * console.log(`Token expire dans ${remaining} secondes`);
   */
  getTimeUntilExpiration(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const remaining = decoded.exp - currentTime;

      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }
}
