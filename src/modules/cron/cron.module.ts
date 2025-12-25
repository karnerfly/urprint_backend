import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { AppConfigModule } from 'src/common/config/config.module';
import { DatabaseModule } from 'src/common/database/database.module';

@Module({
  imports: [AppConfigModule, DatabaseModule],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
