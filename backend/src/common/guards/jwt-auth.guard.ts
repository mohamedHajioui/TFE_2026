import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global pour protéger toutes les routes avec JWT
 *
 * Ce guard vérifie automatiquement la présence et validité d'un token JWT
 * sur TOUTES les routes, sauf celles marquées avec @Public()
 *
 * Flow:
 * 1. Vérifier si la route est publique (@Public())
 * 2. Si oui → Autoriser sans vérification
 * 3. Si non → Vérifier le JWT via Passport (JwtStrategy)
 * 4. Si JWT valide → Injecter l'utilisateur dans request.user
 * 5. Si JWT invalide → Lancer UnauthorizedException
 *
 * @example
 * // Dans app.module.ts (déjà fait normalement)
 * providers: [
 *   {
 *     provide: APP_GUARD,
 *     useClass: JwtAuthGuard,
 *   },
 * ]
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Détermine si la requête peut passer ou non
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Vérifier si la route est marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Decorator sur la méthode
      context.getClass(), // Decorator sur le controller
    ]);

    // Si publique, autoriser sans vérification du JWT
    if (isPublic) {
      return true;
    }

    // Sinon, vérifier le JWT via Passport
    return super.canActivate(context);
  }

  /**
   * Gère les erreurs d'authentification
   * Personnalise le message d'erreur
   */
  handleRequest(err: any, user: any, info: any) {
    // Si erreur ou pas d'utilisateur, lancer une exception
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(info?.message || 'Token invalide ou manquant')
      );
    }

    // Retourner l'utilisateur qui sera injecté dans request.user
    return user;
  }
}
