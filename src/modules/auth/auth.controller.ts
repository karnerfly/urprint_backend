import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, UTokenResponse } from 'src/models/dto/auth.dto';
import type {
  CsrfResponse,
  JWTPayload,
  LogoutResponse,
} from 'src/models/dto/auth.dto';
import type { Request, Response } from 'express';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { TokenData } from 'src/common/decorators/token.decorator';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import { CsrfGuard } from 'src/common/guards/auth/csrf.guard';
import { getRandomBase64Url } from 'src/common/utils/random';
import { Throttle } from '@nestjs/throttler';
import NAMES from 'src/constants/name';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly authService: AuthService,
  ) {}

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UTokenResponse> {
    const resp = await this.authService.login(dto);

    res.cookie(NAMES.COOKIE.AUTH_SESSION, resp.tokens.refreshToken, {
      domain: this.config.GetWildCardDomain(),
      maxAge: resp.tokens.refreshTokenMaxAge * 1000,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }

  @Get('csrf')
  getCsrfToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): CsrfResponse {
    let csrfToken = req.cookies[NAMES.COOKIE.CSRF_TOKEN] as string;

    if (!csrfToken) {
      csrfToken = getRandomBase64Url(32);
      res.cookie(NAMES.COOKIE.CSRF_TOKEN, csrfToken, {
        domain: this.config.GetWildCardDomain(),
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24,
      });
    }

    return {
      cookieName: NAMES.COOKIE.CSRF_TOKEN,
      headerName: NAMES.HEADER.CSRF_TOKEN,
      value: csrfToken,
    };
  }

  @HttpCode(200)
  @Post('refresh/tokens')
  @Throttle({
    default: {
      ttl: 60000,
      limit: 30,
    },
  })
  @ApiSecurity('csrf')
  @UseGuards(CsrfGuard)
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UTokenResponse> {
    const refreshTokenCookie = req.cookies[NAMES.COOKIE.AUTH_SESSION] as string;

    if (!refreshTokenCookie) {
      throw new ForbiddenException('Invalid request');
    }

    const resp = await this.authService.refreshTokens(refreshTokenCookie);

    res.cookie(NAMES.COOKIE.AUTH_SESSION, resp.tokens.refreshToken, {
      domain: this.config.GetWildCardDomain(),
      maxAge: resp.tokens.refreshTokenMaxAge * 1000,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }

  @HttpCode(200)
  @Post('logout')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async logout(
    @TokenData() tokenData: JWTPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponse> {
    await this.authService.logout(tokenData.ownerId);

    res.cookie(NAMES.COOKIE.AUTH_SESSION, '', {
      domain: this.config.GetWildCardDomain(),
      path: '/',
      maxAge: -1,
      httpOnly: true,
      sameSite: 'lax',
    });

    return { status: 'ok' };
  }
}
