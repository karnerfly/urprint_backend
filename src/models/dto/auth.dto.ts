import { IsEmail, IsNotEmpty, IsString, IsBoolean } from 'class-validator';

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
  tokens: Tokens;
  createdAt: Date;
  updatedAt: Date;
}

export class USessionResponse {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  verified: boolean;
  sessionActivated: boolean;
  otpRequired: boolean;
  otpGenerated: boolean | null;
  otpVerificationKey: string | null;
  shopId: string;
  shopName: string;
  uploadToken: string;
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

  @IsBoolean({ message: 'must be a boolean value' })
  webClient: boolean;
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

export class LogoutResponse {
  status: string;
}

export class CsrfResponse {
  cookieName: string;
  headerName: string;
  value: string;
}

export class EmailExistsResponse {
  status: string;
  exists: boolean;
}

export class InternalRefreshTokenPayload {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  verified: boolean;
  shopId: string;
  shopName: string;
  uploadToken: string;
  otpRequired: boolean;
  otpGenerated: boolean | null;
  otpVerificationKey: string | null;
  tokenType: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InternalCreateSessionPayload {
  ownerId: string;
  otpRequired: boolean;
  verified: boolean;
  shopId: string;
  uploadToken: string;
  ownerName: string;
  ownerEmail: string;
  shopName: string;
  state: SessionState;
  ip: string;
  deviceId: string | null;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum SessionState {
  DEACTIVE,
  ACTIVE,
  BLOCKED,
}

export type Session = {
  ownerId: string;
  otpRequired: boolean;
  verified: boolean;
  shopId: string;
  uploadToken: string;
  profile: {
    ownerName: string;
    ownerEmail: string;
    shopName: string;
  };
  ip: string;
  deviceId: string | null;
  userAgent: string;
  state: SessionState;
  iat: number;
  exp: number;
};

export type UpdateSessionPayload = Partial<Session>;
