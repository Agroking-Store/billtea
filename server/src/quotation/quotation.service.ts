import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuotationRepository } from './quotation.repository';
import { QuotationNumberService } from './quotation-number.service';
import { QuotationCalculatorService } from './quotation-calculator.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QuotationMapper } from './quotation.mapper';
import { generateExpiryDate } from './quotation.utils';
import { QUOTATION_CONSTANTS } from './quotation.constants';
import { PdfService } from './pdf.service';
import { UsageService } from '../subscriptions/usage.service';

@Injectable()
export class QuotationService {
  constructor(
    private readonly repository: QuotationRepository,
    private readonly numberService: QuotationNumberService,
    private readonly calculatorService: QuotationCalculatorService,
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly usageService: UsageService,
  ) {}

  private async computeStatusForQuotations(quotations: any[]) {
    if (quotations.length === 0) return quotations;
    
    const quotationIds = quotations.map(q => q.id);
    const linkedInvoices = await this.prisma.invoice.findMany({
      where: { linkedQuotationId: { in: quotationIds } },
      select: { linkedQuotationId: true }
    });
    const linkedQuotationIds = new Set(linkedInvoices.map(i => i.linkedQuotationId));
    const now = new Date();

    return quotations.map(q => {
      let computedStatus = q.status;
      const isAccepted = linkedQuotationIds.has(q.id);

      if (isAccepted) {
        computedStatus = 'ACCEPTED';
      } else {
        if (computedStatus === 'ACCEPTED') {
          computedStatus = 'SENT';
        }
        
        const expiryDate = new Date(q.expiryDate);
        if (expiryDate < now && computedStatus !== 'ACCEPTED') {
          computedStatus = 'EXPIRED';
        }
      }
      
      return { ...q, status: computedStatus };
    });
  }

  async create(companyId: string, userId: string, dto: CreateQuotationDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Quotation must have at least one item');
    }

