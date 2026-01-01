import { IsNotEmpty, IsString, Length } from 'class-validator';
import type {
  OtpMedium,
  OtpPurpose,
} from 'src/common/database/generated/enums';

export class GenerateOtpDto {
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  ownerId: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  verificationToken: string;
}

export class ResendOtpDto {
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  ownerId: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  verificationToken: string;
}

export class VerifyOtpDto {
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  ownerId: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  verificationToken: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  @Length(6, 6, { message: 'should be 6 characters long' })
  otp: string;
}

export class InternalCreateRecordPayload {
  ownerId: string;
  purpose: OtpPurpose;
  medium: OtpMedium;
  maxFailed: number;
  maxResend: number;
  mediumIdentity: string;
  ackRequired: boolean;
}

export class GenerateOtpResponse {
  generated: boolean;
  ownerId: string;
  purpose: OtpPurpose;
  medium: OtpMedium;
  generatedFor: string;
  maxResend: number;
  maxFailed: number;
  expireInMinute: number;
  expireAt: Date;
  createdAt: Date;
}

export class ResendOtpResponse {
  resent: boolean;
  ownerId: string;
  purpose: OtpPurpose;
  medium: OtpMedium;
  resentFor: string;
  resendCount: number;
  maxResend: number;
  maxFailed: number;
  expireInMinute: number;
  expireAt: Date;
}

export class VerifyOtpResponse {
  verified: boolean;
  verifiedAt: Date;
  ownerId: string;
  purpose: OtpPurpose;
  ackRequired: boolean;
  ackId: string | null;
  ackExpireInMinute: number | null;
  ackExpireAt: Date | null;
  expireAt: Date;
}
