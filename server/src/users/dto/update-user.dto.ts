import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, IsArray, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(3) fullName?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(['MANAGER', 'STAFF']) role?: 'MANAGER' | 'STAFF';
  @IsOptional() @IsArray() @IsString({ each: true }) branches?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}
