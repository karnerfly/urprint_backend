import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  ParseIntPipe,
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
  DeletePhoneNumberResponse,
  PhoneNumberResponse,
  ShopLocationResponse,
  ShopPublicDetailsResponse,
  ShopUploadResponse,
  UpdateShopLocationDto,
} from 'src/models/dto/shop.dto';
import { UTokenResponse } from 'src/models/dto/auth.dto';
import type { Response } from 'express';
import { AuthGuard, Public } from 'src/common/guards/auth/auth.guard';
import { TokenData } from 'src/common/decorators/token.decorator';
import type { JWTPayload } from 'src/models/dto/auth.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import NAMES from 'src/constants/name';

@UseGuards(AuthGuard)
@Controller('shop')
export class ShopController {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly shopService: ShopService,
  ) {}

  @Post('owner')
  @Public()
  async createOwner(
    @Body() dto: CreateShopDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UTokenResponse> {
    const resp = await this.shopService.createOwner(dto);

    res.cookie(NAMES.COOKIE.AUTH_SESSION, resp.tokens.refreshToken, {
      domain: this.config.GetWildCardDomain(),
      maxAge: resp.tokens.refreshTokenMaxAge * 1000,
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
    @Query('phoneNumberId', ParseIntPipe) phoneNumberId: number,
    @TokenData() tokenData: JWTPayload,
  ): Promise<DeletePhoneNumberResponse> {
    if (phoneNumberId < 1) {
      throw new BadRequestException('Invalid phone number id');
    }
    const id = await this.shopService.deletePhoneNumber(tokenData.ownerId, {
      phoneNumberId,
    });
    return { status: 'ok', phoneNumberId: id };
  }

  @Get('upload')
  @ApiBearerAuth('access-token')
  async getUploades(
    @Query('code') code: string,
    @TokenData() tokenData: JWTPayload,
  ): Promise<ShopUploadResponse> {
    if (!code) {
      throw new BadRequestException('Invalid code');
    }

    return await this.shopService.getUpload(tokenData.shopId, code);
  }

  @Get('/public-details')
  @Public()
  async getPublicDetails(
    @Query('uploadToken') uploadToken: string,
  ): Promise<ShopPublicDetailsResponse> {
    if (!uploadToken) {
      throw new BadRequestException('Invalid code');
    }

    return await this.shopService.getPublicDetails(uploadToken);
  }
}
