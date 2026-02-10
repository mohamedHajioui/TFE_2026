import * as bcrypt from 'bcrypt';

/**
 * Utilitaire pour le hachage et la vérification des mots de passe
 */
export class CryptoUtil {
  /**
   * Nombre de tours de hachage (10 = bon compromis sécurité/performance)
   * Plus le nombre est élevé, plus c'est sécurisé mais lent
   */
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hache un mot de passe en clair
   * @param plainPassword - Mot de passe en clair
   * @returns Promise<string> - Mot de passe haché
   *
   * @example
   * const hash = await CryptoUtil.hashPassword('Password123!');
   * // Résultat: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."
   */
  static async hashPassword(plainPassword: string): Promise<string> {
    return await bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  /**
   * Compare un mot de passe en clair avec un hash
   * @param plainPassword - Mot de passe en clair (saisi par l'utilisateur)
   * @param hashedPassword - Mot de passe haché (stocké en DB)
   * @returns Promise<boolean> - true si le mot de passe correspond
   *
   * @example
   * const isValid = await CryptoUtil.comparePasswords(
   *   'Password123!',
   *   '$2b$10$N9qo8uLOickgx2ZMRZoMye...'
   * );
   * // Résultat: true ou false
   */
  static async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Génère un token aléatoire sécurisé
   * Utile pour : reset password, email verification, etc.
   * @param length - Longueur du token (défaut: 32)
   * @returns string - Token aléatoire
   *
   * @example
   * const token = CryptoUtil.generateRandomToken(64);
   * // Résultat: "a7f3k9m2p5q8r1s4t6u9v2w5x8y1z4a7b0c3d6e9f2g5h8j1"
   */
  static generateRandomToken(length: number = 32): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  /**
   * Génère un code numérique aléatoire (pour OTP, code de vérification, etc.)
   * @param length - Longueur du code (défaut: 6)
   * @returns string - Code numérique
   *
   * @example
   * const code = CryptoUtil.generateNumericCode(4);
   * // Résultat: "1234"
   */
  static generateNumericCode(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }
}
