import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { SnowflakeModule } from 'src/common/utils/snowflake/snowflake.module';

@Module({
  imports: [DatabaseModule, SnowflakeModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
