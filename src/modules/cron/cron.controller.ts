import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  Query,
} from '@nestjs/common';
import { CronService } from './cron.service';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import { getHash } from 'src/common/utils/hash';

@Controller('cron')
export class CronController {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly cronService: CronService,
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
