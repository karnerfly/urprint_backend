import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { S3Module } from 'src/common/s3/s3.module';
import { SnowflakeModule } from 'src/common/utils/snowflake/snowflake.module';

@Module({
  imports: [DatabaseModule, S3Module, SnowflakeModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
