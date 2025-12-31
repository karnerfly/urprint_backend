import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { S3Module } from 'src/common/s3/s3.module';
import { AppConfigModule } from 'src/common/config/config.module';

@Module({
  imports: [
    AppConfigModule,
    JwtModule,
    S3Module,
    DatabaseModule,
    SnowflakeModule,
    AuthModule,
  ],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
