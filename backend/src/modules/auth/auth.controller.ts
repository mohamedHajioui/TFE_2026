import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entity/user.entity';
import { GoogleCallbackGuard } from './google-callback.guard';
import express from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  /* Register */

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.register(registerDto);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  /* Login */

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  /* Google OAuth */

  /**
   * Étape 1 : redirige vers la page de consentement Google.
   * Le navigateur est redirigé vers accounts.google.com.
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport gère la redirection, cette méthode ne s'exécute pas
  }

  /**
   * Étape 2 : Google redirige ici après consentement.
   * Passport valide le code, appelle GoogleStrategy.validate(),
   * qui appelle authService.findOrCreateGoogleUser().
   * On pose les cookies JWT et on redirige vers le frontend.
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  async googleCallback(
    @Req() req: express.Request & { user?: User },
    @Res() res: express.Response,
  ) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=google_failed`);
    }

    try {
      const result = this.authService['buildAuthResponse'](req.user);
      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      // Redirection vers le frontend après connexion Google réussie
      return res.redirect(`${frontendUrl}/`);
    } catch {
      return res.redirect(`${frontendUrl}/login?error=google_failed`);
    }
  }

  /* Refresh */

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const refreshToken = request.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const result = await this.authService.refreshToken(refreshToken);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  /* Logout */

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: express.Response) {
    this.clearAuthCookies(response);
    return { message: 'Déconnexion réussie' };
  }

  /* Helpers cookies */

  private setAuthCookies(
    response: express.Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearAuthCookies(response: express.Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
    };
    response.clearCookie('accessToken', cookieOptions);
    response.clearCookie('refreshToken', cookieOptions);
  }
}
