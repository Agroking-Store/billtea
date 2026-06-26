import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Register a new owner user (no company yet).
   */
  async register(dto: RegisterDto) {
    // Check for existing user by phone or email
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: dto.phoneNumber },
          { email: dto.email.toLowerCase().trim() },
        ],
      },
    });

    if (existing) {
      const field = existing.phoneNumber === dto.phoneNumber ? 'phone number' : 'email';
      throw new ConflictException(`An account with this ${field} already exists.`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create owner user
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'OWNER',
        companyId: null,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role, null, []);

    return {
      success: true,
      message: 'Registration successful. Please set up your company.',
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        companyId: null,
      },
    };
  }

  /**
   * Login with phone/email + password.
   */
  async login(dto: LoginDto) {
    if (!dto.phoneNumber && !dto.email) {
      throw new BadRequestException('Phone number or email is required.');
    }

    // Find user
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

    // Compare password
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    // Update last login
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

  /**
   * Refresh access token using a valid refresh token.
   */
  async refresh(dto: RefreshDto) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: { include: { branches: { select: { id: true } } } },
      },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Refresh token is invalid or expired. Please login again.');
    }

    if (!stored.user.isActive) {
      throw new ForbiddenException('Your account has been deactivated.');
    }

    // Delete old refresh token (rotate)
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

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

  /**
   * Generate access + refresh token pair.
   */
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

    // Create refresh token
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

  /**
   * Parse duration string (e.g. "30d", "7d") into a Date.
   */
  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      // Default to 30 days
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
