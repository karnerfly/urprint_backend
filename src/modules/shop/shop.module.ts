import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { SnowflakeModule } from 'src/common/utils/snowflake/snowflake.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    DatabaseModule,
    SnowflakeModule,
    AuthModule,
  ],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
