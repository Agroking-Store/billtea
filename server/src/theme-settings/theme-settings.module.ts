import { Module } from '@nestjs/common';
import { ThemeSettingsController } from './theme-settings.controller';
import { ThemeSettingsService } from './theme-settings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ThemeSettingsController],
  providers: [ThemeSettingsService],
  exports: [ThemeSettingsService],
})
export class ThemeSettingsModule {}
