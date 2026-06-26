import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a sub-user (manager or staff). Owner only.
   */
  async create(ownerId: string, companyId: string | null, dto: CreateUserDto) {
    if (!companyId) {
      throw new BadRequestException('You must set up a company before creating users.');
    }

    // Check for existing user
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
      throw new ConflictException(`A user with this ${field} already exists.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        role: dto.role,
        companyId,
        createdById: ownerId,
        branches: dto.branches?.length
          ? { connect: dto.branches.map((id) => ({ id })) }
          : undefined,
      },
    });

    return {
      success: true,
      message: 'User created successfully.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      credentials: {
        phoneNumber: user.phoneNumber,
        email: user.email,
        password: dto.password, // plain-text for owner to share
      },
    };
  }

  /**
   * List all users in the owner's company.
   */
  async findAll(companyId: string | null) {
    if (!companyId) {
      throw new BadRequestException('No company found.');
    }

    const users = await this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        profilePicture: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        branches: { select: { id: true, name: true, isMainBranch: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      users,
    };
  }

  /**
   * Update a sub-user. Owner only. Cannot modify another owner.
   */
  async update(targetId: string, ownerId: string, companyId: string | null, dto: UpdateUserDto) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!target || target.companyId !== companyId) {
      throw new NotFoundException('User not found.');
    }

    if (target.role === 'OWNER' && target.id !== ownerId) {
      throw new ForbiddenException('You cannot modify another owner.');
    }

    const updateData: any = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.email !== undefined) updateData.email = dto.email.toLowerCase().trim();
    if (dto.role !== undefined && ['MANAGER', 'STAFF'].includes(dto.role)) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    // Handle branch connections separately
    if (dto.branches !== undefined) {
      updateData.branches = {
        set: dto.branches.map((id) => ({ id })),
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        profilePicture: true,
        role: true,
        isActive: true,
        branches: { select: { id: true, name: true, isMainBranch: true } },
      },
    });

    return {
      success: true,
      message: 'User updated successfully.',
      user: updatedUser,
    };
  }

  /**
   * Soft-deactivate a sub-user. Cannot deactivate self or another owner.
   */
  async remove(targetId: string, ownerId: string, companyId: string | null) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!target || target.companyId !== companyId) {
      throw new NotFoundException('User not found.');
    }

    if (target.id === ownerId) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    if (target.role === 'OWNER') {
      throw new ForbiddenException('You cannot deactivate another owner.');
    }

    await this.prisma.user.update({
      where: { id: targetId },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'User deactivated successfully.',
    };
  }
}
