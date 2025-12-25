import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import { CronService } from './cron.service';
import { CONFIG_NAME } from 'src/common/config';
import type { AppConfig } from 'src/common/config';
import { getHash } from 'src/common/utils/hash';

@Controller('cron')
export class CronController {
  constructor(
    private readonly cronService: CronService,
    @Inject(CONFIG_NAME) private config: AppConfig,
  ) {}

  @HttpCode(204)
  @Get('/daily-midnight')
  async DailyMidnightJob(@Query('token') tokenHash: string) {
    const actualHash = getHash(
      this.config.CRON_MIDNIGHT_TOKEN,
      this.config.CRON_SECRET_KEY,
    );
    if (actualHash !== tokenHash) {
      throw new ForbiddenException();
    }

    await this.cronService.deleteStaleUploads();
    await this.cronService.deleteStaleRefreshToken();
  }
}
