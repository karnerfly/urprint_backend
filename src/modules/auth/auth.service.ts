import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcryptjs from 'bcryptjs';
import { DatabaseService } from 'src/common/database/database.service';
import { getRandomHex } from 'src/common/utils/random';
import { JWTPayload, LoginDto, UTokenResponse } from 'src/models/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private database: DatabaseService,
    private jwtService: JwtService,
  ) {}

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

    const accessToken = await this.jwtService.signAsync<JWTPayload>(
      {
        ownerId: record.id,
        ownerName: record.name,
        ownerEmail: record.email,
        verified: record.verified,
        shopId: record.shop.id,
        shopName: record.shop.shopName,
        uploadToken: record.shop.uploadToken,
      },
      {
        algorithm: 'HS256',
        issuer: this.config.getOrThrow<string>('DOMAIN'),
        expiresIn: this.config.getOrThrow<number>('ACCESS_TOKEN_EXPIRY'),
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      },
    );
    const refreshToken = getRandomHex(32);

    const accessTokenExpireAt = new Date(Date.now() + 5 * 60000);
    const refreshTokenExpireAt = new Date(Date.now() + 15 * 24 * 60 * 60000);

    await this.database.ownerToken.update({
      data: {
        refreshToken,
        refreshTokenExpireAt,
      },
      where: {
        ownerId: record.id,
      },
    });

    return {
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
      token: {
        type: 'Bearer',
        accessToken,
        refreshToken,
        accessTokenExpireAt,
        refreshTokenExpireAt,
      },
      createdAt: record.shop.createdAt,
      updatedAt: record.updatedAt,
    };
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

    const newAccessToken = await this.jwtService.signAsync<JWTPayload>(
      {
        ownerId: record.ownerId,
        ownerName: record.owner.name,
        ownerEmail: record.owner.email,
        verified: record.owner.verified,
        shopId: record.owner.shop.id,
        shopName: record.owner.shop.shopName,
        uploadToken: record.owner.shop.uploadToken,
      },
      {
        algorithm: 'HS256',
        issuer: this.config.getOrThrow<string>('DOMAIN'),
        expiresIn: this.config.getOrThrow<number>('ACCESS_TOKEN_EXPIRY'),
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      },
    );
    const newRefreshToken = getRandomHex(32);

    const accessTokenExpireAt = new Date(Date.now() + 5 * 60000);
    const refreshTokenExpireAt = new Date(Date.now() + 15 * 24 * 60 * 60000);

    await this.database.ownerToken.update({
      where: {
        ownerId: record.ownerId,
      },
      data: {
        refreshToken: newRefreshToken,
        refreshTokenExpireAt,
      },
    });

    return {
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
      token: {
        type: 'Bearer',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        accessTokenExpireAt,
        refreshTokenExpireAt,
      },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
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
}
