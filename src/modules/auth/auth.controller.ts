import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, UTokenResponse } from 'src/models/dto/auth.dto';
import type { JWTPayload } from 'src/models/dto/auth.dto';
import type { Request, Response } from 'express';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { TokenData } from 'src/common/decorators/token.decorator';

class LogoutResponse {
  @ApiProperty()
  status: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UTokenResponse> {
    const resp = await this.authService.login(dto);

    res.cookie('auth_token', resp.tokens?.refreshToken, {
      domain:
        process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
          ? `.${process.env.DOMAIN}`
          : process.env.DOMAIN,
      maxAge: resp.tokens?.refreshTokenMaxAge,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }

  @Post('refresh/tokens')
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UTokenResponse> {
    const refreshTokenCookie = req.cookies['auth_token'];
    const resp = await this.authService.refreshTokens(refreshTokenCookie);

    res.cookie('auth_token', resp.tokens?.refreshToken, {
      domain:
        process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
          ? `.${process.env.DOMAIN}`
          : process.env.DOMAIN,
      maxAge: resp.tokens?.refreshTokenMaxAge,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(
    @TokenData() tokenData: JWTPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponse> {
    await this.authService.logout(tokenData.ownerId);

    res.cookie('auth_token', '', {
      domain:
        process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
          ? `.${process.env.DOMAIN}`
          : process.env.DOMAIN,
      path: '/',
      maxAge: -1,
      httpOnly: true,
      sameSite: 'lax',
    });

    return { status: 'ok' };
  }
}
