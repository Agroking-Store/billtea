import { Controller, Post, Get, Put, Body, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SetupCompanyDto } from './dto/setup-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post('setup')
  async setup(
    @CurrentUser('userId') userId: string,
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: SetupCompanyDto,
  ) {
    return this.companyService.setup(userId, companyId, dto);
  }

  @Get()
  async getCompany(@CurrentUser('companyId') companyId: string | null) {
    return this.companyService.getCompany(companyId);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  async updateCompany(
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(companyId, dto);
  }
}
