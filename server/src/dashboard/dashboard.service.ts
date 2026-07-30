import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(companyId: string, branchId?: string, startDate?: string, endDate?: string) {
    const branchFilter = branchId ? { branchId } : {};
    const whereFilter = { companyId, ...branchFilter };

    const now = new Date();
    
    let targetEnd = new Date();
    let targetStart = new Date();
    targetStart.setDate(targetEnd.getDate() - 30);
    targetStart.setHours(0, 0, 0, 0);

    if (startDate) {
      targetStart = new Date(startDate);
      targetStart.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      targetEnd = new Date(endDate);
      targetEnd.setHours(23, 59, 59, 999);
    } else if (startDate) {
      targetEnd = new Date();
    }

    const durationMs = targetEnd.getTime() - targetStart.getTime();
    
    const previousStart = new Date(targetStart.getTime() - durationMs);
    const previousEnd = new Date(targetStart.getTime() - 1);

    // Fetch KPIs
    const currentMonthInvoices = await this.prisma.invoice.count({
      where: { ...whereFilter, invoiceDate: { gte: targetStart, lte: targetEnd } },
    });
    const previousMonthInvoices = await this.prisma.invoice.count({
      where: { ...whereFilter, invoiceDate: { gte: previousStart, lte: previousEnd } },
    });

    const currentMonthQuotations = await this.prisma.quotation.count({
      where: { ...whereFilter, quotationDate: { gte: targetStart, lte: targetEnd } },
    });
    const previousMonthQuotations = await this.prisma.quotation.count({
      where: { ...whereFilter, quotationDate: { gte: previousStart, lte: previousEnd } },
    });

    const currentMonthCustomers = await this.prisma.customer.count({
      where: { ...whereFilter, createdAt: { gte: targetStart, lte: targetEnd } },
    });
    const previousMonthCustomers = await this.prisma.customer.count({
      where: { ...whereFilter, createdAt: { gte: previousStart, lte: previousEnd } },
    });

    // Total sales (paid invoices)

    const currentMonthSalesAggr = await this.prisma.invoice.aggregate({
      where: { ...whereFilter, status: 'PAID', invoiceDate: { gte: targetStart, lte: targetEnd } },
      _sum: { grandTotal: true },
    });
    const previousMonthSalesAggr = await this.prisma.invoice.aggregate({
      where: { ...whereFilter, status: 'PAID', invoiceDate: { gte: previousStart, lte: previousEnd } },
      _sum: { grandTotal: true },
    });

    const currentSales = currentMonthSalesAggr._sum.grandTotal || 0;
    const previousSales = previousMonthSalesAggr._sum.grandTotal || 0;

    const calcPercentage = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Number((((current - prev) / prev) * 100).toFixed(2));
    };

    const kpis = {
      totalInvoices: currentMonthInvoices,
      invoicesChange: calcPercentage(currentMonthInvoices, previousMonthInvoices),
      totalQuotations: currentMonthQuotations,
      quotationsChange: calcPercentage(currentMonthQuotations, previousMonthQuotations),
      totalSales: currentSales,
      salesChange: calcPercentage(currentSales, previousSales),
      totalCustomers: currentMonthCustomers,
      customersChange: calcPercentage(currentMonthCustomers, previousMonthCustomers),
    };

    // Trends & Charts
    const recentInvoices = await this.prisma.invoice.findMany({
      where: { ...whereFilter, invoiceDate: { gte: targetStart, lte: targetEnd } },
      select: { invoiceDate: true, grandTotal: true },
    });
    
    const recentQuotations = await this.prisma.quotation.findMany({
      where: { ...whereFilter, quotationDate: { gte: targetStart, lte: targetEnd } },
      select: { quotationDate: true, grandTotal: true },
    });

    const durationDays = durationMs / (1000 * 60 * 60 * 24);
    
    // Decide granularity for trend chart
    let points = 28;
    let stepMs = durationMs / Math.max(1, (points - 1));
    
    if (durationDays <= 35) {
      points = Math.ceil(durationDays) || 1;
      stepMs = (1000 * 60 * 60 * 24);
    } else if (durationDays <= 180) {
      points = Math.ceil(durationDays / 7) || 1;
      stepMs = (1000 * 60 * 60 * 24 * 7);
    } else {
      points = Math.ceil(durationDays / 30) || 1;
      stepMs = (1000 * 60 * 60 * 24 * 30);
    }

    const salesTrend = [];
    for (let i = 0; i < points; i++) {
      const pStart = new Date(targetStart.getTime() + (i * stepMs));
      const pEnd = new Date(targetStart.getTime() + ((i + 1) * stepMs));
      if (pStart > targetEnd) break;
      
      let dateString = pStart.toISOString().split("T")[0];
      if (durationDays > 180) {
        dateString = pStart.toLocaleString("default", { month: "short", year: "2-digit" });
      }

      const dailyInvoices = recentInvoices.filter(
        (inv) => inv.invoiceDate >= pStart && inv.invoiceDate < pEnd
      );
      const dailyQuotations = recentQuotations.filter(
        (quo) => quo.quotationDate >= pStart && quo.quotationDate < pEnd
      );

      salesTrend.push({
        date: dateString,
        invoices: dailyInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
        quotations: dailyQuotations.reduce((sum, quo) => sum + quo.grandTotal, 0),
      });
    }

    // Bar chart (weeklyCounts)
    let barPoints = 6;
    let barStepMs = durationMs / Math.max(1, barPoints);
    if (durationDays <= 14) {
      barPoints = Math.ceil(durationDays);
      barStepMs = 1000 * 60 * 60 * 24;
    } else if (durationDays <= 60) {
      barPoints = Math.ceil(durationDays / 7);
      barStepMs = 1000 * 60 * 60 * 24 * 7;
    } else {
      barPoints = Math.ceil(durationDays / 30);
      barStepMs = 1000 * 60 * 60 * 24 * 30;
    }

    const weeklyCounts = [];
    for (let i = 0; i < barPoints; i++) {
      const pStart = new Date(targetStart.getTime() + (i * barStepMs));
      const pEnd = new Date(targetStart.getTime() + ((i + 1) * barStepMs));
      if (pStart > targetEnd) break;

      let label = `W${i + 1}`;
      if (durationDays <= 14) label = pStart.toISOString().split("T")[0].slice(5); // MM-DD
      else if (durationDays > 60) label = pStart.toLocaleString("default", { month: "short" });

      const wInvoices = recentInvoices.filter(
        (inv) => inv.invoiceDate >= pStart && inv.invoiceDate < pEnd
      ).length;
      
      const wQuotations = recentQuotations.filter(
        (quo) => quo.quotationDate >= pStart && quo.quotationDate < pEnd
      ).length;

      weeklyCounts.push({
        week: label,
        invoices: wInvoices,
        quotations: wQuotations,
      });
    }

    // Reminders (independent of date filter)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const invoiceReminders = await this.prisma.invoice.findMany({
      where: {
        ...whereFilter,
        status: { in: ['UNPAID', 'OVERDUE'] },
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { customer: { select: { customerName: true, mobileNumber: true } } },
    });

    const quotationFollowups = await this.prisma.quotation.findMany({
      where: {
        ...whereFilter,
        status: { in: ['DRAFT', 'SENT'] },
        followUpDate: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { followUpDate: 'asc' },
      take: 5,
      include: { customer: { select: { customerName: true } } },
    });

    return {
      kpis,
      salesTrend,
      weeklyCounts,
      invoiceReminders,
      quotationFollowups,
    };
  }
}
