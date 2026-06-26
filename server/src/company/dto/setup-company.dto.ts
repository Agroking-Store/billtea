import { IsString, IsOptional, IsArray, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MainBranchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class SetupCompanyDto {
  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters' })
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsArray()
  identifiers?: Array<{ label: string; value: string }>;

  @IsOptional()
  @ValidateNested()
  @Type(() => MainBranchDto)
  mainBranch?: MainBranchDto;
}
