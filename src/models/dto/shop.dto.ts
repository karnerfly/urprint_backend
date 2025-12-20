import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from './tools';

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
  @Match('password', { message: 'confirm password did not match' })
  confirmPassword: string;
}
