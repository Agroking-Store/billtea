import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new branch (owner only).
   */
  async create(companyId: string | null, dto: CreateBranchDto) {
    if (!companyId) {
      throw new BadRequestException('You must set up a company before creating branches.');
    }

    try {
      if (dto.isMainBranch) {
        await this.prisma.branch.updateMany({
          where: { companyId },
          data: { isMainBranch: false }
        });
      }

      const branch = await this.prisma.branch.create({
        data: {
          companyId,
          name: dto.name,
          isMainBranch: dto.isMainBranch || false,
          address: dto.address || '',
          city: dto.city || '',
          state: dto.state || '',
          pincode: dto.pincode || '',
          phone: dto.phone || '',
          email: dto.email || '',
          bankName: dto.bankName || '',
          accountNumber: dto.accountNumber || '',
          ifscCode: dto.ifscCode || '',
          upiId: dto.upiId || '',
          signatureValue: dto.signatureValue || '',
          tax: dto.tax !== undefined ? dto.tax : 0,
          taxLabel: dto.taxLabel || '',
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      return {
        success: true,
        message: 'Branch created successfully.',
        branch,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('A branch with this name already exists in your company.');
      }
      throw error;
    }
  }

  /**
   * List all active branches for a company.
   */
  async findAll(companyId: string | null, includeInactive: boolean = false) {
    if (!companyId) {
      throw new BadRequestException('No company found.');
    }

    const whereClause: any = { companyId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const branches = await this.prisma.branch.findMany({
      where: whereClause,
      orderBy: [{ isMainBranch: 'desc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { customers: true, invoices: true }
        }
      }
    });

    return {
      success: true,
      branches,
    };
  }

  /**
   * Update a branch (owner only).
   */
  async update(branchId: string, companyId: string | null, dto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch || branch.companyId !== companyId) {
      throw new NotFoundException('Branch not found.');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.pincode !== undefined) updateData.pincode = dto.pincode;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.bankName !== undefined) updateData.bankName = dto.bankName;
    if (dto.accountNumber !== undefined) updateData.accountNumber = dto.accountNumber;
    if (dto.ifscCode !== undefined) updateData.ifscCode = dto.ifscCode;
    if (dto.upiId !== undefined) updateData.upiId = dto.upiId;
    if (dto.signatureValue !== undefined) updateData.signatureValue = dto.signatureValue;
    if (dto.tax !== undefined) updateData.tax = dto.tax;
    if (dto.taxLabel !== undefined) updateData.taxLabel = dto.taxLabel;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isMainBranch !== undefined) updateData.isMainBranch = dto.isMainBranch;

    try {
      if (dto.isMainBranch) {
        await this.prisma.branch.updateMany({
          where: { companyId },
          data: { isMainBranch: false }
        });
      }

      const updatedBranch = await this.prisma.branch.update({
        where: { id: branchId },
        data: updateData,
      });

      return {
        success: true,
        message: 'Branch updated successfully.',
        branch: updatedBranch,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('A branch with this name already exists in your company.');
      }
      throw error;
    }
  }

  /**
   * Soft-delete a branch (owner only). Cannot delete main branch.
   */
  async remove(branchId: string, companyId: string | null) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch || branch.companyId !== companyId) {
      throw new NotFoundException('Branch not found.');
    }

    if (branch.isMainBranch) {
      throw new BadRequestException('Main branch cannot be deleted.');
    }

    await this.prisma.branch.update({
      where: { id: branchId },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Branch deactivated successfully.',
    };
  }
}
