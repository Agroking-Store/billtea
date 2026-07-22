import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Company, Branch } from '@prisma/client';

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
  constructor() {}

  async generateInvoicePdf(
    invoice: any, 
    company: Company, 
    branch: Branch,
    customer: any
  ): Promise<Buffer> {
    const iDate = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const dDate = new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    
    // items table html
    let itemsHtml = '';
    let totalQty = 0;
    
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item: any, index: number) => {
        totalQty += item.quantity;
        const itemName = item.productSnapshot?.name || 'Item';
        const hsn = item.productSnapshot?.hsn || '-';
        const sku = item.productSnapshot?.sku || '-';
        const desc = item.editedDescription || '-';
        
        // Parse tax percentage if possible or default to empty
        let taxPercent = '18%';
        if (item.taxAmount > 0 && item.subtotal > 0) {
            taxPercent = Math.round((item.taxAmount / item.subtotal) * 100) + '%';
        }

        itemsHtml += `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td class="text-center">-</td>
            <td>${itemName}</td>
            <td class="text-center">${hsn}</td>
            <td class="text-center">${sku}</td>
            <td>${desc}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">₹${item.editedPrice.toFixed(2)}</td>
            <td class="text-right">₹${item.subtotal.toFixed(2)}</td>
            <td class="text-right">₹${item.discountAmount.toFixed(2)}</td>
            <td class="text-right text-xs">GST(${taxPercent})<br>₹${item.taxAmount.toFixed(2)}</td>
            <td class="text-right font-semibold">₹${item.total.toFixed(2)}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml += `<tr><td colspan="12" class="text-center">No items</td></tr>`;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 30px;
          color: #333;
          font-size: 11px;
        }

        /* Top Centered Title */
        .top-title {
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 20px;
        }

        /* Header Grid */
        .header-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          gap: 15px;
        }
        
        .header-left img {
          width: 80px;
          height: auto;
          object-fit: contain;
          border: 1px solid #e5e7eb;
        }
        
        .header-left .company-info p {
          margin: 3px 0;
          color: #4b5563;
        }

        .header-left .company-name {
          font-size: 16px;
          font-weight: 700;
          color: #000;
          margin: 0 0 5px 0;
        }

        .header-right {
          text-align: right;
        }
        
        .header-right p {
          margin: 4px 0;
          font-size: 12px;
        }

        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 15px 0;
        }

        /* Billing / Shipping section */
        .address-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .address-col {
          flex: 1;
        }
        
        .address-title {
          font-weight: 700;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .address-col p {
          margin: 4px 0;
          color: #374151;
        }
        .address-name {
          font-weight: 700;
          color: #000;
        }

        .top-message {
          margin-bottom: 10px;
          color: #4b5563;
        }

        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }

        th {
          background-color: #555;
          color: #fff;
          font-weight: 600;
          padding: 8px 5px;
          font-size: 10px;
          border-right: 1px solid #666;
        }
        th:last-child { border-right: none; }

        td {
          padding: 8px 5px;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
          vertical-align: middle;
        }

        /* Row Total */
        .table-total-row td {
          background-color: #f9fafb;
          font-weight: 600;
          color: #000;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-semibold { font-weight: 600; }
        .text-xs { font-size: 9px; }

        /* Summary Area */
        .summary-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 15px;
        }

        .summary-table {
          width: 250px;
          border-collapse: collapse;
        }
        .summary-table td {
          border: none;
          padding: 4px 5px;
          color: #000;
          font-weight: 500;
        }

        /* Grand Total Bar */
        .grand-total-bar {
          background-color: #111;
          color: #fff;
          padding: 10px 15px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 20px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .balance-due-bar {
          background-color: #ef4444;
          color: #fff;
          padding: 10px 15px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 20px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        /* Words amount */
        .amount-words {
          font-weight: 500;
          margin-bottom: 30px;
        }

        /* Terms Box */
        .terms-box {
          background-color: #f8fafc;
          padding: 15px;
          margin-bottom: 40px;
        }
        .terms-title {
          font-weight: 700;
          margin-bottom: 8px;
        }
        .terms-text {
          white-space: pre-line;
          color: #4b5563;
        }

        /* Footer signatures */
        .footer-signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 50px;
          page-break-inside: avoid;
        }
        
        .sig-box {
          width: 250px;
        }
        
        .sig-line {
          border-top: 1px solid #000;
          margin-bottom: 5px;
        }
        
        .sig-title {
          font-weight: 600;
          font-size: 10px;
        }
        .sig-right-title {
          text-align: center;
          font-weight: 600;
          font-size: 10px;
          margin-bottom: 40px;
        }
      </style>
    </head>
    <body>
      
      <div class="top-title">TAX INVOICE</div>

      <div class="header-grid">
        <div class="header-left">
          <div class="company-info">
            <h1 class="company-name">${company.name}</h1>
            <p>${branch.address}, ${branch.city}, ${branch.state} ${branch.pincode}</p>
            <p>${branch.phone} | ${branch.email}</p>
          </div>
        </div>
        <div class="header-right">
          <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> ${iDate}</p>
          <p><strong>Due Date:</strong> ${dDate}</p>
          <p><strong>Place of Supply:</strong> ${branch.state || '-'}</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="address-grid">
        <div class="address-col">
          <div class="address-title">Billed To:</div>
          <p class="address-name">${customer.customerName || invoice.customerSnapshot?.customerName || ''}</p>
          <p>${customer.companyName || invoice.customerSnapshot?.companyName || ''}</p>
          <p>${customer.address || invoice.customerSnapshot?.address || ''}</p>
          <p>Phone: ${customer.mobileNumber || invoice.customerSnapshot?.mobileNumber || ''}</p>
          <p>Email: ${customer.email || invoice.customerSnapshot?.email || ''}</p>
        </div>
        <div class="address-col">
          <div class="address-title">Shipped To:</div>
          <p class="address-name">${customer.customerName || invoice.customerSnapshot?.customerName || ''}</p>
          <p>${customer.companyName || invoice.customerSnapshot?.companyName || ''}</p>
          <p>${customer.address || invoice.customerSnapshot?.address || ''}</p>
          <p>Phone: ${customer.mobileNumber || invoice.customerSnapshot?.mobileNumber || ''}</p>
          <p>Email: ${customer.email || invoice.customerSnapshot?.email || ''}</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="top-message">Top MEssage</div>

      <table>
        <thead>
          <tr>
            <th class="text-center">#</th>
            <th class="text-center">Image</th>
            <th>Item Name</th>
            <th class="text-center">HSN</th>
            <th class="text-center">SKU</th>
            <th>Description</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Subtotal</th>
            <th class="text-right">Discount</th>
            <th class="text-right">Tax</th>
            <th class="text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="table-total-row">
            <td colspan="6" class="text-right">TOTAL</td>
            <td class="text-center">${totalQty}</td>
            <td></td>
            <td class="text-right">₹${invoice.subtotal.toFixed(2)}</td>
            <td class="text-right">₹${invoice.discountAmount.toFixed(2)}</td>
            <td class="text-right">₹${invoice.taxAmount.toFixed(2)}</td>
            <td class="text-right">₹${invoice.grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="summary-container">
        <table class="summary-table">
          <tr>
            <td class="text-right">Subtotal</td>
            <td class="text-right">₹${invoice.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="text-right font-semibold">Discount</td>
            <td class="text-right">- ₹${invoice.discountAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="text-right font-semibold">Tax</td>
            <td class="text-right">+ ₹${invoice.taxAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="text-right font-semibold">Amount Paid</td>
            <td class="text-right">- ₹${invoice.amountPaid.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div class="grand-total-bar">
        <span>Grand Total</span>
        <span>₹${invoice.grandTotal.toFixed(2)}</span>
      </div>

      ${invoice.amountDue > 0 ? `
      <div class="balance-due-bar">
        <span>Balance Due</span>
        <span>₹${invoice.amountDue.toFixed(2)}</span>
      </div>
      ` : ''}

      <div class="amount-words">
        <strong>Amount in Words:</strong> ${numberToWordsRupees(invoice.grandTotal)}
      </div>

      ${(() => {
        let tncList: string[] = [];
        const tncRaw = invoice.termsAndConditions;
        if (Array.isArray(tncRaw)) {
          tncList = tncRaw;
        } else if (tncRaw && typeof tncRaw === 'object') {
          if (Array.isArray((tncRaw as any).terms)) {
             tncList = (tncRaw as any).terms;
          } else if (typeof (tncRaw as any).text === 'string') {
             tncList = (tncRaw as any).text.split('\n').filter((t: string) => t.trim() !== '');
          } else {
             tncList = Object.values(tncRaw).filter(v => typeof v === 'string') as string[];
          }
        } else if (typeof tncRaw === 'string') {
          try {
             const parsed = JSON.parse(tncRaw);
             if (Array.isArray(parsed)) tncList = parsed;
             else if (parsed && Array.isArray(parsed.terms)) tncList = parsed.terms;
             else if (parsed && typeof parsed.text === 'string') tncList = parsed.text.split('\n').filter((t: string) => t.trim() !== '');
             else if (parsed && typeof parsed === 'object') tncList = Object.values(parsed).filter(v => typeof v === 'string') as string[];
             else tncList = tncRaw.split('\n').filter(t => t.trim() !== '');
          } catch (e) {
             tncList = tncRaw.split('\n').filter(t => t.trim() !== '');
          }
        }

        if (tncList && tncList.length > 0) {
          const formattedTnc = tncList.map(t => `<div style="margin-bottom: 2px;">• ${t}</div>`).join('');
          return `
            <div class="terms-box">
              <div class="terms-title">Terms & Conditions:</div>
              <div class="terms-text">${formattedTnc}</div>
            </div>
          `;
        }
        return '';
      })()}

      <div class="footer-signatures">
        <div class="sig-box">
          <div class="sig-title">Receiver's Signature</div>
          <div class="sig-line" style="margin-top: 40px;"></div>
        </div>
        <div class="sig-box">
          <div class="sig-right-title">For ${company.name}</div>
          <div class="sig-line"></div>
          <div class="sig-title" style="text-align: center;">Authorised Signatory</div>
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
