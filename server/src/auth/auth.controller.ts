import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { SendForgotPasswordOtpDto, VerifyForgotPasswordOtpDto, ResetPasswordDto } from './dto/forgot-password.dto';

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
  @ApiOperation({ summary: 'Send Email OTP via Nodemailer' })
  async sendOtp(@Body() dto: { email: string; phoneNumber?: string }) {
    return this.authService.sendOtp(dto.email, dto.phoneNumber);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Email OTP' })
  async verifyOtp(@Body() dto: { emailOtp: string; mobileOtp?: string; email?: string }) {
    return this.authService.verifyOtp(dto.emailOtp, dto.mobileOtp, dto.email);
  }

  @Post('forgot-password/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for password reset' })
  async sendForgotPasswordOtp(@Body() dto: SendForgotPasswordOtpDto) {
    return this.authService.sendForgotPasswordOtp(dto.email);
  }

  @Post('forgot-password/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for password reset' })
  async verifyForgotPasswordOtp(@Body() dto: VerifyForgotPasswordOtpDto) {
    return this.authService.verifyForgotPasswordOtp(dto.email, dto.otp);
  }

  @Post('forgot-password/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
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
