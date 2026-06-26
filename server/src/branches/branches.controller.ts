import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  async create(
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(companyId, dto);
  }

  @Get()
  async findAll(@CurrentUser('companyId') companyId: string | null) {
    return this.branchesService.findAll(companyId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  async update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  async remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string | null,
  ) {
    return this.branchesService.remove(id, companyId);
  }
}
