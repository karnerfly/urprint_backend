import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { JwtModule } from '@nestjs/jwt';
import { TaskModule } from 'src/common/task/task.module';

@Module({
  imports: [DatabaseModule, SnowflakeModule, JwtModule, TaskModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
