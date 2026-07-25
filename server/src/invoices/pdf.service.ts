import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Company, Branch } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function numberToWordsRupees(amount: number): string {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertToWords(num: number): string {
    if (num === 0) return 'Zero';
    let result = '';
    
    if (Math.floor(num / 10000000) > 0) {
      result += convertToWords(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    
    if (Math.floor(num / 100000) > 0) {
      result += convertToWords(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    
    if (Math.floor(num / 1000) > 0) {
      result += convertToWords(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    
    if (Math.floor(num / 100) > 0) {
      result += convertToWords(Math.floor(num / 100)) + ' Hundred ';
      num %= 100;
    }
    
    if (num > 0) {
      if (num < 20) {
        result += words[num];
      } else {
        result += tens[Math.floor(num / 10)];
        if (num % 10 > 0) {
          result += ' ' + words[num % 10];
        }
      }
    }
    return result.trim();
  }
  
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let str = convertToWords(rupees) + ' rupees';
  if (paise > 0) {
    str += ' and ' + convertToWords(paise).toLowerCase() + ' paise';
  }
  return str + ' Only';
}

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePdf(
    invoice: any, 
    company: Company, 
    branch: Branch,
    customer: any
  ): Promise<Buffer> {
    const iDate = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const dDate = new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    
    // Fetch document settings for invoices
    const fetchedSettings = await this.prisma.documentSettings.findUnique({
      where: { branchId_type: { branchId: branch.id, type: 'INVOICE' } }
    });
    
    const settings = fetchedSettings || {
      showSku: false,
      showHsn: true,
      topMessage: "",
      bottomMessage: "We appreciate your business! If you have any questions about this invoice, please contact us.",
    } as any;

    // items table html
    let itemsHtml = '';
    let totalQty = 0;
    
    const showSkuHsnCol = settings.showSku || settings.showHsn;
    let skuHsnHeader = '';
    if (settings.showSku && settings.showHsn) skuHsnHeader = 'SKU / HSN';
    else if (settings.showSku) skuHsnHeader = 'SKU';
    else if (settings.showHsn) skuHsnHeader = 'HSN';
    
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item: any, index: number) => {
        totalQty += item.quantity;
        const itemName = item.productSnapshot?.name || 'Item';
        const hsn = item.productSnapshot?.hsnNumber || item.product?.hsnNumber || item.productSnapshot?.hsn || '-';
        const sku = item.productSnapshot?.skuNumber || item.product?.skuNumber || item.productSnapshot?.sku || '-';
        const desc = item.editedDescription || '-';
        
        let taxPercent = '18%';
        if (item.taxAmount > 0 && item.subtotal > 0) {
            taxPercent = Math.round((item.taxAmount / (item.subtotal - (item.discountAmount || 0))) * 100) + '%';
        }

        let discountPercent = '0%';
        if (item.discountAmount > 0 && item.subtotal > 0) {
            discountPercent = Math.round((item.discountAmount / item.subtotal) * 100) + '%';
        }

        itemsHtml += `
          <tr class="border-b border-slate-100 last:border-b-0">
              <td class="py-3 px-1.5 align-top">
                  <p class="font-bold text-slate-900 text-[10px] leading-tight mb-0.5">${itemName}</p>
                  <p class="text-[8px] text-slate-500">${desc}</p>
              </td>
              ${showSkuHsnCol ? `
              <td class="py-3 px-1.5 text-center align-top text-[8.5px]">
                  ${settings.showSku && settings.showHsn ? `
                      <span class="text-slate-400">SKU:</span> <span class="font-semibold text-slate-700">${sku}</span><br />
                      <span class="text-slate-400">HSN:</span> <span class="font-semibold text-slate-700">${hsn}</span>
                  ` : `
                      <span class="font-semibold text-slate-700 text-[10px]">${settings.showSku ? sku : hsn}</span>
                  `}
              </td>
              ` : ''}
              <td class="py-3 px-1.5 text-center align-top font-semibold text-slate-800">${item.quantity}</td>
              <td class="py-3 px-1.5 text-right align-top font-medium">${Number(item.editedPrice || 0).toFixed(2)}</td>
              <td class="py-3 px-1.5 text-center align-top">${discountPercent}</td>
              <td class="py-3 px-1.5 text-center align-top">${taxPercent}</td>
              <td class="py-3 px-1.5 text-right align-top font-bold text-slate-900">${Number(item.total || 0).toFixed(2)}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml += `<tr><td colspan="${showSkuHsnCol ? 7 : 6}" class="py-6 text-center text-slate-500">No items in invoice</td></tr>`;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      </style>
    </head>
    <body class="bg-white font-sans text-slate-900">
        <!-- Invoice Container -->
        <div class="flex flex-col relative overflow-hidden min-h-screen">
                <!-- Top Accent -->
                <div class="h-2 w-full bg-slate-900 absolute top-0 left-0"></div>

                <div class="p-10 flex-1 flex flex-col pt-12">
                    <!-- Header Section -->
                    <div class="flex justify-between items-start mb-8">
                        <!-- Company Info -->
                        <div class="max-w-[60%]">
                            <h1 class="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">${company.name || ''}</h1>
                            <p class="text-[9px] text-slate-500 leading-relaxed">
                                <span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">location_on</span> ${branch.address || ''}, ${branch.city || ''} ${branch.pincode || ''}<br />
                                <span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">call</span> ${branch.phone || ''} &nbsp;&nbsp;|&nbsp;&nbsp;
                                <span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">mail</span> ${branch.email || ''}<br />
                                ${(branch as any).gstIn ? `<span class="font-medium text-slate-700">GSTIN: ${(branch as any).gstIn}</span>` : ''}
                            </p>
                        </div>

                        <!-- Invoice Meta -->
                        <div class="text-right">
                            <h2 class="text-2xl font-black text-slate-900 tracking-widest uppercase mb-3">Invoice</h2>
                            <div class="grid grid-cols-[auto_auto] gap-x-3 gap-y-1.5 text-[9px] text-left inline-grid">
                                <span class="text-slate-400 text-right">Invoice No:</span> <span class="font-bold text-slate-900">${invoice.invoiceNumber || ''}</span>
                                <span class="text-slate-400 text-right">Date:</span> <span class="font-medium text-slate-800">${iDate}</span>
                                <span class="text-slate-400 text-right">Due Date:</span> <span class="font-medium text-slate-800">${dDate}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Greeting -->
                    <div class="text-[10px] text-slate-600 italic mb-6 border-l-2 border-slate-300 pl-3">
                        ${settings.topMessage ? settings.topMessage : `Dear <span class="font-bold text-slate-800">${customer.customerName || invoice.customerSnapshot?.customerName || 'Customer'}</span>, thank you for choosing us.`}
                    </div>

                    <!-- Billed To / Shipped To -->
                    <div class="grid grid-cols-2 gap-4 mb-8">
                        <!-- Billed To -->
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                            <p class="text-[11px] mb-0.5">
                                <span class="font-bold text-slate-900">${customer.customerName || invoice.customerSnapshot?.customerName || ''}</span>${(customer.companyName || invoice.customerSnapshot?.companyName) ? ` <span class="font-normal text-slate-300 mx-1">|</span> <span class="font-normal text-slate-400">${customer.companyName || invoice.customerSnapshot?.companyName}</span>` : ''}
                            </p>
                            ${(customer.gstIn || invoice.customerSnapshot?.gstIn) ? `<p class="text-[9px] font-medium text-slate-700 mb-1.5">GSTIN: ${customer.gstIn || invoice.customerSnapshot?.gstIn}</p>` : ''}
                            <p class="text-[9px] text-slate-500 leading-relaxed">
                                ${(invoice.billingAddress?.address || customer.address || invoice.customerSnapshot?.address) ? `<span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">location_on</span> ${invoice.billingAddress?.address || customer.address || invoice.customerSnapshot?.address}<br />` : ''}
                                ${(customer.mobileNumber || invoice.customerSnapshot?.mobileNumber) ? `<span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">call</span> ${customer.mobileNumber || invoice.customerSnapshot?.mobileNumber} <br />` : ''}
                                ${(customer.email || invoice.customerSnapshot?.email) ? `<span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">mail</span> ${customer.email || invoice.customerSnapshot?.email}` : ''}
                            </p>
                        </div>

                        <!-- Shipped To -->
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shipped To</p>
                            <p class="text-[11px] mb-0.5">
                                <span class="font-bold text-slate-900">${customer.customerName || invoice.customerSnapshot?.customerName || ''}</span>${(customer.companyName || invoice.customerSnapshot?.companyName) ? ` <span class="font-normal text-slate-300 mx-1">|</span> <span class="font-normal text-slate-400">${customer.companyName || invoice.customerSnapshot?.companyName}</span>` : ''}
                            </p>
                            ${(customer.gstIn || invoice.customerSnapshot?.gstIn) ? `<p class="text-[9px] font-medium text-slate-700 mb-1.5">GSTIN: ${customer.gstIn || invoice.customerSnapshot?.gstIn}</p>` : ''}
                            <p class="text-[9px] text-slate-500 leading-relaxed">
                                ${(invoice.shippingAddress?.address || customer.address || invoice.customerSnapshot?.address) ? `<span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">location_on</span> ${invoice.shippingAddress?.address || customer.address || invoice.customerSnapshot?.address}<br />` : ''}
                                ${(customer.mobileNumber || invoice.customerSnapshot?.mobileNumber) ? `<span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">call</span> ${customer.mobileNumber || invoice.customerSnapshot?.mobileNumber} <br />` : ''}
                                ${(customer.email || invoice.customerSnapshot?.email) ? `<span class="material-symbols-outlined text-[9px] align-text-bottom text-slate-400 mr-0.5">mail</span> ${customer.email || invoice.customerSnapshot?.email}` : ''}
                            </p>
                        </div>
                    </div>

                    <!-- Table -->
                    <div class="mb-6">
                        <table class="w-full text-[9px] border-collapse">
                            <thead>
                                <tr class="border-b-2 border-slate-800 text-slate-900">
                                    <th class="py-2 px-1.5 text-left font-bold w-[35%] uppercase">Product</th>
                                    ${showSkuHsnCol ? `<th class="py-2 px-1.5 text-center font-bold uppercase">${skuHsnHeader}</th>` : ''}
                                    <th class="py-2 px-1.5 text-center font-bold uppercase">Qty</th>
                                    <th class="py-2 px-1.5 text-right font-bold uppercase">Price(₹)</th>
                                    <th class="py-2 px-1.5 text-center font-bold uppercase">Disc.%</th>
                                    <th class="py-2 px-1.5 text-center font-bold uppercase">Tax%</th>
                                    <th class="py-2 px-1.5 text-right font-bold uppercase">Total(₹)</th>
                                </tr>
                            </thead>
                            <tbody class="text-slate-600">
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>

                    <!-- Totals Section -->
                    <div class="flex justify-between items-start mb-6 border-t border-slate-200 pt-6">
                        <div class="w-[55%] pr-4">
                            <div class="text-[9px] mb-4">
                                <p class="font-bold text-slate-400 mb-1 uppercase tracking-widest text-[8px]">Total Quantity</p>
                                <p class="text-slate-800 font-bold text-[11px]">${totalQty} Items</p>
                            </div>
                            <div class="text-[9px]">
                                <p class="font-bold text-slate-400 mb-1 uppercase tracking-widest text-[8px]">Amount in Words</p>
                                <p class="italic text-slate-700 font-medium leading-relaxed">${numberToWordsRupees(Number(invoice.grandTotal || 0))}</p>
                            </div>
                        </div>

                        <div class="w-[45%] flex justify-end">
                            <table class="w-full max-w-[240px] text-[10px]">
                                <tbody>
                                    <tr><td class="py-1.5 px-3 text-slate-500">Subtotal</td><td class="py-1.5 px-3 text-right font-medium text-slate-800">₹${Number(invoice.subtotal || 0).toFixed(2)}</td></tr>
                                    <tr><td class="py-1.5 px-3 text-slate-500">Discount</td><td class="py-1.5 px-3 text-right font-medium text-emerald-600">-₹${Number(invoice.discountAmount || 0).toFixed(2)}</td></tr>
                                    <tr><td class="py-1.5 px-3 text-slate-500">Total Tax</td><td class="py-1.5 px-3 text-right font-medium text-slate-800">₹${Number(invoice.taxAmount || 0).toFixed(2)}</td></tr>
                                    <tr><td class="py-1.5 px-3 text-slate-500">Grand Total</td><td class="py-1.5 px-3 text-right font-medium text-slate-800">₹${Number(invoice.grandTotal || 0).toFixed(2)}</td></tr>
                                    <tr><td class="py-1.5 px-3 text-slate-500">Paid Amount</td><td class="py-1.5 px-3 text-right font-medium text-emerald-600">₹${(Number(invoice.grandTotal || 0) - Number(invoice.amountDue || 0)).toFixed(2)}</td></tr>
                                    <tr class="bg-slate-900 text-white rounded-lg overflow-hidden">
                                        <td class="py-3 px-3 font-bold rounded-l-md uppercase tracking-widest text-[9px]">Total Due</td>
                                        <td class="py-3 px-3 text-right font-bold text-[13px] rounded-r-md">₹${Number(invoice.amountDue || 0).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Footer Info (Bank, Terms, QR, Sign) -->
                    <div class="mt-auto pt-6 border-t border-slate-200">
                        <div class="flex justify-between items-stretch gap-8 w-full">

                            <!-- Column 1: Terms & Conditions and Sign -->
                            <div class="flex-1 flex flex-col justify-between min-w-0">
                                <div class="mb-8">
                                    <p class="font-bold text-slate-900 text-[9px] uppercase tracking-wider mb-2">Terms & Conditions</p>
                                    <div class="text-[8px] text-slate-500 font-medium leading-relaxed space-y-0.5 pr-4">
                                        ${(() => {
                                            let tncList = [];
                                            const tncRaw = invoice.termsAndConditions;
                                            if (Array.isArray(tncRaw)) {
                                                tncList = tncRaw;
                                            } else if (tncRaw && typeof tncRaw === 'object') {
                                                if (Array.isArray((tncRaw as any).terms)) {
                                                    tncList = (tncRaw as any).terms;
                                                } else if (typeof (tncRaw as any).text === 'string') {
                                                    tncList = (tncRaw as any).text.split(/\n|\\n/).filter((t: string) => t.trim() !== '');
                                                } else {
                                                    tncList = Object.values(tncRaw).filter(v => typeof v === 'string');
                                                }
                                            } else if (typeof tncRaw === 'string') {
                                                try {
                                                    const parsed = JSON.parse(tncRaw);
                                                    if (Array.isArray(parsed)) tncList = parsed;
                                                    else if (parsed && Array.isArray(parsed.terms)) tncList = parsed.terms;
                                                    else if (parsed && typeof parsed.text === 'string') tncList = parsed.text.split(/\n|\\n/).filter((t: string) => t.trim() !== '');
                                                    else if (parsed && typeof parsed === 'object') tncList = Object.values(parsed).filter(v => typeof v === 'string');
                                                    else tncList = tncRaw.split(/\n|\\n/).filter(t => t.trim() !== '');
                                                } catch (e) {
                                                    tncList = tncRaw.split(/\n|\\n/).filter(t => t.trim() !== '');
                                                }
                                            }
                                            return tncList.map((t: string) => `<p>• ${t}</p>`).join('');
                                        })()}
                                    </div>
                                </div>
                                <div class="w-40 mt-auto pt-10">
                                    <div class="h-0 w-full border-t border-slate-300 border-dashed mb-2"></div>
                                    <p class="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center">Authorised Signatory</p>
                                </div>
                            </div>

                            ${Number(invoice.amountDue || 0) > 0 ? `
                            <!-- Column 2: Bank Details -->
                            <div class="w-64 flex flex-col shrink-0">
                                <p class="font-bold text-slate-900 text-[9px] uppercase tracking-wider mb-2">Bank Details</p>
                                <div class="bg-slate-50 border border-slate-100 rounded-lg p-3 w-full h-full">
                                    <div class="grid grid-cols-[60px_1fr] gap-x-2 gap-y-2 text-[8px]">
                                        <span class="text-slate-500 font-medium">Bank Name:</span> <span class="text-slate-900 font-bold">HDFC Bank</span>
                                        <span class="text-slate-500 font-medium">A/C Name:</span> <span class="text-slate-900 font-bold">Papillon</span>
                                        <span class="text-slate-500 font-medium">A/C No.:</span> <span class="text-slate-900 font-bold">50100200</span>
                                        <span class="text-slate-500 font-medium">IFSC Code:</span> <span class="text-slate-900 font-bold">HDFC0001234</span>
                                        <span class="text-slate-500 font-medium">UPI ID:</span> <span class="text-slate-900 font-bold">indux@ybl</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Column 3: QR Code -->
                            <div class="shrink-0 pl-6 border-l border-slate-100 flex flex-col items-center justify-center">
                                <div class="w-[76px] h-[76px] bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-center mb-2 shadow-sm">
                                    <svg class="w-full h-full text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h-2v2h2v-2zm-2 2h-2v2h2v-2zm2 2h-2v2h2v-2zm-2 2h-2v2h2v-2zm-4-6h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2z" />
                                    </svg>
                                </div>
                                <p class="text-[8px] text-slate-500 font-bold uppercase tracking-widest text-center">Scan to Pay</p>
                            </div>
                            ` : ''}

                        </div>
                    </div>
                </div>

                <!-- Footer Strip -->
                <div class="bg-slate-50 border-t border-slate-200">
                    <div class="text-center py-3.5">
                        <p class="text-[9px] font-medium text-slate-500">${settings.bottomMessage || 'We appreciate your business! If you have any questions about this invoice, please contact us.'}</p>
                    </div>
                    <div class="bg-slate-900 text-white py-3 flex justify-center items-center gap-2 text-[8px] uppercase tracking-wider">
                        <span class="font-bold tracking-widest text-white">BillTea by Indux Technology</span>
                    </div>
                </div>
            </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction('Array.from(document.images).every(img => img.complete)', { timeout: 4000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 500)); // wait for tailwind to apply
      await page.evaluateHandle('document.fonts.ready').catch(() => {});
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }
      });
      
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
