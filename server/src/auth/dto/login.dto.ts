import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class LoginDto {
  @IsOptional()
  @IsString()
    @ApiPropertyOptional({ example: '9876543210' })
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
    @ApiPropertyOptional({ example: 'john@gmail.com' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
    @ApiPropertyOptional({ example: 'password123' })
  password?: string;

  @IsOptional()
  @IsString()
    @ApiPropertyOptional({ example: '123456' })
  otp?: string;
}

