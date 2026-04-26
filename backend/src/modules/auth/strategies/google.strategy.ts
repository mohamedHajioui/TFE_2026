import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Stratégie Google OAuth2 pour Passport.
 *
 * Flow :
 *  1. GET /auth/google         → redirige vers la page de consentement Google
 *  2. Google redirige vers     → GET /auth/google/callback?code=...
 *  3. Cette stratégie échange le code contre un token et appelle validate()
 *  4. validate() crée ou connecte l'utilisateur via AuthService
 *  5. Le controller reçoit l'user et pose les cookies JWT
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  /**
   * Appelé par Passport après validation du token Google.
   * On reçoit le profil Google et on crée/connecte l'utilisateur.
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string }[];
      displayName?: string;
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Aucun email retourné par Google'), undefined);
    }

    const displayName = profile.displayName ?? email.split('@')[0];
    const googleId = profile.id;

    try {
      const user = await this.authService.findOrCreateGoogleUser({
        email,
        displayName,
        googleId,
      });
      done(null, user);
    } catch (err) {
      done(err instanceof Error ? err : new Error(String(err)), undefined);
    }
  }
}
