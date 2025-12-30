import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_NAME, type Config } from '../config';

@Injectable()
export class S3Service {
  private client: S3Client;
  private region: string;
  private bucketName: string;
  private accountId: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(@Inject(CONFIG_NAME) private config: Config) {
    this.region = config.R2_REGION;
    this.bucketName = config.R2_BUCKET_NAME;
    this.accountId = config.R2_ACCOUNT_ID;
    this.accessKeyId = config.R2_ACCESS_KEY_ID;
    this.secretAccessKey = config.R2_SECRET_ACCESS_KEY;

    this.client = new S3Client({
      region: this.region,
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  async generateUploadPresignedUrl({
    key,
    contentType,
    contentLength,
  }: {
    key: string;
    contentType: string;
    contentLength: number;
  }) {
    return await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
      }),
      {
        expiresIn: this.config.R2_UPLOAD_URL_EXPIRY_SECONDS,
      },
    );
  }

  async generateReadPresignedUrl(key: string) {
    return await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        // ResponseContentType: 'application/octet-stream',
        // ResponseContentDisposition: 'attachment',
      }),
      {
        expiresIn: this.config.R2_READ_URL_EXPIRY_SECONDS,
      },
    );
  }

  async deleteFile(key: string) {
    return await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }
}
