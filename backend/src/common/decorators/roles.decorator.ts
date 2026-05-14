import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/enums/user-role.enum';

/**
 * Clé de métadonnée pour stocker les rôles requis
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator pour spécifier les rôles autorisés sur un endpoint
 *
 * Fonctionne avec RolesGuard pour vérifier que l'utilisateur connecté
 * a l'un des rôles requis
 *
 * @param roles - Liste des rôles autorisés (au moins un doit correspondre)
 *
 * @example
 * // Seulement les admins
 * @Roles(UserRole.ADMIN)
 * @Delete(':id')
 * deleteProduct(@Param('id') id: number) {
 *   return this.productsService.delete(id);
 * }
 *
 * @example
 * // Admins OU Employés
 * @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
 * @Post()
 * createProduct(@Body() dto: CreateProductDto) {
 *   return this.productsService.create(dto);
 * }
 *
 * @example
 * // Tout utilisateur authentifié (CLIENT, EMPLOYEE, ADMIN)
 * @Roles(UserRole.CLIENT, UserRole.EMPLOYEE, UserRole.ADMIN)
 * @Get('my-orders')
 * getMyOrders(@CurrentUser() user: User) {
 *   return this.ordersService.findByUser(user.id);
 * }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
