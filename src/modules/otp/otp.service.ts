import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import { DatabaseService } from 'src/common/database/database.service';
import { getHash } from 'src/common/utils/hash';
import {
  getRandomBase64Url,
  getRandomCode,
  getRandomHex,
} from 'src/common/utils/random';
import {
  InternalCreateRecordPayload,
  GenerateOtpDto,
  GenerateOtpResponse,
  ResendOtpDto,
  ResendOtpResponse,
  VerifyOtpDto,
  VerifyOtpResponse,
} from 'src/models/dto/otp.dto';
import { Snowflake } from 'src/common/snowflake/snowflake.util';
import {
  JWTPayload,
  SessionState,
  UTokenResponse,
} from 'src/models/dto/auth.dto';
import { TaskService } from 'src/common/task/task.service';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from 'src/common/session/session.service';

@Injectable()
export class OtpService {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly database: DatabaseService,
    private readonly snowflake: Snowflake,
    private readonly jwtService: JwtService,
    private readonly taskService: TaskService,
    private readonly session: SessionService,
  ) {}

  async generate(dto: GenerateOtpDto): Promise<GenerateOtpResponse> {
    const record = await this.database.otp.findFirst({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
        otpGenerated: false,
        otpVerified: false,
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid request');
    }

    // TODO: check per day otp rate limit on medium identity

    const otp = getRandomCode(6);
    const otpHash = getHash(otp, dto.verificationToken);

    const updated = await this.database.otp.update({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
      },
      data: {
        otpHash,
        otpGenerated: true,
        expireAt: new Date(Date.now() + this.config.OTP_EXPIRY_SECONDS * 1000),
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    // NOTE: only support email for now
    if (record.purpose === 'EMAIL_VERIFICATION') {
      await this.taskService.SendEmailVerificationMail({
        name: updated.owner.name,
        identity: updated.mediumIdentity,
        otp,
        timestamp: new Date(Date.now()),
      });
    } else if (record.purpose === 'TWO_FACTOR_AUTHENTICATION') {
      await this.taskService.SendTwoFactorAuthenticationMail({
        identity: updated.mediumIdentity,
        otp,
        timestamp: new Date(Date.now()),
      });
    }

    return {
      generated: true,
      ownerId: updated.ownerId,
      purpose: updated.purpose,
      medium: updated.medium,
      generatedFor: updated.mediumIdentity,
      maxResend: updated.maxResend,
      maxFailed: updated.maxFailed,
      expireInMinute: this.config.OTP_EXPIRY_SECONDS / 60,
      expireAt: updated.expireAt!,
      createdAt: updated.createdAt,
    };
  }

  async resend(dto: ResendOtpDto): Promise<ResendOtpResponse> {
    const record = await this.database.otp.findFirst({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
        otpGenerated: true,
        otpVerified: false,
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid verification token or owner id');
    }

    if (record.resendCount >= record.maxResend) {
      throw new BadRequestException('Max resend exceed');
    }

    const otp = getRandomCode(6);
    const otpHash = getHash(otp, dto.verificationToken);

    const updated = await this.database.otp.update({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
      },
      data: {
        otpHash,
        resendCount: record.resendCount + 1,
        failedCount: 0,
        expireAt: new Date(Date.now() + this.config.OTP_EXPIRY_SECONDS * 1000),
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    // NOTE: only support email for now
    if (record.purpose === 'EMAIL_VERIFICATION') {
      await this.taskService.SendEmailVerificationMail({
        name: updated.owner.name,
        identity: updated.mediumIdentity,
        otp,
        timestamp: new Date(Date.now()),
      });
    } else if (record.purpose === 'TWO_FACTOR_AUTHENTICATION') {
      await this.taskService.SendTwoFactorAuthenticationMail({
        identity: updated.mediumIdentity,
        otp,
        timestamp: new Date(Date.now()),
      });
    }

    return {
      resent: true,
      ownerId: updated.ownerId,
      purpose: updated.purpose,
      medium: updated.medium,
      resentFor: updated.mediumIdentity,
      resendCount: updated.resendCount,
      maxResend: updated.maxResend,
      maxFailed: updated.maxFailed,
      expireInMinute: this.config.OTP_EXPIRY_SECONDS / 60,
      expireAt: updated.expireAt!,
    };
  }

  async verify(dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const record = await this.database.otp.findFirst({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
        otpGenerated: true,
        otpVerified: false,
        expireAt: {
          gt: new Date(Date.now()),
        },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid request');
    }

    if (record.failedCount >= record.maxFailed) {
      throw new BadRequestException('Max failed reached');
    }

    const otpHash = getHash(dto.otp, dto.verificationToken);

    if (otpHash != record.otpHash) {
      await this.database.otp.update({
        where: {
          ownerId: dto.ownerId,
          verificationToken: dto.verificationToken,
        },
        data: {
          failedCount: record.failedCount + 1,
        },
      });

      throw new BadRequestException('Invalid otp');
    }

    const updated = record.ackRequired
      ? await this.database.otp.update({
          where: {
            ownerId: dto.ownerId,
            verificationToken: dto.verificationToken,
          },
          data: {
            otpVerified: true,
            ackId: this.snowflake.generate(),
            ackUsed: false,
            ackExpireAt: new Date(
              Date.now() + this.config.OTP_ACK_EXPIRY_SECONDS * 1000,
            ),
          },
        })
      : await this.database.otp.update({
          where: {
            ownerId: dto.ownerId,
            verificationToken: dto.verificationToken,
          },
          data: {
            otpVerified: true,
          },
        });

    return {
      verified: true,
      ownerId: updated.ownerId,
      purpose: updated.purpose,
      ackRequired: updated.ackRequired,
      ackId: updated.ackId,
      ackExpireInMinute: this.config.OTP_ACK_EXPIRY_SECONDS / 60,
      ackExpireAt: updated.ackExpireAt,
      verifiedAt: updated.updatedAt,
      expireAt: updated.expireAt!,
    };
  }

  async verifyAndGenerateTokens(dto: VerifyOtpDto): Promise<UTokenResponse> {
    const record = await this.database.otp.findFirst({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
        otpGenerated: true,
        otpVerified: false,
        expireAt: {
          gt: new Date(Date.now()),
        },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid request');
    }

    if (record.failedCount >= record.maxFailed) {
      throw new BadRequestException('Max failed reached');
    }

    const otpHash = getHash(dto.otp, dto.verificationToken);

    if (otpHash != record.otpHash) {
      await this.database.otp.update({
        where: {
          ownerId: dto.ownerId,
          verificationToken: dto.verificationToken,
        },
        data: {
          failedCount: record.failedCount + 1,
        },
      });

      throw new BadRequestException('Invalid otp');
    }

    const updated = await this.database.otp.update({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
      },
      data: {
        otpVerified: true,
      },
      include: {
        owner: {
          include: {
            shop: {
              select: {
                id: true,
                shopName: true,
                uploadToken: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          select: {
            email: true,
            name: true,
            verified: true,
          },
        },
      },
    });

    if (!updated.owner.shop) {
      throw new ForbiddenException('Owner does not have any shop');
    }

    const accessTokenExpireAt = new Date(
      Date.now() + this.config.ACCESS_TOKEN_MAX_AGE_SECOND * 1000,
    );

    const refreshTokenExpireAt = new Date(
      Date.now() + this.config.REFRESH_TOKEN_MAX_AGE_SECOND * 1000,
    );

    const accessToken = await this.jwtService.signAsync<JWTPayload>(
      {
        ownerId: updated.ownerId,
        ownerName: updated.owner.name,
        ownerEmail: updated.owner.email,
        verified: updated.owner.verified,
        shopId: updated.owner.shop.id,
        shopName: updated.owner.shop.shopName,
        uploadToken: updated.owner.shop.uploadToken,
      },
      {
        algorithm: 'HS256',
        issuer: this.config.DOMAIN,
        expiresIn: this.config.ACCESS_TOKEN_MAX_AGE_SECOND,
        secret: this.config.JWT_SECRET,
      },
    );
    const refreshToken = getRandomHex(32);

    await this.database.shopOwner.update({
      where: {
        id: updated.ownerId,
      },
      data: {
        token: {
          upsert: {
            create: {
              refreshToken,
              refreshTokenExpireAt,
            },
            update: {
              refreshToken,
              refreshTokenExpireAt,
            },
          },
        },
      },
    });

    return {
      ownerId: updated.ownerId,
      ownerName: updated.owner.name,
      ownerEmail: updated.owner.email,
      verified: updated.owner.verified,
      otpRequired: updated.owner.otpRequired,
      otpGenerated: updated.otpGenerated,
      otpVerificationKey: updated.verificationToken,
      shopId: updated.owner.shop.id,
      shopName: updated.owner.shop.shopName,
      uploadToken: updated.owner.shop.uploadToken,
      tokens: {
        type: 'Bearer',
        accessToken,
        refreshToken,
        accessTokenExpireAt,
        refreshTokenExpireAt,
        accessTokenMaxAge: this.config.ACCESS_TOKEN_MAX_AGE_SECOND,
        refreshTokenMaxAge: this.config.REFRESH_TOKEN_MAX_AGE_SECOND,
      },
      createdAt: updated.owner.shop.createdAt,
      updatedAt: updated.owner.updatedAt,
    };
  }

  async verifyAndActivateSession(
    dto: VerifyOtpDto,
    sessionId: string,
    sessionSecret: string,
  ): Promise<boolean> {
    const record = await this.database.otp.findFirst({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
        purpose: 'TWO_FACTOR_AUTHENTICATION',
        otpGenerated: true,
        otpVerified: false,
        expireAt: {
          gt: new Date(Date.now()),
        },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid request');
    }

    if (record.failedCount >= record.maxFailed) {
      throw new BadRequestException('Max failed reached');
    }

    const otpHash = getHash(dto.otp, dto.verificationToken);

    if (otpHash != record.otpHash) {
      await this.database.otp.update({
        where: {
          ownerId: dto.ownerId,
          verificationToken: dto.verificationToken,
        },
        data: {
          failedCount: record.failedCount + 1,
        },
      });

      throw new BadRequestException('Invalid otp');
    }

    await this.database.otp.update({
      where: {
        ownerId: dto.ownerId,
        verificationToken: dto.verificationToken,
      },
      data: {
        otpVerified: true,
      },
    });

    return await this.session.update(
      sessionId,
      { state: SessionState.ACTIVE },
      Buffer.from(sessionSecret, 'hex'),
    );
  }

  async _createRecord(
    dto: InternalCreateRecordPayload,
  ): Promise<{ ownerId: string; verificationToken: string }> {
    return await this.database.otp.create({
      data: {
        id: this.snowflake.generate(),
        ownerId: dto.ownerId,
        ackRequired: dto.ackRequired,
        purpose: dto.purpose,
        maxFailed: dto.maxFailed,
        maxResend: dto.maxResend,
        medium: dto.medium,
        mediumIdentity: dto.mediumIdentity,
        verificationToken: getRandomBase64Url(16),
      },
      select: {
        ownerId: true,
        verificationToken: true,
      },
    });
  }
}
