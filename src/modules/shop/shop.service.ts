import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { DatabaseService } from 'src/common/database/database.service';
import { getRandomBase64Url, getRandomHex } from 'src/common/utils/random';
import { Snowflake } from 'src/common/snowflake/snowflake.util';
import {
  AddPhoneNumberDto,
  CreateOwnerResponse,
  CreateShopDto,
  DeletePhoneNumberDto,
  PhoneNumberResponse,
  ShopLocationResponse,
  ShopPublicDetailsResponse,
  ShopUploadedDocument,
  ShopUploadResponse,
  UpdateShopLocationDto,
  VerifyOwnerDto,
} from 'src/models/dto/shop.dto';
import { S3Service } from 'src/common/s3/s3.service';
import { getHash } from 'src/common/utils/hash';
import { OtpService } from '../otp/otp.service';
import {
  Session,
  SessionState,
  USessionResponse,
} from 'src/models/dto/auth.dto';
import { SessionService } from 'src/common/session/session.service';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';

@Injectable()
export class ShopService {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly database: DatabaseService,
    private readonly otpService: OtpService,
    private readonly session: SessionService,
    private readonly snowflake: Snowflake,
    private readonly s3: S3Service,
  ) {}

  async createOwner(dto: CreateShopDto): Promise<USessionResponse> {
    const count = await this.database.shopOwner.count({
      where: { email: dto.email },
    });

    if (count > 0) {
      throw new BadRequestException('A user with this email already exists');
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(dto.password, salt);

    const owner = await this.database.shopOwner.create({
      data: {
        id: this.snowflake.generate(),
        name: dto.ownerName,
        email: dto.email,
        otpRequired: false, // by default disable 2fa
        passwordSalt: salt,
        passwordHash: hash,
        shop: {
          create: {
            id: this.snowflake.generate(),
            shopName: dto.shopName,
            uploadToken: getRandomBase64Url(32),
          },
        },
      },
      include: {
        shop: {
          select: {
            id: true,
            shopName: true,
            uploadToken: true,
            createdAt: true,
          },
        },
      },
      omit: {
        passwordHash: true,
        passwordSalt: true,
      },
    });

    if (!owner.shop) {
      throw new ServiceUnavailableException('Failed to create owner shop');
    }

    const { verificationToken } = await this.otpService._createRecord({
      ackRequired: true,
      maxFailed: 3,
      maxResend: 3,
      medium: 'EMAIL',
      mediumIdentity: owner.email,
      ownerId: owner.id,
      purpose: 'EMAIL_VERIFICATION',
    });

    return {
      ownerId: owner.id,
      ownerName: owner.name,
      ownerEmail: owner.email,
      verified: owner.verified,
      otpRequired: owner.otpRequired,
      otpGenerated: false,
      otpVerificationKey: verificationToken,
      shopId: owner.shop.id,
      shopName: owner.shop.shopName,
      uploadToken: owner.shop.uploadToken,
      createdAt: owner.shop.createdAt,
      updatedAt: owner.updatedAt,
    };
  }

  async verifyOwner(
    dto: VerifyOwnerDto,
    ip: string,
    userAgent: string,
    deviceId: string | null,
  ): Promise<{
    response: USessionResponse;
    sessionId: string;
    sessionSecret: string;
  }> {
    const otp = await this.database.otp.updateMany({
      where: {
        ackId: dto.ackId,
        ownerId: dto.ownerId,
        purpose: 'EMAIL_VERIFICATION',
        ackRequired: true,
        ackUsed: false,
        ackExpireAt: {
          gt: new Date(Date.now()),
        },
      },
      data: {
        ackUsed: true,
      },
    });

    if (otp.count == 0) {
      throw new BadRequestException('Invalid request');
    }

    const owner = await this.database.shopOwner.update({
      where: {
        id: dto.ownerId,
      },
      data: {
        verified: true,
      },
      include: {
        shop: {},
      },
      omit: {
        passwordHash: true,
        passwordSalt: true,
      },
    });

    if (!owner || !owner.shop) {
      throw new BadRequestException('Invalid request');
    }

    const now = Date.now();
    const sessionId = getRandomHex(32);
    const sessionSecret = getRandomHex(32);

    const payload: Session = {
      state: SessionState.ACTIVE,
      ownerId: owner.id,
      shopId: owner.shop.id,
      otpRequired: owner.otpRequired,
      uploadToken: owner.shop.uploadToken,
      verified: owner.verified,
      profile: {
        ownerName: owner.name,
        ownerEmail: owner.email,
        shopName: owner.shop.shopName,
      },
      deviceId,
      ip,
      userAgent,
      iat: now,
      exp: now + this.config.SESSION_EXPIRY_SECONDS * 1000,
    };

    await this.session.put(
      sessionId,
      payload,
      Buffer.from(sessionSecret, 'hex'),
      this.config.SESSION_EXPIRY_SECONDS,
    );

    return {
      sessionId,
      sessionSecret,
      response: {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerEmail: owner.email,
        verified: owner.verified,
        otpRequired: owner.otpRequired,
        otpGenerated: false,
        otpVerificationKey: null,
        shopId: owner.shop.id,
        shopName: owner.shop.shopName,
        uploadToken: owner.shop.uploadToken,
        createdAt: owner.shop.createdAt,
        updatedAt: owner.updatedAt,
      },
    };
  }

  async deleteOwner(ownerId: string): Promise<string> {
    const record = await this.database.shopOwner.delete({
      where: {
        id: ownerId,
      },
      select: {
        id: true,
      },
    });

    if (!record) {
      throw new ServiceUnavailableException(
        'Cannot delete owner at this moment',
      );
    }

    return record.id;
  }

  async updateLocation(
    shopId: string,
    dto: UpdateShopLocationDto,
  ): Promise<ShopLocationResponse> {
    const result = await this.database.shop.update({
      where: {
        id: shopId,
      },
      data: {
        location: {
          upsert: {
            create: {
              ...dto,
            },
            update: {
              ...dto,
            },
          },
        },
      },
      select: {
        location: {},
      },
    });

    if (!result) {
      throw new BadRequestException('Invalid request');
    }

    if (!result.location) {
      throw new ServiceUnavailableException(
        'Cannot update shop location at this moment',
      );
    }

    return result.location;
  }

  async getLocation(shopId: string): Promise<ShopLocationResponse> {
    const result = await this.database.shop.findFirst({
      where: {
        id: shopId,
      },
      select: {
        location: {},
      },
    });

    if (!result || !result.location) {
      throw new NotFoundException('Resource not found');
    }

    return result.location;
  }

  async deleteLocation(shopId: string): Promise<number> {
    const result = await this.database.shop.delete({
      where: {
        id: shopId,
      },
      select: {
        location: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!result || !result.location) {
      throw new ServiceUnavailableException(
        'Cannot delete shop location at this moment',
      );
    }

    return result.location.id;
  }

  async addPhoneNumber(
    ownerId: string,
    dto: AddPhoneNumberDto,
  ): Promise<number> {
    const phoneNoCount = await this.database.ownerPhone.count({
      where: {
        ownerId,
      },
    });

    if (phoneNoCount >= 2) {
      throw new BadRequestException('Max phone number exceed');
    }

    const result = await this.database.ownerPhone.create({
      data: {
        ownerId,
        phone: dto.phone,
      },
      select: {
        id: true,
      },
    });

    return result.id;
  }

  async getPhoneNumbers(ownerId: string): Promise<PhoneNumberResponse> {
    const result = await this.database.ownerPhone.findMany({
      where: {
        ownerId,
      },
      select: {
        id: true,
        phone: true,
      },
    });

    const resp: PhoneNumberResponse = {
      ownerId,
      phones: [],
    };

    for (const p of result) {
      resp.phones.push({ id: p.id, value: p.phone });
    }

    return resp;
  }

  async deletePhoneNumber(
    ownerId: string,
    dto: DeletePhoneNumberDto,
  ): Promise<number> {
    const result = await this.database.ownerPhone.delete({
      where: {
        id: dto.phoneNumberId,
        ownerId,
      },
      select: {
        id: true,
      },
    });

    return result.id;
  }

  async getUpload(shopId: string, code: string): Promise<ShopUploadResponse> {
    const upload = await this.database.upload.findFirst({
      where: {
        shopId,
        code,
        completed: true,
        deleted: false,
        expireAt: {
          gt: new Date(),
        },
      },
      include: {
        documents: {},
        shop: {
          select: {
            uploadToken: true,
          },
        },
      },
    });

    if (!upload) {
      throw new NotFoundException('Resource not found');
    }

    const codeHash = getHash(upload.code, upload.customerToken);

    const documents: ShopUploadedDocument[] = [];
    if (upload.documents.length > 0) {
      for (const doc of upload.documents) {
        const key = `uploads/${upload.shop.uploadToken}/${codeHash}/${doc.name}`;
        documents.push({
          id: doc.id,
          name: doc.name,
          mediaType: doc.mediaType,
          downloadable: doc.downloadable,
          noOfCopies: doc.noOfCopies,
          colorMode: doc.colorMode,
          sideMode: doc.sideMode,
          url: await this.s3.generateReadPresignedUrl(key),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        });
      }
    }

    return {
      uploadId: upload.id,
      totalDocuments: upload.documentCount,
      completed: upload.completed,
      documents,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
    };
  }

  async getPublicDetails(
    uploadToken: string,
  ): Promise<ShopPublicDetailsResponse> {
    const result = await this.database.shop.findFirst({
      where: {
        uploadToken,
      },
      select: {
        shopName: true,
        owner: {
          select: {
            name: true,
            phones: {
              select: {
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new BadRequestException('Invalid upload token');
    }

    const publiDetails: ShopPublicDetailsResponse = {
      shopName: result.shopName,
      ownerName: result.owner.name,
      ownerPhones: [],
    };

    for (const ph of result.owner.phones) {
      publiDetails.ownerPhones.push(ph.phone);
    }

    return publiDetails;
  }
}
