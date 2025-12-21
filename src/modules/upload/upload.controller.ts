import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { UploadService } from './upload.service';
import {
  CompleteUploadDto,
  CompleteUploadResponse,
  GetUploadLinkResponse,
} from 'src/models/dto/upload.dto';
import type { Response, Request } from 'express';
import { ApiProperty } from '@nestjs/swagger';

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
    @Query('token') uploadToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GetUploadLinkResponse> {
    const resp = await this.uploadService.getUploadLink(uploadToken);

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

  @Get('code')
  async getUploadCode(@Req() req: Request): Promise<CompleteUploadResponse> {
    const customerToken = req.cookies['customer.toknen'];
    return await this.uploadService.getUploadCode(customerToken);
  }

  @Post('complete')
  async completeUpload(
    @Body() dto: CompleteUploadDto,
    @Req() req: Request,
  ): Promise<CompleteUploadResponse> {
    const customerToken = req.cookies['customer.toknen'];
    return await this.uploadService.completeUpload(customerToken, dto);
  }

  @Post('mark-delete')
  async markAsDeleted(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MarkAsDeleteResponse> {
    const customerToken = req.cookies['customer.toknen'];
    const id = await this.uploadService.markAsDeleted(customerToken);
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
