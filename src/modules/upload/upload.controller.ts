import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { UploadService } from './upload.service';
import {
  CompleteUploadDto,
  CompleteUploadResponse,
  GetUploadLinkResponse,
} from 'src/models/dto/upload.dto';
import type { Response, Request } from 'express';
import { ApiProperty, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CustomerTokenDto {
  @ApiProperty({ nullable: true })
  @IsString({ message: 'must be a string' })
  @IsOptional()
  customerToken?: string;
}

class MarkAsDeleteResponse {
  @ApiProperty()
  status: string;

  @ApiProperty()
  uploadId: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('link')
  async getUploadLink(
    @Query('uploadToken') uploadToken: string,
    @Query('files') files: string[],
    @Res({ passthrough: true }) res: Response,
  ): Promise<GetUploadLinkResponse> {
    const resp = await this.uploadService.getUploadLink(uploadToken, files);

    res.cookie('customer.token', resp.customerToken, {
      domain:
        process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
          ? `.${process.env.DOMAIN}`
          : process.env.DOMAIN,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }

  @ApiQuery({
    name: 'customerToken',
    required: false,
  })
  @Get('code')
  async getUploadCode(
    @Req() req: Request,
    @Query('customerToken') customerToken: string | null,
  ): Promise<CompleteUploadResponse> {
    if (!customerToken) {
      customerToken = req.cookies['customer.token'];
    }

    return await this.uploadService.getUploadCode(customerToken ?? '');
  }

  @Post('complete')
  async completeUpload(
    @Body() dto: CompleteUploadDto,
    @Req() req: Request,
  ): Promise<CompleteUploadResponse> {
    if (!dto.customerToken) {
      dto.customerToken = req.cookies['customer.token'];
    }

    return await this.uploadService.completeUpload(
      dto.customerToken ?? '',
      dto,
    );
  }

  @Post('mark-delete')
  async markAsDeleted(
    @Body() dto: CustomerTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MarkAsDeleteResponse> {
    if (!dto.customerToken) {
      dto.customerToken = req.cookies['customer.token'];
    }

    const id = await this.uploadService.markAsDeleted(dto.customerToken ?? '');

    res.cookie('customer.token', '', {
      domain:
        process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
          ? `.${process.env.DOMAIN}`
          : process.env.DOMAIN,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: -1,
    });

    return { status: 'ok', uploadId: id };
  }
}
