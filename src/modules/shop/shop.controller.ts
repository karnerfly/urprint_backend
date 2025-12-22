import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import {
  AddPhoneNumberDto,
  AddPhoneNumberResponse,
  CreateShopDto,
  DeleteLocationsResponse,
  DeleteOwnerResponse,
  DeletePhoneNumberDto,
  DeletePhoneNumberResponse,
  PhoneNumberResponse,
  ShopLocationResponse,
  ShopUploadsResponse,
  UpdateShopLocationDto,
} from 'src/models/dto/shop.dto';
import { UTokenResponse } from 'src/models/dto/auth.dto';
import type { Response } from 'express';
import { AuthGuard, Public } from 'src/common/guards/auth/auth.guard';
import { TokenData } from 'src/common/decorators/token.decorator';
import type { JWTPayload } from 'src/models/dto/auth.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CONFIG_NAME } from 'src/common/config';
import type { AppConfig } from 'src/common/config';

@UseGuards(AuthGuard)
@Controller('shop')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    @Inject(CONFIG_NAME) private config: AppConfig,
  ) {}

  @Post('owner')
  @Public()
  async createOwner(
    @Body() dto: CreateShopDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UTokenResponse> {
    const resp = await this.shopService.createOwner(dto);

    res.cookie('auth_session', resp.tokens?.refreshToken, {
      domain: this.config.GetWildCardDomain(),
      expires: resp.tokens?.refreshTokenExpireAt,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }

  @Delete('owner')
  @ApiBearerAuth('access-token')
  async deleteOwner(
    @TokenData() tokenData: JWTPayload,
  ): Promise<DeleteOwnerResponse> {
    const deletedId = await this.shopService.deleteOwner(tokenData.ownerId);
    return { status: 'ok', ownerId: deletedId };
  }

  @Patch('location')
  @ApiBearerAuth('access-token')
  async updateLocation(
    @Body() dto: UpdateShopLocationDto,
    @TokenData() tokenData: JWTPayload,
  ): Promise<ShopLocationResponse> {
    return await this.shopService.updateLocation(tokenData.shopId, dto);
  }

  @Get('location')
  @ApiBearerAuth('access-token')
  async getLocation(
    @TokenData() tokenData: JWTPayload,
  ): Promise<ShopLocationResponse> {
    return await this.shopService.getLocation(tokenData.shopId);
  }

  @Delete('location')
  @ApiBearerAuth('access-token')
  async deleteLocation(
    @TokenData() tokenData: JWTPayload,
  ): Promise<DeleteLocationsResponse> {
    const deletedId = await this.shopService.deleteLocation(tokenData.shopId);
    return { status: 'ok', locationId: deletedId };
  }

  @Post('owner/phone')
  @ApiBearerAuth('access-token')
  async addPhone(
    @Body() dto: AddPhoneNumberDto,
    @TokenData() tokenData: JWTPayload,
  ): Promise<AddPhoneNumberResponse> {
    const id = await this.shopService.addPhoneNumber(tokenData.ownerId, dto);
    return { status: 'ok', phoneNumberId: id };
  }

  @Get('owner/phone')
  @ApiBearerAuth('access-token')
  async getPhones(
    @TokenData() tokenData: JWTPayload,
  ): Promise<PhoneNumberResponse> {
    return await this.shopService.getPhoneNumbers(tokenData.ownerId);
  }

  @Delete('owner/phone')
  @ApiBearerAuth('access-token')
  async deletePhone(
    @Body() dto: DeletePhoneNumberDto,
    @TokenData() tokenData: JWTPayload,
  ): Promise<DeletePhoneNumberResponse> {
    const id = await this.shopService.deletePhoneNumber(tokenData.ownerId, dto);
    return { status: 'ok', phoneNumberId: id };
  }

  @Get('uploads')
  @ApiBearerAuth('access-token')
  async getUploades(
    @Query('code') code: string,
    @TokenData() tokenData: JWTPayload,
  ): Promise<ShopUploadsResponse> {
    if (!code) {
      throw new BadRequestException('Invalid code');
    }

    return await this.shopService.getUploads(tokenData.shopId, code);
  }
}
