import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { TaskModule } from 'src/common/task/task.module';
import { JwtModule } from '@nestjs/jwt';
import { SessionModule } from 'src/common/session/session.module';

@Module({
  imports: [
    DatabaseModule,
    SnowflakeModule,
    JwtModule,
    TaskModule,
    SessionModule,
  ],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
