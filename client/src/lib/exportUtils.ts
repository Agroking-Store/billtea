// Utility functions for exporting Reports and Profit & Loss data to PDF (.pdf) and Excel (.xlsx)

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface InvoiceReportItem {
  invoiceNumber: string;
  date: string;
  customerName: string;
  companyName?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
}

export interface InvoiceReportFilters {
  fromDate?: string;
  toDate?: string;
  customerName?: string;
  status?: string;
  searchQuery?: string;
}

export interface InvoiceReportStats {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
}

export interface ProfitReportItem {
  date: string;
  income: number;
  expense: number;
  profit: number;
}

export interface ProfitReportFilters {
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
}

export interface ProfitReportTotals {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

// Formatter helpers
const formatCurrency = (val: number) => {
  return '₹' + (val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ==========================================
// INVOICE REPORTS EXPORTS
// ==========================================

export function exportInvoicesExcel(
  items: InvoiceReportItem[],
  stats: InvoiceReportStats,
  filters: InvoiceReportFilters
) {
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const filterSummaryText = [
    filters.fromDate ? `From: ${formatDate(filters.fromDate)}` : '',
    filters.toDate ? `To: ${formatDate(filters.toDate)}` : '',
    filters.customerName ? `Customer: ${filters.customerName}` : '',
    filters.status ? `Status: ${filters.status}` : '',
    filters.searchQuery ? `Search: "${filters.searchQuery}"` : '',
  ].filter(Boolean).join(' | ') || 'All Data (No Filters Applied)';

  const aoaData: any[][] = [
    ['INDUX TECHNOLOGY - INVOICE REPORT'],
    ['Generated Date', nowStr],
    ['Applied Filters', filterSummaryText],
    [],
    ['SUMMARY METRICS'],
    ['Total Invoices', 'Total Amount (INR)', 'Total Paid (INR)', 'Total Pending (INR)'],
    [stats.totalInvoices, stats.totalAmount, stats.totalPaid, stats.totalPending],
    [],
    ['INVOICE DETAILS'],
    ['#', 'Invoice Number', 'Date', 'Customer Name', 'Company Name', 'Total Amount (INR)', 'Paid Amount (INR)', 'Pending Amount (INR)', 'Status'],
  ];

  items.forEach((item, idx) => {
    aoaData.push([
      idx + 1,
      item.invoiceNumber || '-',
      formatDate(item.date),
      item.customerName || 'N/A',
      item.companyName || '-',
      item.totalAmount || 0,
      item.paidAmount || 0,
      item.pendingAmount || 0,
      item.status || 'Pending',
    ]);
  });

  aoaData.push([]);
  aoaData.push([
    'TOTAL SUMMARY',
    `(${items.length} Invoices)`,
    '',
    '',
    '',
    stats.totalAmount,
    stats.totalPaid,
    stats.totalPending,
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  worksheet['!cols'] = [
    { wch: 6 },   // #
    { wch: 20 },  // Invoice Number
    { wch: 14 },  // Date
    { wch: 25 },  // Customer Name
    { wch: 25 },  // Company Name
    { wch: 20 },  // Total Amount
    { wch: 20 },  // Paid Amount
    { wch: 20 },  // Pending Amount
    { wch: 15 },  // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Report');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Invoice_Report_${dateStr}.xlsx`);
}

export function exportInvoicesPDF(
  items: InvoiceReportItem[],
  stats: InvoiceReportStats,
  filters: InvoiceReportFilters
) {
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const filterSummaryText = [
    filters.fromDate ? `From: ${formatDate(filters.fromDate)}` : '',
    filters.toDate ? `To: ${formatDate(filters.toDate)}` : '',
    filters.customerName ? `Customer: ${filters.customerName}` : '',
    filters.status ? `Status: ${filters.status}` : '',
    filters.searchQuery ? `Search: "${filters.searchQuery}"` : '',
  ].filter(Boolean).join('  |  ') || 'All Records (No Filters)';

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header - Company & Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(2, 132, 199); // #0284c7 Primary blue
  doc.text('Indux Technology', 14, 18);

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text('Invoice Financial Report', 14, 25);

  // Metadata Right Aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${nowStr}`, doc.internal.pageSize.width - 14, 18, { align: 'right' });
  doc.text(`Total Records: ${items.length}`, doc.internal.pageSize.width - 14, 24, { align: 'right' });

  // Divider line
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  doc.line(14, 28, doc.internal.pageSize.width - 14, 28);

  // Filter banner
  doc.setFillColor(240, 249, 255); // #f0f9ff
  doc.roundedRect(14, 31, doc.internal.pageSize.width - 28, 9, 2, 2, 'F');
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, 31, doc.internal.pageSize.width - 28, 9, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 105, 161);
  doc.text(`Filters Applied: ${filterSummaryText}`, 17, 36.5);

  // Stats Grid Cards
  const cardWidth = (doc.internal.pageSize.width - 28 - 9) / 4;
  const startY = 43;

  const statCards = [
    { title: 'TOTAL INVOICES', val: `${stats.totalInvoices}`, color: [15, 23, 42] },
    { title: 'TOTAL AMOUNT', val: formatCurrency(stats.totalAmount), color: [2, 132, 199] },
    { title: 'TOTAL PAID', val: formatCurrency(stats.totalPaid), color: [22, 163, 74] },
    { title: 'TOTAL PENDING', val: formatCurrency(stats.totalPending), color: [217, 119, 6] },
  ];

  statCards.forEach((card, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, cardWidth, 14, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardWidth, 14, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(card.title, x + 4, startY + 5);

    doc.setFontSize(10);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.val, x + 4, startY + 11);
  });

  // Invoice Table
  autoTable(doc, {
    startY: 61,
    head: [['#', 'Invoice Number', 'Date', 'Customer Name', 'Total Amount', 'Paid Amount', 'Pending Amount', 'Status']],
    body: items.map((item, idx) => [
      idx + 1,
      item.invoiceNumber || '-',
      formatDate(item.date),
      (item.customerName || 'N/A') + (item.companyName ? `\n(${item.companyName})` : ''),
      formatCurrency(item.totalAmount),
      formatCurrency(item.paidAmount),
      formatCurrency(item.pendingAmount),
      item.status || 'Pending',
    ]),
    foot: [
      ['', 'TOTAL SUMMARY', '', `(${items.length} Invoices)`, formatCurrency(stats.totalAmount), formatCurrency(stats.totalPaid), formatCurrency(stats.totalPending), '']
    ],
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    footStyles: {
      fillColor: [224, 242, 254],
      textColor: [3, 105, 161],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 25 },
      3: { cellWidth: 65 },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' },
      6: { cellWidth: 35, halign: 'right' },
      7: { cellWidth: 25, halign: 'center' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  // Footer / Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 8, { align: 'right' });
    doc.text('BillTea • Indux Technology Financial Reports', 14, doc.internal.pageSize.height - 8);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Invoice_Report_${dateStr}.pdf`);
}

// ==========================================
// PROFIT REPORT EXPORTS
// ==========================================

export function exportProfitExcel(
  items: ProfitReportItem[],
  totals: ProfitReportTotals,
  filters: ProfitReportFilters
) {
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const filterSummaryText = [
    filters.fromDate ? `From: ${formatDate(filters.fromDate)}` : '',
    filters.toDate ? `To: ${formatDate(filters.toDate)}` : '',
    filters.searchQuery ? `Search: "${filters.searchQuery}"` : '',
  ].filter(Boolean).join(' | ') || 'All Dates';

  const aoaData: any[][] = [
    ['INDUX TECHNOLOGY - PROFIT & LOSS REPORT'],
    ['Generated Date', nowStr],
    ['Applied Filters', filterSummaryText],
    [],
    ['SUMMARY METRICS'],
    ['Total Income (INR)', 'Total Expense (INR)', 'Net Profit / Loss (INR)'],
    [totals.totalIncome, totals.totalExpense, totals.netProfit],
    [],
    ['DAILY PROFIT BREAKDOWN'],
    ['#', 'Date', 'Income (INR)', 'Expense (INR)', 'Net Profit / Loss (INR)'],
  ];

  items.forEach((item, idx) => {
    aoaData.push([
      idx + 1,
      formatDate(item.date),
      item.income || 0,
      item.expense || 0,
      item.profit || 0,
    ]);
  });

  aoaData.push([]);
  aoaData.push([
    'TOTAL SUMMARY',
    `(${items.length} Days)`,
    totals.totalIncome,
    totals.totalExpense,
    totals.netProfit,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  worksheet['!cols'] = [
    { wch: 6 },   // #
    { wch: 16 },  // Date
    { wch: 22 },  // Income
    { wch: 22 },  // Expense
    { wch: 25 },  // Net Profit
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Profit Report');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Profit_Report_${dateStr}.xlsx`);
}

export function exportProfitPDF(
  items: ProfitReportItem[],
  totals: ProfitReportTotals,
  filters: ProfitReportFilters
) {
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const filterSummaryText = [
    filters.fromDate ? `From: ${formatDate(filters.fromDate)}` : '',
    filters.toDate ? `To: ${formatDate(filters.toDate)}` : '',
    filters.searchQuery ? `Search: "${filters.searchQuery}"` : '',
  ].filter(Boolean).join('  |  ') || 'All Dates';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header - Company & Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text('Indux Technology', 14, 18);

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('Profit & Loss Report', 14, 25);

  // Metadata Right Aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${nowStr}`, doc.internal.pageSize.width - 14, 18, { align: 'right' });
  doc.text(`Total Days: ${items.length}`, doc.internal.pageSize.width - 14, 24, { align: 'right' });

  // Divider line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(14, 28, doc.internal.pageSize.width - 14, 28);

  // Filter banner
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 31, doc.internal.pageSize.width - 28, 9, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 31, doc.internal.pageSize.width - 28, 9, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Filters Applied: ${filterSummaryText}`, 17, 36.5);

  // Stats Grid Cards
  const cardWidth = (doc.internal.pageSize.width - 28 - 6) / 3;
  const startY = 43;

  const statCards = [
    { title: 'TOTAL INCOME', val: formatCurrency(totals.totalIncome), color: [15, 23, 42] },
    { title: 'TOTAL EXPENSE', val: formatCurrency(totals.totalExpense), color: [220, 38, 38] },
    { title: 'NET PROFIT', val: formatCurrency(totals.netProfit), color: totals.netProfit >= 0 ? [22, 163, 74] : [220, 38, 38] },
  ];

  statCards.forEach((card, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, cardWidth, 14, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardWidth, 14, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(card.title, x + 4, startY + 5);

    doc.setFontSize(10.5);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.val, x + 4, startY + 11);
  });

  // Table
  autoTable(doc, {
    startY: 61,
    head: [['#', 'Date', 'Income', 'Expense', 'Net Profit / Loss']],
    body: items.map((item, idx) => [
      idx + 1,
      formatDate(item.date),
      formatCurrency(item.income),
      formatCurrency(item.expense),
      formatCurrency(item.profit),
    ]),
    foot: [
      ['', 'TOTAL SUMMARY', formatCurrency(totals.totalIncome), formatCurrency(totals.totalExpense), formatCurrency(totals.netProfit)]
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 42, halign: 'right' },
      3: { cellWidth: 42, halign: 'right' },
      4: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  // Footer / Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 8, { align: 'right' });
    doc.text('BillTea • Indux Technology Profit Reports', 14, doc.internal.pageSize.height - 8);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Profit_Report_${dateStr}.pdf`);
}
