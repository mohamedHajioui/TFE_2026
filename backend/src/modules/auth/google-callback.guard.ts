import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard utilisé UNIQUEMENT sur la route /auth/google/callback.
 * Contrairement à AuthGuard('google') par défaut, celui-ci ne lève pas
 * d'exception quand Passport échoue (callback URL incorrecte, réseau, etc.).
 * Il retourne null → req.user sera undefined → le contrôleur gère la redirection.
 */
@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  handleRequest<TUser = unknown>(
    _err: Error | null,
    user: TUser | false,
  ): TUser {
    if (!user) {
      return null as unknown as TUser;
    }
    return user;
  }

  // canActivate ne doit jamais lever d'exception vers NestJS
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Erreur Passport absorbée — le contrôleur se charge de la redirection
    }
    return true;
  }
}
