import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InvoiceRepository } from './invoice.repository';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoiceCalculatorService } from './invoice-calculator.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceMapper } from './invoice.mapper';
import { generateExpiryDate } from './invoice.utils';
import { INVOICE_CONSTANTS } from './invoice.constants';
import { PdfService } from './pdf.service';
import { UsageService } from '../subscriptions/usage.service';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly repository: InvoiceRepository,
    private readonly numberService: InvoiceNumberService,
    private readonly calculatorService: InvoiceCalculatorService,
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly usageService: UsageService,
  ) {}

  private computeStatusForInvoices(invoices: any[]) {
    if (invoices.length === 0) return invoices;
    
    const now = new Date();
    
    return invoices.map(invoice => {
      let computedStatus = invoice.status;
      
      const grandTotal = invoice.grandTotal || 0;
      const amountPaid = invoice.amountPaid || 0;
      const dueDate = new Date(invoice.dueDate);
      
      if (amountPaid === 0) {
        computedStatus = 'UNPAID';
      } else if (amountPaid > 0 && amountPaid < grandTotal) {
        computedStatus = 'PARTIAL';
      } else if (amountPaid >= grandTotal && grandTotal > 0) {
        computedStatus = 'PAID';
      }
      
      if (dueDate < now && computedStatus !== 'PAID') {
        computedStatus = 'OVERDUE';
      }
      
      return { ...invoice, status: computedStatus };
    });
  }

  async create(companyId: string, userId: string, dto: CreateInvoiceDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
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

    // Check if invoice for this quotation already exists
    if (dto.linkedQuotationId) {
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: { linkedQuotationId: dto.linkedQuotationId, companyId },
      });
      if (existingInvoice) {
        throw new BadRequestException('An invoice has already been generated for this quotation. Please delete it before generating a new one.');
      }
    }

    // Generate sequence
    const { invoiceNumber, sequenceNumber } = await this.numberService.generateNextSequence(dto.branchId, companyId);

    // Set Due Date
    const invoiceDate = new Date(dto.invoiceDate);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : generateExpiryDate(invoiceDate, INVOICE_CONSTANTS.DEFAULT_EXPIRY_MONTHS);

    if (dueDate < invoiceDate) {
      throw new BadRequestException('Due date cannot be before invoice date');
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
    
    // Process Payment
    let amountPaid = 0;
    let paymentData = [];
    if (dto.paymentConfiguration && dto.paymentConfiguration.addPayment) {
      amountPaid = Number(Number(dto.paymentConfiguration.amount || calculation.grandTotal).toFixed(2));
      const gTotal = Number(Number(calculation.grandTotal).toFixed(2));
      
      if (amountPaid <= 0) {
        throw new BadRequestException('Payment amount must be greater than 0');
      }
      if (amountPaid > gTotal) {
        throw new BadRequestException('Payment amount cannot exceed the invoice total');
      }
      
      paymentData.push({
        amount: amountPaid,
        method: dto.paymentConfiguration.method || 'CASH',
        date: dto.paymentConfiguration.date ? new Date(dto.paymentConfiguration.date) : new Date(),
        note: dto.paymentConfiguration.note || '',
      });
    }
    
    const amountDue = Number(Math.max(0, calculation.grandTotal - amountPaid).toFixed(2));
    
    let status = 'UNPAID';
    if (amountPaid >= calculation.grandTotal && calculation.grandTotal > 0) {
      status = 'PAID';
    } else if (amountPaid > 0) {
      status = 'PARTIAL';
    }

    // Create invoice
    const invoiceData = {
      invoiceNumber,
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
      invoiceDate,
      dueDate,
      billingAddressSnapshot: dto.billingAddress || {},
      shippingAddressSnapshot: shippingSnapshot || {},
      shippingSameAsBilling: dto.shippingSameAsBilling,
      discountConfiguration: dto.discountConfiguration || {},
      taxConfiguration: dto.taxConfiguration || {},
      subtotal: calculation.subtotal,
      discountAmount: calculation.discountAmount,
      taxAmount: calculation.taxAmount,
      grandTotal: calculation.grandTotal,
      amountPaid,
      amountDue,
      status,
      termsAndConditions: dto.termsAndConditions || '',
      notes: dto.notes || '',
      linkedQuotationId: dto.linkedQuotationId,
      createdById: userId,
    };

    const createdInvoice = await this.repository.createInvoice(invoiceData, finalItems, paymentData);
    
    // Increment usage
    await this.usageService.incrementInvoiceUsage(companyId);
    
    const [computedInvoice] = this.computeStatusForInvoices([createdInvoice]);
    return InvoiceMapper.toDto(computedInvoice);
  }

  async calculatePreview(companyId: string, userId: string, dto: CreateInvoiceDto) {
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

  async findAll(companyId: string, branchId?: string) {
    const invoices = await this.repository.findAll(companyId, branchId);
    const computedInvoices = this.computeStatusForInvoices(invoices);
    return computedInvoices.map(q => InvoiceMapper.toDto(q));
  }

  async findOne(id: string, companyId: string) {
    const invoice = await this.repository.findById(id, companyId);
    const [computedInvoice] = this.computeStatusForInvoices([invoice]);
    return InvoiceMapper.toDto(computedInvoice);
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateInvoiceDto) {
    // Verify invoice exists
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundException('Invoice not found');

    // Validate items if provided
    if (dto.items && dto.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
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
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : existing.invoiceDate;
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : existing.dueDate;

    if (dueDate < invoiceDate) {
      throw new BadRequestException('Due date cannot be before invoice date');
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
      invoiceDate,
      dueDate,
      billingAddressSnapshot: dto.billingAddress || existing.billingAddressSnapshot,
      shippingAddressSnapshot: shippingSnapshot,
      shippingSameAsBilling,
      discountConfiguration: dto.discountConfiguration || existing.discountConfiguration,
      taxConfiguration: dto.taxConfiguration || existing.taxConfiguration,
      notes: dto.notes !== undefined ? dto.notes : existing.notes,
      termsAndConditions: dto.termsAndConditions !== undefined ? dto.termsAndConditions : existing.termsAndConditions,
      updatedById: userId,
    };

    // Add calculated totals if items were recalculated
    if (calculation) {
      updateData.subtotal = calculation.subtotal;
      updateData.discountAmount = calculation.discountAmount;
      updateData.taxAmount = calculation.taxAmount;
      updateData.grandTotal = calculation.grandTotal;
      
      const amountPaid = existing.amountPaid || 0;
      updateData.amountDue = Number(Math.max(0, calculation.grandTotal - amountPaid).toFixed(2));
      
      let status = existing.status;
      if (amountPaid >= calculation.grandTotal && calculation.grandTotal > 0) {
        status = 'PAID';
      } else if (amountPaid > 0) {
        status = 'PARTIAL';
      } else {
        if (status === 'PAID' || status === 'PARTIAL') {
          status = 'UNPAID';
        }
      }
      
      updateData.status = status;
    }

    const updated = await this.repository.updateInvoice(id, companyId, updateData, finalItems);
    const [computedInvoice] = this.computeStatusForInvoices([updated]);
    return InvoiceMapper.toDto(computedInvoice);
  }

  async remove(id: string, companyId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Logic: Only allow deleting the MOST RECENT invoice for that branch
    const latestInvoice = await this.repository.findLatestInvoiceSequence(companyId, invoice.branchId);

    if (latestInvoice && latestInvoice.id !== id) {
      throw new BadRequestException('You can only delete the most recently created invoice for this branch.');
    }

    await this.repository.deleteInvoice(id, companyId);
    return { success: true, message: 'Invoice deleted successfully' };
  }

  async addPayment(invoiceId: string, companyId: string, userId: string, dto: AddPaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const currentDue = Number((invoice.grandTotal - (invoice.amountPaid || 0)).toFixed(2));
    const paymentAmount = Number(dto.amount.toFixed(2));
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }
    if (paymentAmount > currentDue) {
      throw new BadRequestException('Payment amount cannot exceed the due amount');
    }

    const newAmountPaid = Number(((invoice.amountPaid || 0) + dto.amount).toFixed(2));
    const amountDue = Math.max(0, Number((invoice.grandTotal - newAmountPaid).toFixed(2)));
    
    let status = invoice.status;
    if (newAmountPaid >= invoice.grandTotal && invoice.grandTotal > 0) {
      status = 'PAID';
    } else if (newAmountPaid > 0) {
      status = 'PARTIAL';
    }

    const paymentData = {
      amount: dto.amount,
      method: dto.method,
      date: new Date(dto.date),
      note: dto.note || '',
    };

    const updateData = {
      amountPaid: newAmountPaid,
      amountDue,
      status,
    };

    const payment = await this.repository.addPayment(invoiceId, companyId, paymentData, updateData);
    return payment;
  }

  async uploadPaymentAttachment(paymentId: string, invoiceId: string, companyId: string, file: Express.Multer.File) {
    const payment = await this.prisma.invoicePayment.findFirst({
      where: { id: paymentId, invoiceId },
      include: { invoice: true }
    });
    
    if (!payment || payment.invoice.companyId !== companyId) {
       throw new NotFoundException('Payment not found');
    }
    
    const filePath = `/uploads/${file.filename}`;
    return this.repository.updatePaymentAttachment(
      paymentId,
      invoiceId,
      filePath,
      file.originalname,
      file.mimetype,
      file.size
    );
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

  async uploadAttachment(invoiceId: string, companyId: string, file: Express.Multer.File) {
    // Verify invoice exists and belongs to company
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!INVOICE_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    if (file.size > INVOICE_CONSTANTS.MAX_FILE_SIZE) {
      throw new BadRequestException('File is too large');
    }

    // Save attachment record in DB
    // Assuming multer saves the file and adds 'filename' to the file object
    const attachmentData = {
      invoiceId: invoice.id,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storagePath: file.filename || file.originalname, // Fallback if using memory storage without disk writing setup
    };

    const attachment = await this.repository.createAttachment(attachmentData);
    return InvoiceMapper.toAttachmentDto(attachment);
  }

  async generatePdf(id: string, companyId: string): Promise<Buffer> {
    const invoice = await this.repository.findById(id, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: invoice.branchId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.pdfService.generateInvoicePdf(invoice, company, branch, invoice.customer);
  }
}
