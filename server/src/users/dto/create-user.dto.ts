import { IsString, IsEmail, IsEnum, IsOptional, IsArray, MinLength, Matches } from 'class-validator';

export class CreateUserDto {
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

  @IsEnum(['MANAGER', 'STAFF'], { message: 'Role must be either "MANAGER" or "STAFF"' })
  role: 'MANAGER' | 'STAFF';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branches?: string[];
}
