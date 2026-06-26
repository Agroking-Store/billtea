import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetupCompanyDto } from './dto/setup-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create company + main branch, link to the authenticated owner user.
   */
  async setup(userId: string, companyId: string | null, dto: SetupCompanyDto) {
    if (companyId) {
      throw new BadRequestException('You already have a company set up.');
    }

    // Create company
    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        logo: dto.logo || '',
        identifiers: dto.identifiers || [],
        createdById: userId,
      },
    });

    // Create main branch
    const branch = await this.prisma.branch.create({
      data: {
        companyId: company.id,
        name: dto.mainBranch?.name || 'Main Branch',
        isMainBranch: true,
        address: dto.mainBranch?.address || '',
        city: dto.mainBranch?.city || '',
        state: dto.mainBranch?.state || '',
        pincode: dto.mainBranch?.pincode || '',
        phone: dto.mainBranch?.phone || '',
        email: dto.mainBranch?.email || '',
      },
    });

    // Link user to company and branch
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        companyId: company.id,
        branches: { connect: [{ id: branch.id }] },
      },
    });

    return {
      success: true,
      message: 'Company set up successfully.',
      company,
      mainBranch: branch,
    };
  }

  /**
   * Get company details.
   */
  async getCompany(companyId: string | null) {
    if (!companyId) {
      throw new NotFoundException('No company found. Please set up your company first.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    return {
      success: true,
      company,
    };
  }

  /**
   * Update company details (owner only).
   */
  async updateCompany(companyId: string | null, dto: UpdateCompanyDto) {
    if (!companyId) {
      throw new NotFoundException('No company found.');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.logo !== undefined) updateData.logo = dto.logo;
    if (dto.identifiers !== undefined) updateData.identifiers = dto.identifiers;

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    return {
      success: true,
      message: 'Company updated successfully.',
      company,
    };
  }
}
