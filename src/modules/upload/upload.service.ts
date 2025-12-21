import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { Prisma } from 'src/common/database/generated/client';
import { S3Service } from 'src/common/s3/s3.service';
import { getHash } from 'src/common/utils/hash';
import { getRandomCode, getRandomHex } from 'src/common/utils/random';
import { Snowflake } from 'src/common/utils/snowflake/snowflake.util';
import {
  CompleteUploadDto,
  CompleteUploadResponse,
  GetUploadLinkResponse,
} from 'src/models/dto/upload.dto';

@Injectable()
export class UploadService {
  constructor(
    private database: DatabaseService,
    private s3: S3Service,
    private snowflake: Snowflake,
  ) {}

  async getUploadLink(
    uploadToken: string,
    fileNames: string[],
  ): Promise<GetUploadLinkResponse> {
    const shop = await this.database.shop.findUnique({
      where: {
        uploadToken,
      },
    });

    if (!shop) {
      throw new BadRequestException('Invalid upload token');
    }

    const customerToken = getRandomHex(16);
    const tempCode = getRandomCode(8);
    const codeHash = getHash(tempCode, customerToken);

    await this.database.shop.update({
      where: {
        uploadToken,
      },
      data: {
        uploads: {
          create: {
            id: this.snowflake.generate(),
            code: tempCode,
            documentCount: 0,
            expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            customerToken,
          },
        },
      },
    });

    const result: GetUploadLinkResponse = {
      shopId: shop.id,
      customerToken,
      bucket: [],
    };

    for (const fileName of fileNames) {
      const key = `uploads/${uploadToken}/${codeHash}/${fileName}`;
      const url = await this.s3.generateUploadPresignedUrl(key);
      result.bucket.push({
        fileName,
        key,
        uploadLink: url,
      });
    }

    return result;
  }

  async completeUpload(
    customerToken: string,
    dto: CompleteUploadDto,
  ): Promise<CompleteUploadResponse> {
    if (!dto.totalDocuments) {
      dto.totalDocuments = dto.documents.length;
    }

    const result = await this.database.upload.updateManyAndReturn({
      where: {
        customerToken,
        completed: false,
        deleted: false,
      },
      data: {
        documentCount: dto.totalDocuments,
        completed: true,
        expireAt: new Date(Date.now() + dto.expireInMinute * 60 * 1000),
      },
      select: {
        id: true,
        code: true,
        shopId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (result.length == 0) {
      throw new BadRequestException('Invalid request');
    }

    const upload = result[0];

    const entities: Prisma.DocumentCreateManyInput[] = [];
    dto.documents.map((p) =>
      entities.push({
        id: this.snowflake.generate(),
        name: p.name,
        mediaType: p.mediaType,
        noOfCopies: p.noOfCopies,
        downloadable: p.downloadable,
        uploadId: upload.id,
        colorMode: p.colorMode,
        sideMode: p.sideMode,
      }),
    );

    await this.database.document.createMany({ data: entities });

    return {
      code: upload.code,
      createdAt: upload.createdAt,
      shopId: upload.shopId,
      updatedAt: upload.updatedAt,
      uploadId: upload.id,
    };
  }

  async getUploadCode(customerToken: string): Promise<CompleteUploadResponse> {
    const upload = await this.database.upload.findFirst({
      where: {
        customerToken,
        completed: true,
        deleted: false,
      },
    });

    if (!upload) {
      throw new BadRequestException('Invalid request');
    }

    return {
      code: upload.code,
      createdAt: upload.createdAt,
      shopId: upload.shopId,
      updatedAt: upload.updatedAt,
      uploadId: upload.id,
    };
  }

  async markAsDeleted(customerToken: string): Promise<string> {
    const result = await this.database.upload.updateManyAndReturn({
      where: {
        customerToken,
        completed: true,
        deleted: false,
      },
      data: {
        deleted: true,
      },
      select: {
        id: true,
      },
    });

    if (result.length == 0) {
      throw new BadRequestException('Invalid request');
    }

    return result[0].id;
  }
}
