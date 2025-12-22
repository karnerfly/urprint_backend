import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  ParseArrayPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  CompleteUploadDto,
  CustomerTokenDto,
  MarkAsDeleteResponse,
  UploadCodeResponse,
  UploadLinkResponse,
} from 'src/models/dto/customer.dto';
import type { Response, Request } from 'express';
import { ApiQuery } from '@nestjs/swagger';
import { CONFIG_NAME } from 'src/common/config';
import type { AppConfig } from 'src/common/config';

@Controller('customer')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    @Inject(CONFIG_NAME) private config: AppConfig,
  ) {}

  @Get('upload-link')
  async getUploadLink(
    @Query('uploadToken') uploadToken: string,
    @Query(
      'files',
      new ParseArrayPipe({
        items: String,
        optional: true,
      }),
    )
    files: string[],
    @Res({ passthrough: true }) res: Response,
  ): Promise<UploadLinkResponse> {
    const resp = await this.customerService.getUploadLink(uploadToken, files);

    res.cookie('customer.token', resp.customerToken, {
      domain: this.config.GetWildCardDomain(),
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
      customerToken = req.cookies['customer.token'] as string;
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
      dto.customerToken = req.cookies['customer.token'] as string;
    }

    if (!dto.customerToken) {
      throw new BadRequestException('Invalid customer token');
    }

    return await this.customerService.completeUpload(dto.customerToken, dto);
  }

  @Delete('upload')
  async markAsDeleted(
    @Body() dto: CustomerTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MarkAsDeleteResponse> {
    if (!dto.customerToken) {
      dto.customerToken = req.cookies['customer.token'] as string;
    }

    if (!dto.customerToken) {
      throw new BadRequestException('Invalid customer token');
    }

    const id = await this.customerService.markAsDeleted(dto.customerToken);

    res.cookie('customer.token', '', {
      domain: this.config.GetWildCardDomain(),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: -1,
    });

    return { status: 'ok', uploadId: id };
  }
}
