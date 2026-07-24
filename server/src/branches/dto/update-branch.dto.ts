import { IsString, IsOptional, MinLength, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateBranchDto {
  @IsOptional() @IsString() @MinLength(2) @ApiPropertyOptional({ example: 'John Doe' }) name?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) address?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) city?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) state?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) pincode?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: '9876543210' }) phone?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'john@gmail.com' }) email?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'John Doe' }) bankName?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) accountNumber?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) ifscCode?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' }) upiId?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) signatureValue?: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Tax cannot be less than 0' })
  @Max(100, { message: 'Tax cannot be more than 100' })
    @ApiPropertyOptional({ example: 100 })
  tax?: number;

  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) quotationTheme?: string;
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'sample_value' }) themeColor?: string;
  
  @IsOptional() @IsString() @ApiPropertyOptional({ example: 'GST' }) taxLabel?: string;
  @IsOptional() @IsBoolean() @ApiPropertyOptional({ example: false }) isMainBranch?: boolean;
  @IsOptional() @IsBoolean() @ApiPropertyOptional({ example: true }) isActive?: boolean;
}
