import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { S3Module } from 'src/common/s3/s3.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { AppConfigModule } from 'src/common/config/config.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, S3Module, SnowflakeModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
