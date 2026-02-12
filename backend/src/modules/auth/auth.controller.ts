import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import express from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint pour l'inscription (register)
   * @param registerDto
   * @param response
   */
  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.register(registerDto);

    //Stocker les tokens dans des cookies HttpOnly
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return {
      user: result.user,
    };
  }

  /**
   * Endpoint pour l'authentification (login)
   * @param loginDto
   * @param response
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: express.Response) {
    const result = await this.authService.login(loginDto);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      user: result.user,
    };
  }

  /**
   * Endpoint pour rafraîchir le token d'accès à l'aide du refresh token
   * @param request
   * @param response
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    // Lire le refresh token depuis le cookie
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }
    const result = await this.authService.refreshToken(refreshToken);

    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return {
      user: result.user,
    };
  }

  /**
   * Endpoint pour la déconnexion (logout)
   * @param response
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: express.Response) {
    // Supprimer les cookies d'authentification
    this.clearAuthCookies(response);
    return {
      message: 'Déconnexion réussie',
    };
  }

  /**
   * Stocke les tokens d'authentification dans des cookies HttpOnly pour une meilleure sécurité
   * @param response
   * @param accessToken
   * @param refreshToken
   * @private
   */
  private setAuthCookies(
    response: express.Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    // Access Token
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Sécurisé en production
      sameSite: 'strict', // Protection CSRF
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Refresh Token
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Sécurisé en production
      sameSite: 'strict', // Protection CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
    });
  }

  /**
   * Supprime les cookies d'authentification (logout)
   * @param response
   * @private
   */
  private clearAuthCookies(response: express.Response): void {
    response.clearCookie('accessToken', { path: '/' });
    response.clearCookie('refreshToken', { path: '/' });
  }
}
