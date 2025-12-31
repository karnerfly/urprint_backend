import { Body, Controller, HttpCode, Inject, Post, Res } from '@nestjs/common';
import { OtpService } from './otp.service';
import {
  GenerateOtpDto,
  GenerateOtpResponse,
  ResendOtpDto,
  ResendOtpResponse,
  VerifyOtpDto,
  VerifyOtpResponse,
} from 'src/models/dto/otp.dto';
import type { Response } from 'express';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';

@Controller('otp')
export class OtpController {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly otpService: OtpService,
  ) {}

  @HttpCode(200)
  @Post('generate')
  async generate(@Body() dto: GenerateOtpDto): Promise<GenerateOtpResponse> {
    return await this.otpService.generate(dto);
  }

  @HttpCode(200)
  @Post('resend')
  async resend(@Body() dto: ResendOtpDto): Promise<ResendOtpResponse> {
    return await this.otpService.resend(dto);
  }

  @HttpCode(200)
  @Post('verify')
  async verify(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    return await this.otpService.verify(dto);
  }

  @HttpCode(200)
  @Post('verify-and-generate-tokens')
  async verifyAndGenerateTokens(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resp = await this.otpService.verifyAndGenerateTokens(dto);

    res.cookie('auth_session', resp.tokens.refreshToken, {
      domain: this.config.GetWildCardDomain(),
      maxAge: resp.tokens.refreshTokenMaxAge * 1000,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return resp;
  }
}
