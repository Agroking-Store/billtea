import { IsString, IsEmail, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Full name must be at least 3 characters' })
  fullName: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' })
  phoneNumber: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
