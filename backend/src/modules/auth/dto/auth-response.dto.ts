import { UserRole } from '../../users/enums/user-role.enum';

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
