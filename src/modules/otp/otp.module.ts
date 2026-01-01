import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { TaskModule } from 'src/common/task/task.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, SnowflakeModule, TaskModule, AuthModule],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
