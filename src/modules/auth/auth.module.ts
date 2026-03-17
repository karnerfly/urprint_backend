import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthV1Service, AuthV2Service } from './auth.service';
import { AuthV2Controller } from './auth.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { AppConfigModule } from 'src/common/config/config.module';
import { SessionModule } from 'src/common/session/session.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    JwtModule,
    OtpModule,
    SessionModule,
  ],
  controllers: [AuthV2Controller],
  providers: [AuthV1Service, AuthV2Service],
  exports: [AuthV1Service],
})
export class AuthModule {}
