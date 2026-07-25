import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from '../auth/dto/login.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    if (!dto.email) {
      throw new BadRequestException('Email is required for admin login.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('No account found with these credentials.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated. Contact your administrator.');
    }

    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Admin access only.');
    }

    if (!dto.password) {
      throw new BadRequestException('Password is required for admin login.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role, null, []);

    return {
      success: true,
      message: 'Admin login successful.',
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        companyId: user.companyId,
        branches: [],
      },
    };
  }

  async getDashboardStats() {
    const [totalCompanies, totalUsers, totalSubscriptions, totalRevenueResult] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.companySubscription.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.subscriptionPayment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalCompanies,
        totalUsers,
        activeSubscriptions: totalSubscriptions,
        totalRevenue: totalRevenueResult._sum.amount || 0,
      }
    };
  }

  private async generateTokens(
    userId: string,
    role: string,
    companyId: string | null,
    branches: string[],
  ) {
    const payload = {
      sub: userId,
      role,
      companyId,
      branches,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenValue = uuidv4();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const expiresAt = this.calculateExpiry(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const ms = {
      d: 24 * 60 * 60 * 1000,
      h: 60 * 60 * 1000,
      m: 60 * 1000,
      s: 1000,
    }[unit]!;
    return new Date(Date.now() + value * ms);
  }
}
