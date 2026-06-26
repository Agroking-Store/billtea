import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get authenticated user's full profile with company & branch data.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        profilePicture: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        companyId: true,
        createdAt: true,
        createdBy: { select: { fullName: true, email: true } },
        branches: { select: { id: true, name: true, isMainBranch: true, city: true, state: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Fetch company
    let company = null;
    if (user.companyId) {
      company = await this.prisma.company.findUnique({
        where: { id: user.companyId },
        select: { id: true, name: true, logo: true, identifiers: true },
      });
    }

    // If user has no specific branches assigned, they have global access
    let branches = user.branches;
    const allBranches = user.branches.length === 0;
    if (allBranches && user.companyId) {
      branches = await this.prisma.branch.findMany({
        where: { companyId: user.companyId, isActive: true },
        select: { id: true, name: true, isMainBranch: true, city: true, state: true },
      });
    }

    return {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdBy: user.createdBy,
        createdAt: user.createdAt,
      },
      company,
      branches,
      allBranches,
    };
  }

  /**
   * Update authenticated user's personal details.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updateData: any = {};

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.profilePicture !== undefined) updateData.profilePicture = dto.profilePicture;

    // Check email uniqueness
    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      const existing = await this.prisma.user.findFirst({
        where: { email: normalizedEmail, NOT: { id: userId } },
      });
      if (existing) {
        throw new ConflictException('This email is already in use by another account.');
      }
      updateData.email = normalizedEmail;
    }

    // Check phone uniqueness
    if (dto.phoneNumber !== undefined) {
      const existing = await this.prisma.user.findFirst({
        where: { phoneNumber: dto.phoneNumber, NOT: { id: userId } },
      });
      if (existing) {
        throw new ConflictException('This phone number is already in use by another account.');
      }
      updateData.phoneNumber = dto.phoneNumber;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        profilePicture: true,
        role: true,
        companyId: true,
        branches: { select: { id: true } },
      },
      data: updateData,
    });

    return {
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        companyId: updatedUser.companyId,
        branches: updatedUser.branches.map((b) => b.id),
      },
    };
  }

  /**
   * Change authenticated user's password.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  }
}
