import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { ColorMode, SideMode } from 'src/common/database/generated/enums';

export class GetUploadLinkResponse {
  uploadLink: string;
  shopId: string;
  bucketKey: string;
  customerToken: string;
}

export class CompleteUploadDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 },
    { message: 'must be a number' },
  )
  @IsNotEmpty({ message: 'can not be empty' })
  @Min(1, { message: 'at least one document required' })
  @Max(20, { message: 'max 20 documents are supported' })
  noOfDocuments: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 },
    { message: 'must be a number' },
  )
  @IsNotEmpty({ message: 'can not be empty' })
  @Min(5, { message: 'at least 5 minutes expiry is required' })
  @Max(20, { message: 'max 1140 minutes is supported' })
  expireInMinute: number;

  @IsArray({ message: 'must be an array' })
  @ArrayMinSize(1, { message: 'at least one document required' })
  @ArrayMaxSize(20, { message: 'max 20 documents are supported' })
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents: DocumentDto[];
}

export class DocumentDto {
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'can not be empty' })
  name: string;

  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'can not be empty' })
  mediaType: string;

  @IsBoolean({ message: 'must be a boolean' })
  @IsNotEmpty({ message: 'can not be empty' })
  downloadable: boolean;

  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 },
    { message: 'must be a number' },
  )
  @IsNotEmpty({ message: 'can not be empty' })
  @Min(1, { message: 'at least one copy required' })
  @Max(5, { message: 'max 5 copies are supported' })
  noOfCopies: number;

  @IsIn(['COLORED', 'BLACK_AND_WHITE'], { message: 'invalid color mode' })
  @IsNotEmpty({ message: 'can not be empty' })
  colorMode: ColorMode;

  @IsIn(['SINGLE', 'BOTH'], { message: 'invalid side mode' })
  @IsNotEmpty({ message: 'can not be empty' })
  sideMode: SideMode;
}

export class CompleteUploadResponse {
  uploadId: string;
  shopId: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}
