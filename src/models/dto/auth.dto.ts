import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UTokenResponse {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  verified: boolean;
  otpRequired: boolean;
  otpGenerated: boolean | null;
  otpVerificationKey: string | null;
  shopId: string;
  shopName: string;
  uploadToken: string;
  tokens: Tokens | null;
  createdAt: Date;
  updatedAt: Date;
}

class Tokens {
  type: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpireAt: Date;
  refreshTokenExpireAt: Date;
  accessTokenMaxAge: number;
  refreshTokenMaxAge: number;
}

export class LoginDto {
  @IsString({ message: 'must be a valid string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  @IsEmail({}, { message: 'must be a valid email' })
  email: string;

  @IsString({ message: 'must be a valid string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  password: string;
}

export interface JWTPayload {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  verified: boolean;
  shopId: string;
  shopName: string;
  uploadToken: string;
}
