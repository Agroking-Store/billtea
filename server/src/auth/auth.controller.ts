import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
    @ApiOperation({ summary: 'Register' })
    @ApiResponse({ status: 201, description: 'Created successfully.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login' })
    @ApiResponse({ status: 201, description: 'Created successfully.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh' })
    @ApiResponse({ status: 201, description: 'Created successfully.' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }
}
