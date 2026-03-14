import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/enums/user-role.enum';


/**
 * Guard pour vérifier que l'utilisateur connecté a le bon rôle
 *
 * Ce guard doit être utilisé APRÈS JwtAuthGuard (qui injecte request.user)
 * Il vérifie si user.role correspond à l'un des rôles requis définis via @Roles()
 *
 * IMPORTANT: Toujours utiliser avec @UseGuards(RolesGuard) sur le controller/endpoint
 *
 * @example
 * // Sur un controller entier
 * @Controller('admin')
 * @UseGuards(RolesGuard)
 * export class AdminController {
 *   @Roles(UserRole.ADMIN)
 *   @Get('dashboard')
 *   getDashboard() {
 *     // Seulement les ADMIN peuvent accéder
 *   }
 * }
 *
 * @example
 * // Sur un endpoint spécifique
 * @UseGuards(RolesGuard)
 * @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
 * @Post('products')
 * createProduct(@Body() dto: CreateProductDto) {
 *   // ADMIN ou EMPLOYEE peuvent créer
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupérer les rôles requis définis via @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Decorator sur la méthode
      context.getClass(), // Decorator sur le controller
    ]);

    // Si aucun rôle requis, autoriser
    // (endpoint accessible à tout utilisateur authentifié)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Récupérer l'utilisateur depuis la requête
    // (injecté par JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Vérifier si le rôle de l'utilisateur correspond à l'un des rôles requis
    return requiredRoles.some((role) => user.role === role);
  }
}
