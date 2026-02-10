import { SetMetadata } from '@nestjs/common';

/**
 * Clé de métadonnée pour identifier les routes publiques
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator pour marquer une route comme publique (pas besoin d'authentification)
 *
 * Utilisez ce decorator sur les endpoints qui ne nécessitent pas de JWT
 * Par défaut, toutes les routes sont protégées par JwtAuthGuard
 *
 * @example
 * // Sur un endpoint unique
 * @Public()
 * @Get('products')
 * findAll() {
 *   return this.productsService.findAll();
 * }
 *
 * @example
 * // Sur tout un controller
 * @Public()
 * @Controller('auth')
 * export class AuthController {
 *   // Tous les endpoints sont publics
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
