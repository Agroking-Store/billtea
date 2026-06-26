import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('create')
  async create(
    @CurrentUser('userId') userId: string,
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(userId, companyId, dto);
  }

  @Get()
  async findAll(@CurrentUser('companyId') companyId: string | null) {
    return this.usersService.findAll(companyId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, userId, companyId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('companyId') companyId: string | null,
  ) {
    return this.usersService.remove(id, userId, companyId);
  }
}