    // Check branch and get branch tax percentage
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, companyId },
    });
    if (!branch) throw new ForbiddenException('Branch not found or access denied');

    // Check customer
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });
    if (!customer) throw new BadRequestException('Invalid customer');

    // Generate sequence
    const { quotationNumber, sequenceNumber } = await this.numberService.generateNextSequence(dto.branchId, companyId);

    // Set Expiry Date
    const quotationDate = new Date(dto.quotationDate);
    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : generateExpiryDate(quotationDate, QUOTATION_CONSTANTS.DEFAULT_EXPIRY_MONTHS);

    if (expiryDate < quotationDate) {
      throw new BadRequestException('Expiry date cannot be before quotation date');
    }

    // Build items with original snapshots
    const itemsData = [];
    for (const itemDto of dto.items) {
      if (itemDto.price < 0 || itemDto.quantity < 1) {
        throw new BadRequestException('Price and quantity must be positive');
      }

      let originalProduct = null;
      if (itemDto.productId) {
        originalProduct = await this.prisma.product.findUnique({ where: { id: itemDto.productId } });
      }

      itemsData.push({
        ...itemDto,
        productSnapshot: originalProduct || {},
        originalPrice: originalProduct?.price || itemDto.price,
        originalDescription: originalProduct?.description || itemDto.description || '',
        originalImage: originalProduct?.image || itemDto.image || '',
        editedPrice: itemDto.price,
        editedDescription: itemDto.description || '',
        editedImage: itemDto.image || '',
      });
    }

    // Calculate totals
    const effectiveTax = dto.taxConfiguration.mode === 'FIXED' ? (dto.taxConfiguration.value || 0) : 0;
    const calculation = this.calculatorService.calculateTotals(
      itemsData,
      dto.discountConfiguration,
      dto.taxConfiguration,
      effectiveTax
    );

    // Map calculated items back
    const finalItems = itemsData.map((item, index) => {
      const calcItem = calculation.items[index];
      return {
        productId: item.productId,
        productSnapshot: item.productSnapshot,
        originalPrice: item.originalPrice,
        originalDescription: item.originalDescription,
        originalImage: item.originalImage,
        editedPrice: item.editedPrice,
        editedDescription: item.editedDescription,
        editedImage: item.editedImage,
        quantity: item.quantity,
        discount: item.discount || {},
        tax: item.tax || 0,
        subtotal: calcItem.subtotal,
        discountAmount: calcItem.discountAmount,
        taxAmount: calcItem.taxAmount,
        total: calcItem.total,
      };
    });

    const shippingSnapshot = dto.shippingSameAsBilling ? dto.billingAddress : dto.shippingAddress;

    // Create quotation
    const quotationData = {
      quotationNumber,
      sequenceNumber,
      companyId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      customerSnapshot: {
        customerName: customer.customerName,
        companyName: customer.companyName,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        businessLabel: customer.businessLabel,
        businessLabelValue: customer.businessLabelValue,
        address: customer.address,
      },
      quotationDate,
      expiryDate,
      billingAddressSnapshot: dto.billingAddress || {},
      shippingAddressSnapshot: shippingSnapshot || {},
      shippingSameAsBilling: dto.shippingSameAsBilling,
      discountConfiguration: dto.discountConfiguration || {},
      taxConfiguration: dto.taxConfiguration || {},
      subtotal: calculation.subtotal,
      discountAmount: calculation.discountAmount,
      taxAmount: calculation.taxAmount,
      grandTotal: calculation.grandTotal,
      termsAndConditions: dto.termsAndConditions || '',
      notes: dto.notes || '',
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      createdById: userId,
    };

    const createdQuotation = await this.repository.createQuotation(quotationData, finalItems);

    // Increment usage
    await this.usageService.incrementQuotationUsage(companyId);
    
    const [computedQuotation] = await this.computeStatusForQuotations([createdQuotation]);
    return QuotationMapper.toDto(computedQuotation);
  }

  async calculatePreview(companyId: string, userId: string, dto: CreateQuotationDto) {
    if (!dto.items || dto.items.length === 0) {
      return {
        items: [],
        summary: { subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 }
      };
    }

    // Check branch and get branch tax percentage
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, companyId },
    });
    if (!branch) throw new ForbiddenException('Branch not found or access denied');

    // We don't validate customer strictly for preview as the user might still be typing
    // Just run the calculation engine


    // Batch fetch original products to prevent N+1 queries
    const productIds = dto.items.map(i => i.productId).filter(Boolean) as string[];
    const originalProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    const productMap = new Map(originalProducts.map(p => [p.id, p]));

    // Build items with original snapshots
    const itemsData = [];
    for (const itemDto of dto.items) {
      if (itemDto.price < 0 || itemDto.quantity < 1) {
        throw new BadRequestException('Price and quantity must be positive');
      }

      const originalProduct = itemDto.productId ? productMap.get(itemDto.productId) : null;

      itemsData.push({
        ...itemDto,
        productSnapshot: originalProduct || {},
        originalPrice: originalProduct?.price || itemDto.price,
        originalDescription: originalProduct?.description || itemDto.description || '',
        originalImage: originalProduct?.image || itemDto.image || '',
        editedPrice: itemDto.price,
        editedDescription: itemDto.description || '',
        editedImage: itemDto.image || '',
      });
    }

    // Calculate totals
    const effectiveTax = dto.taxConfiguration.mode === 'FIXED' ? (dto.taxConfiguration.value || 0) : 0;
    const calculation = this.calculatorService.calculateTotals(
      itemsData,
      dto.discountConfiguration,
      dto.taxConfiguration,
      effectiveTax
    );

    // Format response to exactly match frontend expectations
    return {
      items: calculation.items.map(item => ({
        id: item.id,
        productId: item.productId,
        subtotal: item.subtotal,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
        total: item.total
      })),
      summary: {
        subtotal: calculation.subtotal,
        discountAmount: calculation.discountAmount,
        taxAmount: calculation.taxAmount,
        grandTotal: calculation.grandTotal
      }
    };
  }

  async findAll(companyId: string, branchId?: string, withoutInvoice?: boolean) {
    const quotations = await this.repository.findAll(companyId, branchId);
    let computedQuotations = await this.computeStatusForQuotations(quotations);
    
    if (withoutInvoice) {
      computedQuotations = computedQuotations.filter(q => q.status !== 'ACCEPTED');
    }
    
    return computedQuotations.map(q => QuotationMapper.toDto(q));
  }

  async findOne(id: string, companyId: string) {
    const quotation = await this.repository.findById(id, companyId);
    const [computedQuotation] = await this.computeStatusForQuotations([quotation]);
    return QuotationMapper.toDto(computedQuotation);
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateQuotationDto) {
    // Verify quotation exists
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundException('Quotation not found');

    // Validate items if provided
    if (dto.items && dto.items.length === 0) {
      throw new BadRequestException('Quotation must have at least one item');
    }

    // Validate branch if provided
    const branchId = dto.branchId || existing.branchId;
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });
    if (!branch) throw new ForbiddenException('Branch not found or access denied');

    // Validate customer if provided
    const customerId = dto.customerId || existing.customerId;
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) throw new BadRequestException('Invalid customer');

    // Handle dates
    const quotationDate = dto.quotationDate ? new Date(dto.quotationDate) : existing.quotationDate;
    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : existing.expiryDate;

    if (expiryDate < quotationDate) {
      throw new BadRequestException('Expiry date cannot be before quotation date');
    }

    // Build items data (only if items are provided in the update)
    let finalItems: any[] | undefined = undefined;
    let calculation: any;

    const itemsToProcess = dto.items || undefined;

    if (itemsToProcess) {
      const itemsData = [];
      for (const itemDto of itemsToProcess) {
        if (itemDto.price < 0 || itemDto.quantity < 1) {
          throw new BadRequestException('Price and quantity must be positive');
        }

        let originalProduct = null;
        if (itemDto.productId) {
          originalProduct = await this.prisma.product.findUnique({ where: { id: itemDto.productId } });
        }

        itemsData.push({
          ...itemDto,
          productSnapshot: originalProduct || {},
          originalPrice: originalProduct?.price || itemDto.price,
          originalDescription: originalProduct?.description || itemDto.description || '',
          originalImage: originalProduct?.image || itemDto.image || '',
          editedPrice: itemDto.price,
          editedDescription: itemDto.description || '',
          editedImage: itemDto.image || '',
        });
      }

      // Calculate totals
      const discountConfig = dto.discountConfiguration || (existing.discountConfiguration as any);
      const taxConfig = dto.taxConfiguration || (existing.taxConfiguration as any);
      const effectiveTax = taxConfig.mode === 'FIXED' ? (taxConfig.value || 0) : 0;
      calculation = this.calculatorService.calculateTotals(
        itemsData,
        discountConfig,
        taxConfig,
        effectiveTax
      );

      // Map calculated items
      finalItems = itemsData.map((item, index) => {
        const calcItem = calculation.items[index];
        return {
          productId: item.productId,
          productSnapshot: item.productSnapshot,
          originalPrice: item.originalPrice,
          originalDescription: item.originalDescription,
          originalImage: item.originalImage,
          editedPrice: item.editedPrice,
          editedDescription: item.editedDescription,
          editedImage: item.editedImage,
          quantity: item.quantity,
          discount: item.discount || {},
          tax: item.tax || 0,
          subtotal: calcItem.subtotal,
          discountAmount: calcItem.discountAmount,
          taxAmount: calcItem.taxAmount,
          total: calcItem.total,
        };
      });
    }

    const shippingSameAsBilling = dto.shippingSameAsBilling ?? existing.shippingSameAsBilling;
    const shippingSnapshot = shippingSameAsBilling
      ? (dto.billingAddress || existing.billingAddressSnapshot)
      : (dto.shippingAddress || existing.shippingAddressSnapshot);

    // Build update data
    const updateData: any = {
      customerId,
      customerSnapshot: {
        customerName: customer.customerName,
        companyName: customer.companyName,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        businessLabel: customer.businessLabel,
        businessLabelValue: customer.businessLabelValue,
        address: customer.address,
      },
      quotationDate,
      expiryDate,
      billingAddressSnapshot: dto.billingAddress || existing.billingAddressSnapshot,
      shippingAddressSnapshot: shippingSnapshot,
      shippingSameAsBilling,
      discountConfiguration: dto.discountConfiguration || existing.discountConfiguration,
      taxConfiguration: dto.taxConfiguration || existing.taxConfiguration,
      notes: dto.notes !== undefined ? dto.notes : existing.notes,
      followUpDate: dto.followUpDate !== undefined ? (dto.followUpDate ? new Date(dto.followUpDate) : null) : existing.followUpDate,
      termsAndConditions: dto.termsAndConditions !== undefined ? dto.termsAndConditions : existing.termsAndConditions,
      status: dto.status !== undefined ? dto.status : existing.status,
      updatedById: userId,
    };

    // Add calculated totals if items were recalculated
    if (calculation) {
      updateData.subtotal = calculation.subtotal;
      updateData.discountAmount = calculation.discountAmount;
      updateData.taxAmount = calculation.taxAmount;
      updateData.grandTotal = calculation.grandTotal;
    }

    const updated = await this.repository.updateQuotation(id, companyId, updateData, finalItems);
    const [computedQuotation] = await this.computeStatusForQuotations([updated]);
    return QuotationMapper.toDto(computedQuotation);
  }

  async remove(id: string, companyId: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, companyId },
      include: { attachments: true },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    // Logic: Only allow deleting the MOST RECENT quotation for that branch
    const latestQuotation = await this.repository.findLatestQuotationSequence(companyId, quotation.branchId);

    if (latestQuotation && latestQuotation.id !== id) {
      throw new BadRequestException('You can only delete the most recently created quotation for this branch.');
    }

    // Delete physical attachment files
    if (quotation.attachments && quotation.attachments.length > 0) {
      const fs = require('fs/promises');
      const path = require('path');
      for (const attachment of quotation.attachments) {
        try {
          const filePath = path.join(process.cwd(), 'uploads', attachment.storagePath);
          await fs.unlink(filePath);
        } catch (err) {
          console.error(`Failed to delete physical file for attachment ${attachment.id}:`, err);
        }
      }
    }

    await this.repository.deleteQuotation(id, companyId);
    return { success: true, message: 'Quotation deleted successfully' };
  }

  async searchCustomers(query: string, companyId: string, branchId?: string) {
    const queryFilter = query && query.length > 0 ? {
      OR: [
        { customerName: { contains: query, mode: 'insensitive' as const } },
        { companyName: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
        { mobileNumber: { contains: query, mode: 'insensitive' as const } },
      ]
    } : {};

    return this.prisma.customer.findMany({
      where: {
        companyId,
        isActive: true,
        ...(branchId ? { branchId } : {}),
        ...queryFilter
      },
      orderBy: { customerName: 'asc' },
      take: 10,
    });
  }

  async searchProducts(query: string, companyId: string, branchId?: string) {
    const queryFilter = query && query.length > 0 ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { skuNumber: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ]
    } : {};

    return this.prisma.product.findMany({
      where: {
        companyId,
        ...(branchId ? { branchId } : {}),
        isActive: true,
        ...queryFilter
      },
      orderBy: { name: 'asc' },
      take: 10,
    });
  }

  async uploadAttachment(quotationId: string, companyId: string, file: Express.Multer.File) {
    // Verify quotation exists and belongs to company
    const quotation = await this.prisma.quotation.findFirst({
      where: { id: quotationId, companyId },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    if (!QUOTATION_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    if (file.size > QUOTATION_CONSTANTS.MAX_FILE_SIZE) {
      throw new BadRequestException('File is too large');
    }

    // Save attachment record in DB
    // Assuming multer saves the file and adds 'filename' to the file object
    const attachmentData = {
      quotationId: quotation.id,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storagePath: file.filename || file.originalname, // Fallback if using memory storage without disk writing setup
    };

    const attachment = await this.repository.createAttachment(attachmentData);
    return QuotationMapper.toAttachmentDto(attachment);
  }

  async generatePdf(id: string, companyId: string): Promise<Buffer> {
    const quotation = await this.repository.findById(id, companyId);
    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: quotation.branchId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.pdfService.generateQuotationPdf(quotation, company, branch, quotation.customer);
  }
}
