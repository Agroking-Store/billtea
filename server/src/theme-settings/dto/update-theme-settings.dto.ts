import { IsOptional, IsObject } from 'class-validator';

export class UpdateThemeSettingsDto {
  @IsOptional()
  @IsObject()
  lightTheme?: any;

  @IsOptional()
  @IsObject()
  darkTheme?: any;
}
