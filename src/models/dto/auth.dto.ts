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
  token: Token | null;
  createdAt: Date;
  updatedAt: Date;
}

class Token {
  type: string;
  accessToken: string;
  accessTokenExpireAt: Date;
  refreshToken: string;
  refreshTokenExpireAt: Date;
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
