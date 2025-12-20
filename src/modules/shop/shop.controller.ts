import { Body, Controller, Post, Res } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from 'src/models/dto/shop.dto';
import { UTokenResponse } from 'src/models/dto/auth.dto';
import type { Response } from 'express';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('create')
  async create(
    @Body() dto: CreateShopDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UTokenResponse> {
    const resp = await this.shopService.create(dto);

    res.cookie('auth_token', resp.token?.refreshToken, {
      domain:
        process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
          ? `.${process.env.DOMAIN}`
          : process.env.DOMAIN,
      expires: resp.token?.refreshTokenExpireAt,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }
}
