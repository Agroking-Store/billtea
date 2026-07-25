import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
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

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async checkDuplicate(email: string, phoneNumber: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber },
          { email: email?.toLowerCase().trim() },
        ],
      },
    });

    if (existing) {
      const field = existing.phoneNumber === phoneNumber ? 'phone number' : 'email';
      throw new ConflictException(`An account with this ${field} already exists.`);
    }

    return { success: true, message: 'No duplicates found.' };
  }

  async sendOtp(email: string, phoneNumber: string) {
    const emailOtp = email ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
    const mobileOtp = phoneNumber ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;

    let logMessage = `\n=========================================\n🚨 MOCK OTP GENERATED 🚨\n`;
    if (email) logMessage += `Email (${email}): ${emailOtp}\n`;
    if (phoneNumber) logMessage += `Phone (${phoneNumber}): ${mobileOtp}\n`;
    logMessage += `=========================================`;
    this.logger.log(logMessage);

    // Store in cache for verification
    if (email) this.otpCache.set(email, emailOtp!);
    if (phoneNumber) this.otpCache.set(phoneNumber, mobileOtp!);

    return { success: true, message: 'OTPs sent successfully.' };
  }

  async verifyOtp(emailOtp: string, mobileOtp: string) {
    // In a real app we'd check against the specific email/phone key.
    // For this mock, we just check if the OTP exists in the cache values.
    const validOtps = Array.from(this.otpCache.values());
    if (!validOtps.includes(emailOtp)) {
      throw new BadRequestException('Invalid email OTP.');
    }
    if (!validOtps.includes(mobileOtp)) {
      throw new BadRequestException('Invalid mobile OTP.');
    }

    return { success: true, message: 'OTPs verified successfully.' };
  }

  async registerFull(dto: any, files: { profilePicture?: Express.Multer.File[], companyLogo?: Express.Multer.File[] }) {
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
    try {
      if (dto.taxes) {
        parsedTaxes = typeof dto.taxes === 'string' ? JSON.parse(dto.taxes) : dto.taxes;
      }
    } catch (e) {
      this.logger.error('Failed to parse taxes', e);
    }
    
    let parsedIdentifiers: any[] = [];
    try {
        if(dto.businessIdName && dto.businessIdNumber) {
            parsedIdentifiers = [{ name: dto.businessIdName, value: dto.businessIdNumber }];
        }
    } catch (e) {
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

      // 2. Create User linked to Company
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email.toLowerCase().trim(),
          phoneNumber: phone,
          password: hashedPassword,
          profilePicture: profilePictureUrl,
          role: 'OWNER',
          companyId: company.id,
        },
      });

      // 3. Create Branch
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

    const tokens = await this.generateTokens(result.user.id, result.user.role, result.company.id, [result.branch.id]);

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
      const target = dto.email ? dto.email.toLowerCase().trim() : dto.phoneNumber;
      const validOtp = this.otpCache.get(target!);
      if (!validOtp || validOtp !== dto.otp) {
        throw new UnauthorizedException('Invalid or expired OTP.');
      }
      this.otpCache.delete(target!);
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

  private async generateTokens(userId: string, role: string, companyId: string | null, branches: string[]) {
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
    const ms = { d: 24 * 60 * 60 * 1000, h: 60 * 60 * 1000, m: 60 * 1000, s: 1000 }[unit]!;
    return new Date(Date.now() + value * ms);
  }
}
