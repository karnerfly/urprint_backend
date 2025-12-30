import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { S3Module } from 'src/common/s3/s3.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, DatabaseModule, S3Module, SnowflakeModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
