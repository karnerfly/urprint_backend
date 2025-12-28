import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { Prisma } from 'src/common/database/generated/client';
import { S3Service } from 'src/common/s3/s3.service';
import { getHash } from 'src/common/utils/hash';
import { getRandomCode, getRandomHex } from 'src/common/utils/random';
import { Snowflake } from 'src/common/snowflake/snowflake.util';
import {
  CompleteUploadDto,
  UploadCodeResponse,
  UploadLinkResponse,
} from 'src/models/dto/customer.dto';
import mime from 'src/common/utils/mime';

@Injectable()
export class CustomerService {
  constructor(
    private database: DatabaseService,
    private s3: S3Service,
    private snowflake: Snowflake,
  ) {}

  async getUploadLink(
    uploadToken: string,
    fileNames: string[],
  ): Promise<UploadLinkResponse> {
    if (fileNames.some((v) => !mime.lookup(v))) {
      throw new BadRequestException('Some file types are not supported');
    }

    const customerToken = getRandomHex(16);
    const tempCode = getRandomCode(6);

    const shop = await this.database.shop.update({
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
      select: {
        id: true,
      },
    });

    const codeHash = getHash(tempCode, customerToken);
    const result: UploadLinkResponse = {
      shopId: shop.id,
      customerToken,
      bucket: [],
    };

    for (const fileName of fileNames) {
      const key = `uploads/${uploadToken}/${codeHash}/${fileName}`;
      const contentType = mime.lookup(key);
      const url = await this.s3.generateUploadPresignedUrl(key, contentType);
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
  ): Promise<UploadCodeResponse> {
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

  async getUploadCode(customerToken: string): Promise<UploadCodeResponse> {
    const upload = await this.database.upload.findFirst({
      where: {
        customerToken,
        completed: true,
        deleted: false,
        expireAt: {
          gt: new Date(),
        },
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

  async deleteUpload(customerToken: string): Promise<string> {
    const documents = await this.database.document.findMany({
      where: {
        upload: {
          customerToken,
          completed: true,
          deleted: false,
        },
      },
      select: {
        name: true,
        upload: {
          select: {
            code: true,
            shop: {
              select: {
                uploadToken: true,
              },
            },
          },
        },
      },
    });

    if (documents.length == 0) {
      throw new BadRequestException('Invalid request');
    }

    for (const doc of documents) {
      const codeHash = getHash(doc.upload.code, customerToken);
      const key = `uploads/${doc.upload.shop.uploadToken}/${codeHash}/${doc.name}`;
      await this.s3.deleteFile(key);
    }

    const result = await this.database.upload.updateManyAndReturn({
      where: {
        customerToken,
        completed: true,
        deleted: false,
        expireAt: {
          gt: new Date(),
        },
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
