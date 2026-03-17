import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Match } from './tools';
import { ColorMode, SideMode } from 'src/common/database/generated/enums';

export class CreateShopDto {
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  shopName: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  ownerName: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  @IsEmail({}, { message: 'must be a valid email' })
  email: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  @MinLength(8, { message: 'must be atleast 8 characters long' })
  password: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  @Match<CreateShopDto>('password', {
    message: 'confirm password did not match',
  })
  confirmPassword: string;
}

export class VerifyOwnerDto {
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  ownerId: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'cannot be empty' })
  ackId: string;
}

export class UpdateShopLocationDto {
  @IsOptional()
  @IsString({ message: 'must be a string' })
  street: string | null;

  @IsOptional()
  @IsString({ message: 'must be a string' })
  city: string | null;

  @IsOptional()
  @IsString({ message: 'must be a string' })
  district: string | null;

  @IsOptional()
  @IsString({ message: 'must be a string' })
  state: string | null;

  @IsOptional()
  @IsString({ message: 'must be a string' })
  pin: string | null;
}

export class AddPhoneNumberDto {
  @IsPhoneNumber('IN', { message: 'must be a valid phone number' })
  @IsNotEmpty({ message: 'cannot be empty' })
  phone: string;
}

export class DeletePhoneNumberDto {
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 })
  @IsNotEmpty({ message: 'cannot be empty' })
  @Min(1, { message: 'must be a valid phone number id' })
  phoneNumberId: number;
}

export class ShopLocationResponse {
  id: number;
  street: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pin: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ShopUploadResponse {
  uploadId: string;
  totalDocuments: number;
  completed: boolean;
  documents: ShopUploadedDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export class ShopUploadedDocument {
  id: string;
  name: string;
  mediaType: string;
  downloadable: boolean;
  noOfCopies: number;
  colorMode: ColorMode;
  sideMode: SideMode;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateOwnerResponse {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  verified: boolean;
  otpRequired: boolean;
  otpGenerated: boolean;
  otpVerificationKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DeleteOwnerResponse {
  status: string;
  ownerId: string;
}

export class DeleteLocationsResponse {
  status: string;
  locationId: number;
}

export class AddPhoneNumberResponse {
  status: string;
  phoneNumberId: number;
}

export class PhoneNumberResponse {
  ownerId: string;
  phones: { id: number; value: string }[];
}

export class DeletePhoneNumberResponse {
  status: string;
  phoneNumberId: number;
}

export class ShopPublicDetailsResponse {
  shopName: string;
  ownerName: string;
  ownerPhones: string[];
}
