import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() profilePicture?: string;
}
