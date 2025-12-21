import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import {
  CreateShopDto,
  ShopLocationResponse,
  UpdateShopLocationDto,
} from 'src/models/dto/shop.dto';
import { UTokenResponse } from 'src/models/dto/auth.dto';
import type { Response } from 'express';
import { AuthGuard, Public } from 'src/common/guards/auth/auth.guard';
import { TokenData } from 'src/common/decorators/token.decorator';
import type { JWTPayload } from 'src/models/dto/auth.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Public()
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

  @ApiBearerAuth('access-token')
  @Patch('location')
  async updateLocation(
    @Body() dto: UpdateShopLocationDto,
    @TokenData() tokenData: JWTPayload,
  ): Promise<ShopLocationResponse> {
    return await this.shopService.updateLocation(tokenData.shopId, dto);
  }

  @ApiBearerAuth('access-token')
  @Get('location')
  async getLocation(
    @TokenData() tokenData: JWTPayload,
  ): Promise<ShopLocationResponse> {
    const resp = await this.shopService.getLocation(tokenData.shopId);
    if (!resp) {
      throw new NotFoundException('location not found.');
    }

    return resp;
  }
}
