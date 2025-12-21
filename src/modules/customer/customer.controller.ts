import {
  Body,
  Controller,
  Get,
  ParseArrayPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  CompleteUploadDto,
  UploadCodeResponse,
  UploadLinkResponse,
} from 'src/models/dto/customer.dto';
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

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

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
  @Get('upload-code')
  async getUploadCode(
    @Req() req: Request,
    @Query('customerToken') customerToken: string | null,
  ): Promise<UploadCodeResponse> {
    if (!customerToken) {
      customerToken = req.cookies['customer.token'];
    }

    return await this.customerService.getUploadCode(customerToken ?? '');
  }

  @Post('complete-upload')
  async completeUpload(
    @Body() dto: CompleteUploadDto,
    @Req() req: Request,
  ): Promise<UploadCodeResponse> {
    if (!dto.customerToken) {
      dto.customerToken = req.cookies['customer.token'];
    }

    return await this.customerService.completeUpload(
      dto.customerToken ?? '',
      dto,
    );
  }

  @Post('delete-upload')
  async markAsDeleted(
    @Body() dto: CustomerTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MarkAsDeleteResponse> {
    if (!dto.customerToken) {
      dto.customerToken = req.cookies['customer.token'];
    }

    const id = await this.customerService.markAsDeleted(
      dto.customerToken ?? '',
    );

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
