import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('check-duplicate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if email or phone is already registered' })
  async checkDuplicate(@Body() dto: { email: string; phoneNumber: string }) {
    return this.authService.checkDuplicate(dto.email, dto.phoneNumber);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mock Send OTP' })
  async sendOtp(@Body() dto: { email: string; phoneNumber: string }) {
    return this.authService.sendOtp(dto.email, dto.phoneNumber);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mock Verify OTP' })
  async verifyOtp(@Body() dto: { emailOtp: string; mobileOtp: string }) {
    return this.authService.verifyOtp(dto.emailOtp, dto.mobileOtp);
  }

  @Post('register')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 }
  ]))
  @ApiOperation({ summary: 'Register with company and branch details' })
  @ApiResponse({ status: 201, description: 'Created successfully.' })
  async register(
    @Body() dto: any, 
    @UploadedFiles() files: { profilePicture?: Express.Multer.File[], companyLogo?: Express.Multer.File[] }
  ) {
    return this.authService.registerFull(dto, files);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Logged in successfully.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh' })
  @ApiResponse({ status: 200, description: 'Refreshed successfully.' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }
}
