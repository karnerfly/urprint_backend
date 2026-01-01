import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  CompleteUploadDto,
  DeleteUploadResponse,
  GenerateUploadLinkDto,
  UploadCodeResponse,
  UploadLinkResponse,
} from 'src/models/dto/customer.dto';
import type { Response, Request } from 'express';
import { ApiQuery } from '@nestjs/swagger';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import NAMES from 'src/constants/name';

@Controller('customer')
export class CustomerController {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly customerService: CustomerService,
  ) {}

  @Post('generate-link')
  async generateUploadLink(
    @Body() dto: GenerateUploadLinkDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UploadLinkResponse> {
    const resp = await this.customerService.generateUploadLink(dto);

    res.cookie(NAMES.COOKIE.CUSTOMER_TOKEN, resp.customerToken, {
      domain: this.config.GetWildCardDomain(),
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }

  @Get('upload-code')
  @ApiQuery({
    name: 'customerToken',
    required: false,
  })
  async getUploadCode(
    @Req() req: Request,
    @Query('customerToken') customerToken: string | null,
  ): Promise<UploadCodeResponse> {
    if (!customerToken) {
      customerToken = req.cookies[NAMES.COOKIE.CUSTOMER_TOKEN] as string;
    }

    if (!customerToken) {
      throw new BadRequestException('Invalid customer token');
    }

    return await this.customerService.getUploadCode(customerToken);
  }

  @HttpCode(200)
  @Post('complete-upload')
  async completeUpload(
    @Body() dto: CompleteUploadDto,
    @Req() req: Request,
  ): Promise<UploadCodeResponse> {
    if (!dto.customerToken) {
      dto.customerToken = req.cookies[NAMES.COOKIE.CUSTOMER_TOKEN] as string;
    }

    if (!dto.customerToken) {
      throw new BadRequestException('Invalid customer token');
    }

    return await this.customerService.completeUpload(dto.customerToken, dto);
  }

  @Delete('upload')
  @ApiQuery({
    name: 'customerToken',
    required: false,
  })
  async delete(
    @Query('customerToken') customerToken: string | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DeleteUploadResponse> {
    if (!customerToken) {
      customerToken = req.cookies[NAMES.COOKIE.CUSTOMER_TOKEN] as string;
    }

    if (!customerToken) {
      throw new BadRequestException('Invalid customer token');
    }

    const id = await this.customerService.deleteUpload(customerToken);

    res.cookie(NAMES.COOKIE.CUSTOMER_TOKEN, '', {
      domain: this.config.GetWildCardDomain(),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: -1,
    });

    return { status: 'ok', uploadId: id };
  }
}
