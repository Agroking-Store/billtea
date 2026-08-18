import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ThemeSettingsService } from './theme-settings.service';
import { UpdateThemeSettingsDto } from './dto/update-theme-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('theme-settings')
@UseGuards(JwtAuthGuard)
export class ThemeSettingsController {
  constructor(private readonly themeSettingsService: ThemeSettingsService) {}

  @Get(':companyId')
  async getSettings(@Param('companyId') companyId: string) {
    const settings = await this.themeSettingsService.getSettings(companyId);
    return { success: true, settings };
  }

  @Put(':companyId')
  async updateSettings(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateThemeSettingsDto,
  ) {
    const settings = await this.themeSettingsService.updateSettings(companyId, dto);
    return { success: true, settings };
  }
}
