import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucketName: string;
  private accountId: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(private config: ConfigService) {
    this.bucketName = config.getOrThrow<string>('R2_BUCKET_NAME');
    this.accountId = config.getOrThrow<string>('R2_ACCOUNT_ID');
    this.accessKeyId = config.getOrThrow<string>('R2_ACCESS_KEY_ID');
    this.secretAccessKey = config.getOrThrow<string>('R2_SECRET_ACCESS_KEY');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  async getPreSignedUrl(key: string) {
    const putUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
      { expiresIn: 1800 },
    );

    return putUrl;
  }
}
