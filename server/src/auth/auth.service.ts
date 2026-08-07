import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { processAndSaveImage } from '../common/utils/image.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Simple in-memory cache for mock OTPs
  private otpCache = new Map<string, string>();
  private forgotPasswordCache = new Map<string, { otp: string; expiresAt: number; verified?: boolean }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async checkDuplicate(email?: string, phoneNumber?: string) {
    const conditions: any[] = [];
    if (phoneNumber) conditions.push({ phoneNumber });
    if (email) conditions.push({ email: email.toLowerCase().trim() });

    if (conditions.length === 0) {
      return { success: true, message: 'No duplicates found.' };
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: conditions },
    });

    if (existing) {
      const field = existing.phoneNumber === phoneNumber ? 'phone number' : 'email';
      throw new ConflictException(`An account with this ${field} already exists.`);
    }

    return { success: true, message: 'No duplicates found.' };
  }

  private async sendEmailOtp(
    email: string, 
    otp: string, 
    subjectTitle = 'BillTea Account Verification',
    title = 'BillTea Account Verification'
  ) {
    const host = this.config.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.config.get<number>('SMTP_PORT', 587);
    const user = this.config.get<string>('SMTP_USER', '');
    const pass = this.config.get<string>('SMTP_PASS', '');
    const from = this.config.get<string>('SMTP_FROM', user ? `BillTea <${user}>` : 'BillTea <noreply@billtea.com>');

    this.logger.log(`\n=========================================\n📧 EMAIL OTP FOR (${email}): ${otp}\n=========================================`);

    if (!user || !pass || user === 'your_email@gmail.com' || pass === 'your_gmail_app_password') {
      this.logger.warn(`SMTP credentials not configured in server/.env (SMTP_USER / SMTP_PASS). OTP logged above to terminal.`);
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from,
        to: email,
        replyTo: user,
        subject: `${otp} is your ${subjectTitle}`,
        text: `Your ${subjectTitle} code is ${otp}. This code is valid for 10 minutes. If you did not request this code, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
            <h2 style="color: #0284c7; text-align: center; margin-bottom: 20px;">${title}</h2>
            <p style="font-size: 15px; color: #333333; line-height: 1.5;">Hello,</p>
            <p style="font-size: 15px; color: #333333; line-height: 1.5;">Your 6-digit verification code for your BillTea account is:</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; background: #f0f9ff; padding: 12px 28px; border-radius: 8px; border: 1px dashed #0284c7; display: inline-block;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #666666; line-height: 1.4;">This code is valid for 10 minutes. Please do not share this OTP with anyone.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} BillTea Portal. All rights reserved.</p>
          </div>
        `,
        priority: 'high',
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
        },
      });

      this.logger.log(`Successfully sent OTP email to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
    }
  }

  async sendOtp(email: string, phoneNumber?: string) {
    if (!email) {
      throw new BadRequestException('Email is required to send OTP.');
    }
    const normalizedEmail = email.toLowerCase().trim();
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in cache for verification
    this.otpCache.set(normalizedEmail, emailOtp);

    // Send email using Nodemailer
    await this.sendEmailOtp(normalizedEmail, emailOtp);

    return { success: true, message: 'OTP sent to your email successfully.' };
  }

  async verifyOtp(emailOtp: string, mobileOtp?: string, email?: string) {
    const validOtps = Array.from(this.otpCache.values());

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const cachedOtp = this.otpCache.get(normalizedEmail);
      if (cachedOtp && cachedOtp === emailOtp) {
        this.otpCache.delete(normalizedEmail);
        return { success: true, message: 'Email OTP verified successfully.' };
      }
    }

    if (validOtps.includes(emailOtp)) {
      return { success: true, message: 'Email OTP verified successfully.' };
    }

    throw new BadRequestException('Invalid or expired email OTP.');
  }

  async sendForgotPasswordOtp(email: string) {
    if (!email) {
      throw new BadRequestException('Email address is required.');
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Verify user exists in database
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('No account found with this email address.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated. Please contact support.');
    }

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.forgotPasswordCache.set(normalizedEmail, { otp: emailOtp, expiresAt });

    await this.sendEmailOtp(
      normalizedEmail, 
      emailOtp, 
      'BillTea Password Reset Code', 
      'BillTea Password Reset'
    );

    return { success: true, message: 'Password reset OTP sent to your email address.' };
  }

  async verifyForgotPasswordOtp(email: string, otp: string) {
    if (!email || !otp) {
      throw new BadRequestException('Email and OTP are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cached = this.forgotPasswordCache.get(normalizedEmail);

    if (!cached || Date.now() > cached.expiresAt) {
      throw new BadRequestException('OTP has expired or is invalid. Please request a new code.');
    }

    if (cached.otp !== otp.trim()) {
      throw new BadRequestException('Invalid verification code. Please check and try again.');
    }

    cached.verified = true;
    return { success: true, message: 'OTP verified successfully.' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    if (!email || !otp || !newPassword) {
      throw new BadRequestException('Email, OTP, and new password are required.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cached = this.forgotPasswordCache.get(normalizedEmail);

    if (!cached || Date.now() > cached.expiresAt || cached.otp !== otp.trim()) {
      throw new BadRequestException('Invalid or expired session. Please restart the password reset process.');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Clear cache after successful reset
    this.forgotPasswordCache.delete(normalizedEmail);

    return { success: true, message: 'Password updated successfully. You can now log in.' };
  }

  async registerFull(
    dto: any,
    files: { profilePicture?: Express.Multer.File[]; companyLogo?: Express.Multer.File[] },
  ) {
    const phone = dto.phoneNumber || dto.mobileNumber;
    await this.checkDuplicate(dto.email, phone);

    // Process files if present
    let profilePictureUrl = '';
    if (files?.profilePicture?.[0]) {
      profilePictureUrl = await processAndSaveImage(files.profilePicture[0], 'profiles');
    }

    let companyLogoUrl = '';
    if (files?.companyLogo?.[0]) {
      companyLogoUrl = await processAndSaveImage(files.companyLogo[0], 'logos');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    let parsedTaxes = [];
    if (dto.taxes) {
      try {
        parsedTaxes = typeof dto.taxes === 'string' ? JSON.parse(dto.taxes) : dto.taxes;
      } catch (e) {
        this.logger.error('Failed to parse taxes', e);
      }
    }

    let parsedIdentifiers: any[] = [];
    if (dto.businessIdName && dto.businessIdNumber) {
      parsedIdentifiers = [{ name: dto.businessIdName, value: dto.businessIdNumber }];
    }

    // Prisma Transaction to create User, Company, and Branch
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          logo: companyLogoUrl,
          tagline: dto.tagline || '',
          identifiers: parsedIdentifiers,
        },
      });

      // 2. Create Branch
      const branch = await tx.branch.create({
        data: {
          companyId: company.id,
          name: dto.branchName,
          isMainBranch: true,
          address: dto.address || '',
          city: dto.city || '',
          state: dto.state || '',
          pincode: dto.pincode || '',
          phone: dto.branchPhone || '',
          email: dto.branchEmail || '',
          bankName: dto.bankName || '',
          accountName: dto.accountName || '',
          accountNumber: dto.accountNumber || '',
          ifscCode: dto.ifscCode || '',
          upiId: dto.upiId || '',
          signatureValue: dto.signatureText || '',
          taxes: parsedTaxes,
        },
      });

      // 3. Create User linked to Company AND Branch
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email.toLowerCase().trim(),
          phoneNumber: phone,
          password: hashedPassword,
          profilePicture: profilePictureUrl,
          role: 'OWNER',
          companyId: company.id,
          branches: {
            connect: [{ id: branch.id }], // Connects user to created branch
          },
        },
      });

      // 4. Create default Company Usage tracking
      await tx.companyUsage.create({
        data: { companyId: company.id },
      });

      // 5. Assign Trial Subscription Plan if available
      const trialPlan = await tx.subscriptionPlan.findFirst({
        where: { rank: 'TRIAL', isActive: true },
      });

      if (trialPlan) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14); // 14-day trial

        await tx.companySubscription.create({
          data: {
            companyId: company.id,
            planId: trialPlan.id,
            status: 'TRIAL',
            startDate: new Date(),
            expiryDate: expiryDate,
          },
        });
      }

      return { user, company, branch };
    });

    const tokens = await this.generateTokens(
      result.user.id,
      result.user.role,
      result.company.id,
      [result.branch.id],
    );

    return {
      success: true,
      message: 'Registration successful.',
      ...tokens,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        profilePicture: result.user.profilePicture,
        role: result.user.role,
        companyId: result.company.id,
        branches: [result.branch.id],
      },
    };
  }

  async login(dto: LoginDto) {
    if (!dto.phoneNumber && !dto.email) {
      throw new BadRequestException('Phone number or email is required.');
    }

    if (!dto.password && !dto.otp) {
      throw new BadRequestException('Password or OTP is required.');
    }

    const user = await this.prisma.user.findFirst({
      where: dto.email
        ? { email: dto.email.toLowerCase().trim() }
        : { phoneNumber: dto.phoneNumber },
      include: { branches: { select: { id: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('No account found with these credentials.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated. Contact your administrator.');
    }

    if (dto.password) {
      const isMatch = await bcrypt.compare(dto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Incorrect password. Please try again.');
      }
    } else if (dto.otp) {
      const targetKey = dto.email
        ? `email:${dto.email.toLowerCase().trim()}`
        : `phone:${dto.phoneNumber}`;

      const cached = this.otpCache.get(targetKey);
      if (!cached || cached.expiresAt < Date.now() || cached.code !== dto.otp) {
        throw new UnauthorizedException('Invalid or expired OTP.');
      }
      this.otpCache.delete(targetKey);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const branchIds = user.branches.map((b) => b.id);
    const tokens = await this.generateTokens(user.id, user.role, user.companyId, branchIds);

    return {
      success: true,
      message: 'Login successful.',
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        companyId: user.companyId,
        branches: branchIds,
      },
    };
  }

  async refresh(dto: RefreshDto) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: { include: { branches: { select: { id: true } } } },
      },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Refresh token is invalid or expired. Please login again.');
    }

    if (!stored.user.isActive) {
      throw new ForbiddenException('Your account has been deactivated.');
    }

    // FIXED: Properly closed the object bracket before parenthetical closing
    await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });

    const branchIds = stored.user.branches.map((b) => b.id);
    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.role,
      stored.user.companyId,
      branchIds,
    );

    return {
      success: true,
      message: 'Token refreshed successfully.',
      ...tokens,
    };
  }

  private async generateTokens(
    userId: string,
    role: string,
    companyId: string | null,
    branches: string[],
  ) {
    const payload = { sub: userId, role, companyId, branches };
    const accessToken = this.jwtService.sign(payload);
    const refreshTokenValue = uuidv4();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const expiresAt = this.calculateExpiry(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: { token: refreshTokenValue, userId, expiresAt },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const msMap: Record<string, number> = {
      d: 24 * 60 * 60 * 1000,
      h: 60 * 60 * 1000,
      m: 60 * 1000,
      s: 1000,
    };

    return new Date(Date.now() + value * (msMap[unit] || msMap.d));
  }
}