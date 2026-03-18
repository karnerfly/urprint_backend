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
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import {
  AddPhoneNumberDto,
  AddPhoneNumberResponse,
  CreateOwnerResponse,
  CreateShopDto,
  DeleteLocationsResponse,
  DeleteOwnerResponse,
  DeletePhoneNumberResponse,
  PhoneNumberResponse,
  ShopLocationResponse,
  ShopPublicDetailsResponse,
  ShopUploadResponse,
  UpdateShopLocationDto,
  VerifyOwnerDto,
} from 'src/models/dto/shop.dto';
import { AuthSessionGuard, Public } from 'src/common/guards/auth/auth.guard';
import { USessionResponse, type Session } from 'src/models/dto/auth.dto';
import { ApiCookieAuth } from '@nestjs/swagger';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import { SessionData } from 'src/common/decorators/session.decorator';
import type { Request, Response } from 'express';
import NAMES from 'src/constants/name';

@UseGuards(AuthSessionGuard)
@Controller({ path: 'shop', version: '1' })
export class ShopController {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly shopService: ShopService,
  ) {}

  @Post('owner')
  @Public()
  async createOwner(@Body() dto: CreateShopDto): Promise<USessionResponse> {
    return await this.shopService.createOwner(dto);
  }

  @Post('owner/email-verify')
  @Public()
  async verifyEmail(
    @Body() dto: VerifyOwnerDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<USessionResponse> {
    const ip = req.ip || '';
    const deviceId = req.cookies[NAMES.COOKIE.DEVICE_ID]
      ? (req.cookies[NAMES.COOKIE.DEVICE_ID] as string)
      : null;
    const userAgent = req.headers['user-agent']
      ? (req.headers['user-agent'] as string)
      : '';
    const resp = await this.shopService.verifyOwner(
      dto,
      ip,
      userAgent,
      deviceId,
    );

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

  @Delete('owner')
  @ApiCookieAuth()
  async deleteOwner(
    @SessionData() sessionData: Session,
  ): Promise<DeleteOwnerResponse> {
    const deletedId = await this.shopService.deleteOwner(sessionData.ownerId);
    return { status: 'ok', ownerId: deletedId };
  }

  @Patch('location')
  @ApiCookieAuth()
  async updateLocation(
    @Body() dto: UpdateShopLocationDto,
    @SessionData() sessionData: Session,
  ): Promise<ShopLocationResponse> {
    return await this.shopService.updateLocation(sessionData.shopId, dto);
  }

  @Get('location')
  @ApiCookieAuth()
  async getLocation(
    @SessionData() sessionData: Session,
  ): Promise<ShopLocationResponse> {
    return await this.shopService.getLocation(sessionData.shopId);
  }

  @Delete('location')
  @ApiCookieAuth()
  async deleteLocation(
    @SessionData() sessionData: Session,
  ): Promise<DeleteLocationsResponse> {
    const deletedId = await this.shopService.deleteLocation(sessionData.shopId);
    return { status: 'ok', locationId: deletedId };
  }

  @Post('owner/phone')
  @ApiCookieAuth()
  async addPhone(
    @Body() dto: AddPhoneNumberDto,
    @SessionData() sessionData: Session,
  ): Promise<AddPhoneNumberResponse> {
    const id = await this.shopService.addPhoneNumber(sessionData.ownerId, dto);
    return { status: 'ok', phoneNumberId: id };
  }

  @Get('owner/phone')
  @ApiCookieAuth()
  async getPhones(
    @SessionData() sessionData: Session,
  ): Promise<PhoneNumberResponse> {
    return await this.shopService.getPhoneNumbers(sessionData.ownerId);
  }

  @Delete('owner/phone')
  @ApiCookieAuth()
  async deletePhone(
    @Query('phoneNumberId', ParseIntPipe) phoneNumberId: number,
    @SessionData() sessionData: Session,
  ): Promise<DeletePhoneNumberResponse> {
    if (phoneNumberId < 1) {
      throw new BadRequestException('Invalid phone number id');
    }
    const id = await this.shopService.deletePhoneNumber(sessionData.ownerId, {
      phoneNumberId,
    });
    return { status: 'ok', phoneNumberId: id };
  }

  @Get('upload')
  @ApiCookieAuth()
  async getUploades(
    @Query('code') code: string,
    @SessionData() sessionData: Session,
  ): Promise<ShopUploadResponse> {
    if (!code) {
      throw new BadRequestException('Invalid code');
    }

    return await this.shopService.getUpload(sessionData.shopId, code);
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
