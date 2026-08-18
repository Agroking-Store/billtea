import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateThemeSettingsDto } from './dto/update-theme-settings.dto';

@Injectable()
export class ThemeSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(companyId: string) {
    let settings = await this.prisma.themeSettings.findUnique({
      where: { companyId },
    });
    if (!settings) {
      settings = await this.prisma.themeSettings.create({
        data: { companyId },
      });
    }
    return settings;
  }

  async updateSettings(companyId: string, dto: UpdateThemeSettingsDto) {
    const data: any = {};
    if (dto.lightTheme !== undefined) data.lightTheme = dto.lightTheme;
    if (dto.darkTheme !== undefined) data.darkTheme = dto.darkTheme;

    return this.prisma.themeSettings.upsert({
      where: { companyId },
      update: data,
      create: {
        companyId,
        ...data,
      },
    });
  }
}
