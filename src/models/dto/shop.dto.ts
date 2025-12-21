import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
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

export class ShopUploadsResponse {
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
