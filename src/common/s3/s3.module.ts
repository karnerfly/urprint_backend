import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AppConfigModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
