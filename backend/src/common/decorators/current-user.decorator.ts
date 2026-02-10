import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/entity/user.entity';

/**
 * Decorator pour injecter l'utilisateur actuellement connecté dans un endpoint
 *
 * L'utilisateur est extrait de la requête après validation du JWT
 * par le JwtAuthGuard et la JwtStrategy
 *
 * @returns User - L'entité User complète de l'utilisateur connecté
 *
 * @example
 * // Récupérer l'utilisateur complet
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return {
 *     id: user.id,
 *     email: user.email,
 *     displayName: user.displayName,
 *     role: user.role
 *   };
 * }
 *
 * @example
 * // Utiliser pour les commandes
 * @Post('orders')
 * createOrder(
 *   @CurrentUser() user: User,
 *   @Body() createOrderDto: CreateOrderDto
 * ) {
 *   return this.ordersService.create(user.id, createOrderDto);
 * }
 *
 * @example
 * // Extraire seulement une propriété spécifique
 * @Get('my-favorites')
 * getMyFavorites(@CurrentUser('id') userId: number) {
 *   return this.favoritesService.findByUserId(userId);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si une propriété spécifique est demandée, retourner seulement celle-ci
    // Exemple: @CurrentUser('id') → retourne juste user.id
    if (data) {
      return user?.[data];
    }

    // Sinon, retourner l'utilisateur complet
    return user;
  },
);
