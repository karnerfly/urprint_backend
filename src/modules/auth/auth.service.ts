import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcryptjs from 'bcryptjs';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import { DatabaseService } from 'src/common/database/database.service';
import { SessionService } from 'src/common/session/session.service';
import { getRandomHex } from 'src/common/utils/random';
import {
  InternalRefreshTokenPayload,
  JWTPayload,
  LoginDto,
  Session,
  SessionState,
  USessionResponse,
  UTokenResponse,
} from 'src/models/dto/auth.dto';
import crypto from 'node:crypto';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class AuthV1Service {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async emailExists(email: string): Promise<boolean> {
    const exists = await this.database.shopOwner.count({
      where: { email },
    });
    return exists > 0;
  }

  async login(dto: LoginDto): Promise<UTokenResponse> {
    const record = await this.database.shopOwner.findUnique({
      where: {
        email: dto.email,
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
    });

    if (!record || !record.shop) {
      throw new BadRequestException('Invalid credentials');
    }

    const matched = await bcryptjs.compare(dto.password, record.passwordHash);

    if (!matched) {
      throw new BadRequestException('Invalid credentials');
    }

    return await this._refreshTokens({
      ownerId: record.id,
      ownerName: record.name,
      ownerEmail: record.email,
      verified: record.verified,
      otpRequired: record.otpRequired,
      otpGenerated: false,
      otpVerificationKey: null,
      shopId: record.shop.id,
      shopName: record.shop.shopName,
      uploadToken: record.shop.uploadToken,
      tokenType: 'Bearer',
      createdAt: record.shop.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async refreshTokens(refreshToken: string): Promise<UTokenResponse> {
    const record = await this.database.ownerToken.findFirst({
      where: {
        refreshToken,
        refreshTokenExpireAt: {
          gt: new Date(),
        },
      },
      include: {
        owner: {
          include: {
            shop: {
              select: {
                id: true,
                shopName: true,
                uploadToken: true,
              },
            },
          },
          omit: {
            passwordHash: true,
            passwordSalt: true,
          },
        },
      },
    });

    if (!record || !record.owner || !record.owner.shop) {
      throw new ForbiddenException('Invalid request');
    }

    return await this._refreshTokens({
      ownerId: record.ownerId,
      ownerName: record.owner.name,
      ownerEmail: record.owner.email,
      verified: record.owner.verified,
      otpRequired: record.owner.otpRequired,
      otpGenerated: false,
      otpVerificationKey: null,
      shopId: record.owner.shop.id,
      shopName: record.owner.shop.shopName,
      uploadToken: record.owner.shop.uploadToken,
      tokenType: 'Bearer',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async logout(ownerId: string): Promise<void> {
    const record = await this.database.ownerToken.updateMany({
      where: {
        ownerId,
        refreshTokenExpireAt: {
          gt: new Date(),
        },
      },
      data: {
        refreshToken: null,
        refreshTokenExpireAt: null,
      },
    });

    if (!record) {
      throw new ForbiddenException('Invalid request');
    }
  }

  async _refreshTokens(
    payload: InternalRefreshTokenPayload,
  ): Promise<UTokenResponse> {
    const accessTokenExpireAt = new Date(
      Date.now() + this.config.ACCESS_TOKEN_MAX_AGE_SECOND * 1000,
    );

    const refreshTokenExpireAt = new Date(
      Date.now() + this.config.REFRESH_TOKEN_MAX_AGE_SECOND * 1000,
    );

    const accessToken = await this.jwtService.signAsync<JWTPayload>(
      {
        ownerId: payload.ownerId,
        ownerName: payload.ownerName,
        ownerEmail: payload.ownerEmail,
        verified: payload.verified,
        shopId: payload.shopId,
        shopName: payload.shopName,
        uploadToken: payload.uploadToken,
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
        id: payload.ownerId,
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
      ownerId: payload.ownerId,
      ownerName: payload.ownerName,
      ownerEmail: payload.ownerEmail,
      verified: payload.verified,
      otpRequired: payload.otpRequired,
      otpGenerated: payload.otpGenerated,
      otpVerificationKey: payload.otpVerificationKey,
      shopId: payload.shopId,
      shopName: payload.shopName,
      uploadToken: payload.uploadToken,
      tokens: {
        type: payload.tokenType,
        accessToken,
        refreshToken,
        accessTokenExpireAt,
        refreshTokenExpireAt,
        accessTokenMaxAge: this.config.ACCESS_TOKEN_MAX_AGE_SECOND,
        refreshTokenMaxAge: this.config.REFRESH_TOKEN_MAX_AGE_SECOND,
      },
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    };
  }
}

@Injectable()
export class AuthV2Service {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly database: DatabaseService,
    private readonly otpService: OtpService,
    private readonly session: SessionService,
  ) {}

  async emailExists(email: string): Promise<boolean> {
    const exists = await this.database.shopOwner.count({
      where: { email },
    });
    return exists > 0;
  }

  async login(
    dto: LoginDto,
    ip: string,
    userAgent: string,
    deviceId: string | null,
  ): Promise<{
    response: USessionResponse;
    sessionId: string;
    sessionSecret: string;
  }> {
    const record = await this.database.shopOwner.findUnique({
      where: {
        email: dto.email,
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
    });

    if (!record || !record.shop) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!record.verified) {
      throw new BadRequestException('User is not verified');
    }

    const matched = await bcryptjs.compare(dto.password, record.passwordHash);

    if (!matched) {
      throw new BadRequestException('Invalid credentials');
    }

    const now = Date.now();
    const sessionId = getRandomHex(32);
    const sessionSecret = getRandomHex(32);

    const state = record.otpRequired
      ? SessionState.DEACTIVE
      : SessionState.ACTIVE;

    const payload: Session = {
      state,
      ownerId: record.id,
      shopId: record.shop.id,
      otpRequired: record.otpRequired,
      uploadToken: record.shop.uploadToken,
      verified: record.verified,
      profile: {
        ownerName: record.name,
        ownerEmail: record.email,
        shopName: record.shop.shopName,
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

    let otpVerificationKey: string | null = null;

    if (record.otpRequired) {
      const { verificationToken } = await this.otpService._createRecord({
        ackRequired: false,
        maxFailed: 3,
        maxResend: 3,
        medium: 'EMAIL',
        mediumIdentity: record.email,
        ownerId: record.id,
        purpose: 'TWO_FACTOR_AUTHENTICATION',
      });
      otpVerificationKey = verificationToken;
    }

    return {
      sessionId,
      sessionSecret,
      response: {
        ownerId: record.id,
        ownerName: record.name,
        ownerEmail: record.email,
        verified: record.verified,
        otpRequired: record.otpRequired,
        otpGenerated: false,
        otpVerificationKey,
        shopId: record.shop.id,
        shopName: record.shop.shopName,
        uploadToken: record.shop.uploadToken,
        createdAt: record.shop.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.session.del(sessionId);
  }

  async getDetails(ownerId: string): Promise<USessionResponse> {
    const me = await this.database.shopOwner.findUnique({
      where: {
        id: ownerId,
      },
      include: {
        shop: {},
      },
      omit: {
        passwordHash: true,
        passwordSalt: true,
      },
    });

    if (!me || !me.shop) {
      throw new UnauthorizedException();
    }

    return {
      ownerId: me.id,
      ownerName: me.name,
      ownerEmail: me.email,
      verified: me.verified,
      otpRequired: me.otpRequired,
      otpGenerated: false,
      otpVerificationKey: null,
      shopId: me.shop.id,
      shopName: me.shop.shopName,
      uploadToken: me.shop.uploadToken,
      createdAt: me.shop.createdAt,
      updatedAt: me.updatedAt,
    };
  }
}
