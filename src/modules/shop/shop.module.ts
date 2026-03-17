import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { JwtModule } from '@nestjs/jwt';
import { S3Module } from 'src/common/s3/s3.module';
import { AppConfigModule } from 'src/common/config/config.module';
import { OtpModule } from '../otp/otp.module';
import { SessionModule } from 'src/common/session/session.module';

@Module({
  imports: [
    AppConfigModule,
    JwtModule,
    S3Module,
    DatabaseModule,
    SessionModule,
    SnowflakeModule,
    OtpModule,
  ],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
