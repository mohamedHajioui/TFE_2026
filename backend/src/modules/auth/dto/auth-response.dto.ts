import { UserRole } from '../../users/entity/user.entity';

/**
 * DTO pour la réponse d'authentification
 * Retourné après login, register, ou refresh
 */
export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;

  user: {
    id: number;
    email: string;
    displayName: string;
    role: UserRole;
  };
}
