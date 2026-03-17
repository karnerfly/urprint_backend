import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthV2Service } from './auth.service';
import { LoginDto } from 'src/models/dto/auth.dto';
import type {
  CsrfResponse,
  EmailExistsResponse,
  LogoutResponse,
  Session,
  USessionResponse,
} from 'src/models/dto/auth.dto';
import type { Request, Response } from 'express';
import { AuthSessionGuard } from 'src/common/guards/auth/auth.guard';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import { getRandomBase64Url } from 'src/common/utils/random';
import NAMES from 'src/constants/name';
import { ApiCookieAuth } from '@nestjs/swagger';
import { SessionData } from 'src/common/decorators/session.decorator';

// @Controller({ path: 'auth', version: '1' })
// export class AuthV1Controller {
//   constructor(
//     @Inject(CONFIG_NAME) private readonly config: AppConfig,
//     private readonly authV1Service: AuthV1Service,
//   ) {}

//   @Get('email/exists')
//   async emailExists(
//     @Query('email') email: string,
//   ): Promise<EmailExistsResponse> {
//     const exists = await this.authV1Service.emailExists(email);
//     return {
//       status: 'ok',
//       exists,
//     };
//   }

//   // @HttpCode(200)
//   // @Post('login')
//   // async login(
//   //   @Body() dto: LoginDto,
//   //   @Res({ passthrough: true }) res: Response,
//   // ): Promise<UTokenResponse> {
//   //   const resp = await this.authV1Service.login(dto);

//   //   res.cookie(NAMES.COOKIE.AUTH_SESSION, resp.tokens.refreshToken, {
//   //     domain: this.config.GetWildCardDomain(),
//   //     maxAge: resp.tokens.refreshTokenMaxAge * 1000,
//   //     path: '/',
//   //     httpOnly: true,
//   //     sameSite: 'lax',
//   //   });

//   //   return resp;
//   // }

//   @Get('csrf')
//   getCsrfToken(
//     @Req() req: Request,
//     @Res({ passthrough: true }) res: Response,
//   ): CsrfResponse {
//     let csrfToken = req.cookies[NAMES.COOKIE.CSRF_TOKEN] as string;

//     if (!csrfToken) {
//       csrfToken = getRandomBase64Url(32);
//       res.cookie(NAMES.COOKIE.CSRF_TOKEN, csrfToken, {
//         domain: this.config.GetWildCardDomain(),
//         httpOnly: false,
//         path: '/',
//         sameSite: 'lax',
//         maxAge: 1000 * 60 * 60 * 24,
//       });
//     }

//     return {
//       cookieName: NAMES.COOKIE.CSRF_TOKEN,
//       headerName: NAMES.HEADER.CSRF_TOKEN,
//       value: csrfToken,
//     };
//   }

//   // @HttpCode(200)
//   // @Post('refresh/tokens')
//   // @Throttle({
//   //   default: {
//   //     ttl: 60000,
//   //     limit: 30,
//   //   },
//   // })
//   // async refreshTokens(
//   //   @Req() req: Request,
//   //   @Res({ passthrough: true }) res: Response,
//   // ): Promise<UTokenResponse> {
//   //   const refreshTokenCookie = req.cookies[NAMES.COOKIE.AUTH_SESSION] as string;

//   //   if (!refreshTokenCookie) {
//   //     throw new ForbiddenException('Invalid request');
//   //   }

//   //   const resp = await this.authV1Service.refreshTokens(refreshTokenCookie);

//   //   res.cookie(NAMES.COOKIE.AUTH_SESSION, resp.tokens.refreshToken, {
//   //     domain: this.config.GetWildCardDomain(),
//   //     maxAge: resp.tokens.refreshTokenMaxAge * 1000,
//   //     path: '/',
//   //     httpOnly: true,
//   //     sameSite: 'lax',
//   //   });

//   //   return resp;
//   // }

//   // @HttpCode(200)
//   // @Post('logout')
//   // @ApiBearerAuth('access-token')
//   // @UseGuards(AuthGuard)
//   // async logout(
//   //   @TokenData() tokenData: JWTPayload,
//   //   @Res({ passthrough: true }) res: Response,
//   // ): Promise<LogoutResponse> {
//   //   await this.authV1Service.logout(tokenData.ownerId);

//   //   res.cookie(NAMES.COOKIE.AUTH_SESSION, '', {
//   //     domain: this.config.GetWildCardDomain(),
//   //     path: '/',
//   //     maxAge: -1,
//   //     httpOnly: true,
//   //     sameSite: 'lax',
//   //   });

//   //   return { status: 'ok' };
//   // }
// }

@Controller({ path: 'auth', version: '2' })
export class AuthV2Controller {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly authV2Service: AuthV2Service,
  ) {}

  @Get('email/exists')
  async emailExists(
    @Query('email') email: string,
  ): Promise<EmailExistsResponse> {
    const exists = await this.authV2Service.emailExists(email);
    return {
      status: 'ok',
      exists,
    };
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
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<USessionResponse> {
    const ip = req.ip || '';
    const deviceId = req.cookies[NAMES.COOKIE.DEVICE_ID]
      ? req.cookies[NAMES.COOKIE.DEVICE_ID]
      : '';
    const userAgent = req.headers['user-agent']
      ? req.headers['user-agent']
      : '';

    // Currently this API only supports web clients
    if (!dto.webClient) {
      throw new BadRequestException(
        'This API version currently supports only web clients',
      );
    }

    const resp = await this.authV2Service.login(dto, ip, userAgent, deviceId);

    res.cookie(NAMES.COOKIE.AUTH_SESSION_SECRET, resp.sessionSecret, {
      domain: this.config.GetWildCardDomain(),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 1000 * this.config.SESSION_EXPIRY_SECONDS,
    });

    res.cookie(NAMES.COOKIE.AUTH_SESSION, resp.sessionId, {
      domain: this.config.GetWildCardDomain(),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 1000 * this.config.SESSION_EXPIRY_SECONDS,
    });

    return resp.response;
  }

  @HttpCode(200)
  @Post('logout')
  @UseGuards(AuthSessionGuard)
  @ApiCookieAuth()
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponse> {
    const sessionId = req.cookies[NAMES.COOKIE.AUTH_SESSION] as string;

    await this.authV2Service.logout(sessionId);

    res.cookie(NAMES.COOKIE.AUTH_SESSION_SECRET, '', {
      domain: this.config.GetWildCardDomain(),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: -1,
    });

    res.cookie(NAMES.COOKIE.AUTH_SESSION, '', {
      domain: this.config.GetWildCardDomain(),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: -1,
    });

    return { status: 'ok' };
  }

  @HttpCode(200)
  @Get('me')
  @UseGuards(AuthSessionGuard)
  @ApiCookieAuth()
  async getMe(@SessionData() sessionData: Session): Promise<USessionResponse> {
    return this.authV2Service.getDetails(sessionData.ownerId);
  }
}
