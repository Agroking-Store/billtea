import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @MinLength(2, { message: 'Branch name must be at least 2 characters' })
  name: string;

  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() accountNumber?: string;
  @IsOptional() @IsString() ifscCode?: string;
  @IsOptional() @IsString() upiId?: string;
  @IsOptional() @IsEnum(['TEXT', 'IMAGE']) signatureType?: 'TEXT' | 'IMAGE';
  @IsOptional() @IsString() signatureValue?: string;
}
