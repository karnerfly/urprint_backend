import {
  Body,
  Controller,
  Delete,
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
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';

class DeleteOwnerResponse {
  @ApiProperty()
  status: string;

  @ApiProperty()
  ownerId: string;
}

class DeleteLocationsResponse {
  @ApiProperty()
  status: string;

  @ApiProperty()
  locationId: number;
}

@UseGuards(AuthGuard)
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Public()
  @Post('owner')
  async createOwner(
    @Body() dto: CreateShopDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UTokenResponse> {
    const resp = await this.shopService.createOwner(dto);

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
  @Delete('owner')
  async deleteOwner(
    @TokenData() tokenData: JWTPayload,
  ): Promise<DeleteOwnerResponse> {
    const deletedId = await this.shopService.deleteOwner(tokenData.ownerId);
    return { status: 'ok', ownerId: deletedId };
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
    return await this.shopService.getLocation(tokenData.shopId);
  }

  @ApiBearerAuth('access-token')
  @Delete('location')
  async deleteLocation(
    @TokenData() tokenData: JWTPayload,
  ): Promise<DeleteLocationsResponse> {
    const deletedId = await this.shopService.deleteLocation(tokenData.shopId);
    return { status: 'ok', locationId: deletedId };
  }
}
