import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType } from '@prisma/client';

@Injectable()
export class InvoiceNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a new invoice number for a specific branch, using the
   * branch's saved DocumentSettings (Invoice Prefix + Next Sequence Number
   * from the Invoice Settings page).
   * Format: {PREFIX}{SEQ, zero-padded to 4 digits} (e.g., INV-0001)
   */
  async generateNextSequence(branchId: string, companyId: string): Promise<{ sequenceNumber: number; invoiceNumber: string }> {
    let settings = await this.prisma.documentSettings.findUnique({
      where: { branchId_type: { branchId, type: DocumentType.INVOICE } }
    });

    if (!settings) {
      // Find max sequence number to initialize correctly for default prefix
      const lastInvoice = await this.prisma.invoice.findFirst({
        where: {
          branchId,
          invoiceNumber: { startsWith: 'INV-' }
        },
        orderBy: { sequenceNumber: 'desc' },
      });
      const startNumber = lastInvoice ? lastInvoice.sequenceNumber + 1 : 1;

      try {
        settings = await this.prisma.documentSettings.create({
          data: {
            branchId,
            type: DocumentType.INVOICE,
            prefix: 'INV-',
            nextNumber: startNumber,
            topMessage: 'Thank you for your business.\nThis is your invoice.',
            bottomMessage: 'Thank you for your business.\nWe look forward to being a part of\nyour beautiful journey.',
            terms: '1. Payment is due within 15 days.\n2. Late payments may incur additional fees.',
          }
        });
      } catch (e) {
        // If creation fails due to race condition, fetch it again
        settings = await this.prisma.documentSettings.findUnique({
          where: { branchId_type: { branchId, type: DocumentType.INVOICE } }
        });
      }
    }

    // Ensure the settings nextNumber is valid for THIS prefix — if a user
    // changed the prefix or manually reset nextNumber lower than what's
    // already used, catch it up first (same safeguard as quotations).
    const prefix = settings ? settings.prefix : 'INV-';
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        branchId,
        invoiceNumber: { startsWith: prefix }
      },
      orderBy: { sequenceNumber: 'desc' },
    });
    const maxSequence = lastInvoice ? lastInvoice.sequenceNumber : 0;

    if (settings && settings.nextNumber <= maxSequence) {
      await this.prisma.documentSettings.update({
        where: { branchId_type: { branchId, type: DocumentType.INVOICE } },
        data: { nextNumber: maxSequence + 1 }
      });
    }

    // Atomically increment the nextNumber to avoid race conditions
    const updatedSettings = await this.prisma.documentSettings.update({
      where: { branchId_type: { branchId, type: DocumentType.INVOICE } },
      data: { nextNumber: { increment: 1 } }
    });

    // The sequence number for THIS invoice is the one before the increment
    const nextSequence = updatedSettings.nextNumber - 1;

    // Pad sequence to 4 digits — e.g. INV-0001
    const paddedSequence = String(nextSequence).padStart(4, '0');
    const invoiceNumber = `${updatedSettings.prefix}${paddedSequence}`;

    return {
      sequenceNumber: nextSequence,
      invoiceNumber
    };
  }
}
