import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType } from '@prisma/client';
import * as puppeteer from 'puppeteer';
import { Quotation, QuotationItem, Company, Branch, Customer } from '@prisma/client';

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

  async generateQuotationPdf(
    quotation: any, 
    company: Company, 
    branch: Branch,
    customer: any
  ): Promise<Buffer> {
    const qDate = new Date(quotation.quotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
    const validTillDate = new Date(quotation.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
    
    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    let tagline = '';
    if (company.identifiers) {
      let ids: any[] = [];
      try {
        ids = typeof company.identifiers === 'string' ? JSON.parse(company.identifiers) : company.identifiers;
      } catch(e) {}
      if (Array.isArray(ids)) {
        const tObj = ids.find((i: any) => i.label === 'TAGLINE' || i.key === 'TAGLINE');
        if (tObj) tagline = tObj.value;
      }
    }

    // Fetch settings
    let settings = await this.prisma.documentSettings.findUnique({
      where: { branchId_type: { branchId: branch.id, type: DocumentType.QUOTATION } }
    });

    if (!settings) {
      settings = await this.prisma.documentSettings.create({
        data: {
          branchId: branch.id,
          type: DocumentType.QUOTATION,
          prefix: 'QT-',
          nextNumber: 1,
          topMessage: 'Thank you for considering our company.\nWe are pleased to submit our quotation\nas per your requirements.',
          bottomMessage: 'Thank you for your business.\nWe look forward to being a part of\nyour beautiful journey.',
          terms: '1. VALIDITY: This quotation is valid for 30 days from the date of issue.\n2. PAYMENT TERMS: 50% advance along with Purchase Order, 50% prior to delivery.',
        }
      });
    }

    // Fetch theme settings
    const themeSettings = await this.prisma.themeSettings.findUnique({
      where: { companyId: company.id }
    });
    
    let quoTheme: any = {};
    if (themeSettings && themeSettings.lightTheme) {
      try {
        quoTheme = typeof themeSettings.lightTheme === 'string' ? JSON.parse(themeSettings.lightTheme) : themeSettings.lightTheme;
      } catch (e) {}
    }

    const getThemeVar = (key: string, defaultVal: string) => quoTheme[key] || defaultVal;

    const showSkuHsnCol = settings.showSku || settings.showHsn;
    const prodWidth = showSkuHsnCol ? 'w-[19%]' : 'w-[29%]';
    const imgWidth = showSkuHsnCol ? 'w-[14%]' : 'w-[19%]';

    // items table html
    let itemsHtml = '';
    
    if (quotation.items && quotation.items.length > 0) {
      quotation.items.forEach((item: any, index: number) => {
        const itemName = item.productSnapshot?.name || 'Item';
        const hsn = item.productSnapshot?.hsnNumber || '-';
        const sku = item.productSnapshot?.skuNumber || '-';
        const desc = item.editedDescription || '-';
        
        let taxPercent = '0%';
        let discountPercent = '0%';
        if (item.discountAmount > 0 && item.subtotal > 0) {
            discountPercent = Math.round((item.discountAmount / item.subtotal) * 100) + '%';
        }

        if (item.taxAmount > 0 && item.subtotal > 0) {
            taxPercent = Math.round((item.taxAmount / item.subtotal) * 100) + '%';
        }

        const imgPlaceholder = `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" class="mx-auto block h-[65px] w-auto max-w-[120px]">
          <rect width="160" height="100" fill="#CCCBC9" />
          <g transform="translate(0, 10)">
              <ellipse cx="80" cy="30" rx="42" ry="7" fill="#1B1C1D"/>
              <path d="M38 30 C 38 75, 122 75, 122 30 Z" fill="#3D3E42" />
              <ellipse cx="80" cy="30" rx="40" ry="6" fill="#1B1C1D" />
              <ellipse cx="80" cy="31" rx="36" ry="4" fill="#2B2D31" />
          </g>
        </svg>`;

        let imageUrl = item.editedImage || item.originalImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) imageUrl = `${baseUrl}/${imageUrl.replace(/^\/+/, '')}`;
        const itemImage = imageUrl 
          ? `<img src="${imageUrl}" class="mx-auto block h-[65px] w-auto max-w-[120px] object-cover" />`
          : imgPlaceholder;

        itemsHtml += `
          <tr class="bg-[var(--quo-surface-alt)] border-b border-[var(--quo-border)]">
            <td class="py-2 px-2 border-x border-[var(--quo-border)] text-[14px]">${index + 1}</td>
            <td class="py-2 px-2 border-x border-[var(--quo-border)]">
              <div class="font-bold text-[13px] text-[var(--quo-text)] tracking-[0.05em] uppercase leading-tight mb-1 mt-1">${itemName}</div>
              <div class="text-[var(--quo-text-muted)] font-medium text-[11px] uppercase pb-1">${desc}</div>
            </td>
            ${showSkuHsnCol ? `
            <td class="py-2 px-2 border-x border-[var(--quo-border)]">
              ${settings.showSku ? `<div class="text-[14px]">${sku}</div>` : ''}
              ${settings.showHsn ? `<div class="text-[var(--quo-text-muted)] text-[12px] ${!settings.showSku ? 'font-bold text-[14px] mt-1' : ''}">${settings.showSku ? 'HSN: ' : ''}${hsn}</div>` : ''}
            </td>
            ` : ''}
            <td class="py-2 px-2 border-x border-[var(--quo-border)] text-[14px]">${item.quantity}</td>
            <td class="py-2 px-2 border-x border-[var(--quo-border)] text-[14px]">${item.editedPrice.toLocaleString('en-IN')}</td>
            <td class="py-2 px-2 border-x border-[var(--quo-border)]">
              <div class="text-[14px]">${discountPercent}</div>
              <div class="text-[var(--quo-text-muted)] text-[12px]">(₹ ${item.discountAmount.toLocaleString('en-IN')})</div>
            </td>
            <td class="py-2 px-2 border-x border-[var(--quo-border)]">
              <div class="text-[14px]">${taxPercent}</div>
              <div class="text-[var(--quo-text-muted)] text-[12px]">(₹ ${item.taxAmount.toLocaleString('en-IN')})</div>
            </td>
            <td class="py-2 px-2 border-x border-[var(--quo-border)] text-[14px]">${item.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td class="py-2 px-2 border-x border-[var(--quo-border)]">
              ${itemImage}
            </td>
          </tr>
        `;
      });
    }

    // Use settings.terms instead of quotation.termsAndConditions if available, wait, 
    // terms should be fetched from the quotation itself if it was overridden.
    // The requirement says: "Pre-populate the Terms & Conditions text area by fetching the DocumentSettings API when the page mounts."
    // So the quotation will already have the correct terms. But we still need topMessage and bottomMessage.
    
    const topMessageHtml = settings.topMessage ? settings.topMessage.split('\\n').map((m: string) => `<div>${m}</div>`).join('') : '';
    const bottomMessageHtml = settings.bottomMessage ? settings.bottomMessage.split('\\n').map((m: string) => `<div>${m}</div>`).join('') : '';

    let tncList: string[] = [];
    const tncRaw = quotation.termsAndConditions;
    if (Array.isArray(tncRaw)) {
      tncList = tncRaw;
    } else if (tncRaw && typeof tncRaw === 'object') {
      if (Array.isArray((tncRaw as any).terms)) {
         tncList = (tncRaw as any).terms;
      } else if (typeof (tncRaw as any).text === 'string') {
         tncList = (tncRaw as any).text.split('\\n').filter((t: string) => t.trim() !== '');
      } else {
         tncList = Object.values(tncRaw).filter(v => typeof v === 'string') as string[];
      }
    } else if (typeof tncRaw === 'string') {
      try {
         const parsed = JSON.parse(tncRaw);
         if (Array.isArray(parsed)) tncList = parsed;
         else if (parsed && Array.isArray(parsed.terms)) tncList = parsed.terms;
         else if (parsed && typeof parsed.text === 'string') tncList = parsed.text.split('\\n').filter((t: string) => t.trim() !== '');
         else if (parsed && typeof parsed === 'object') tncList = Object.values(parsed).filter(v => typeof v === 'string') as string[];
         else tncList = tncRaw.split('\\n').filter(t => t.trim() !== '');
      } catch (e) {
         tncList = tncRaw.split('\\n').filter(t => t.trim() !== '');
      }
    }

    let tncHtml = '';
    if (tncList && tncList.length > 0) {
      tncHtml = tncList.map((t: string) => `
        <li class="flex items-start text-xs">
          <span class="mr-2 text-[var(--quo-primary)]">•</span>
          <span class="flex-1">${t.trim()}</span>
        </li>
      `).join('');
    } else {
      tncHtml = `
        <li class="flex items-start text-xs">
          <span class="mr-2 text-[var(--quo-primary)]">•</span>
          <span class="flex-1">As per mutual discussion</span>
        </li>
      `;
    }

    const upiLink = `upi://pay?pa=${branch.upiId}&pn=${encodeURIComponent(company.name)}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}&color=000&bgcolor=fff&margin=0`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Great+Vibes&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            background: #fff;
          }
          .font-serif {
            font-family: 'Playfair Display', serif;
          }
          .font-signature {
            font-family: 'Great Vibes', cursive;
          }
          :root {
            --quo-bg: ${getThemeVar('--quo-bg', '#FFFFFF')};
            --quo-surface: ${getThemeVar('--quo-surface', '#1B1C1D')};
            --quo-surface-alt: ${getThemeVar('--quo-surface-alt', '#F9F7F5')};
            --quo-primary: ${getThemeVar('--quo-primary', '#9D7E6C')};
            --quo-border: ${getThemeVar('--quo-border', '#e2e2e2')};
            --quo-text: ${getThemeVar('--quo-text', '#1a1c1c')};
            --quo-text-muted: ${getThemeVar('--quo-text-muted', '#74777c')};
          }
        </style>
      </head>
      <body class="w-[1000px] bg-[var(--quo-bg)] relative overflow-hidden flex flex-col text-[var(--quo-text)] mx-auto min-h-[1405px]">
        
        <div class="flex relative h-[250px]">
          <div 
            class="absolute left-0 top-0 h-full w-[40%] bg-[var(--quo-surface)] z-0"
            style="clip-path: polygon(0 0, 100% 0, 75% 100%, 0 100%);"
          ></div>

          <div class="w-[30%] text-[var(--quo-primary)] p-8 pr-6 flex flex-col items-center justify-center relative z-10 h-full">
            ${company.logo ? `
                <div class="w-[100px] h-[100px] rounded-full overflow-hidden bg-white/5 flex items-center justify-center mb-4 border border-[#D1B08C]/20 shadow-md">
                    <img src="${company.logo.startsWith('http') || company.logo.startsWith('data:') ? company.logo : `${baseUrl}/${company.logo.replace(/^\/+/, '')}`}" alt="${company.name}" class="w-full h-full object-cover" />
                </div>
                <h1 class="text-[16px] font-serif tracking-[0.25em] text-white mb-2 uppercase opacity-90 text-center">${company.name}</h1>
            ` : `
                <h1 class="text-[28px] font-serif tracking-[0.25em] text-white mb-2 uppercase opacity-90 text-center">${company.name}</h1>
            `}
            ${tagline ? `
                <div class="text-center font-serif text-[11px] italic text-[#D1B08C] leading-snug tracking-wider">
                  <p>${tagline}</p>
                </div>
            ` : ''}
          </div>

          <div class="w-[70%] flex items-center justify-end pr-16 relative z-10 h-full">
            <div class="flex flex-col items-end text-right">
              <h2 class="font-serif text-[46px] text-[var(--quo-text)] leading-none tracking-widest mb-4 uppercase">QUOTATION</h2>
              <div class="flex items-center justify-end w-40 mb-5 opacity-80">
                <div class="flex-1 h-[1.5px] bg-[var(--quo-primary)]"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-[var(--quo-primary)] mx-2"></div>
                <div class="w-8 h-[1.5px] bg-[var(--quo-primary)]"></div>
              </div>
              
              <div class="text-[12px] leading-[1.7] text-[var(--quo-text-muted)] max-w-[260px] opacity-90">
                ${topMessageHtml}
              </div>
            </div>
          </div>
        </div>

        <div class="px-10 mt-6 mb-8 flex">
          <div class="w-[26%] pl-2 pr-4">
            <div class="flex items-center mb-3">
              <h3 class="uppercase text-[var(--quo-primary)] text-[10px] font-semibold tracking-[0.2em] mr-4">COMPANY DETAILS</h3>
              <div class="w-10 h-[1.5px] bg-[var(--quo-primary)]"></div>
            </div>
            <h4 class="font-semibold text-[13px] text-[var(--quo-text)] mb-1">${company.name}</h4>
            <p class="text-[12px] text-[var(--quo-text-muted)] leading-[1.7]">
              ${branch.city || ''}${branch.state ? ', ' + branch.state : ''}
              ${branch.phone ? '<br/>' + branch.phone : ''}
              ${branch.email ? '<br/>' + branch.email : ''}
            </p>
            ${company.identifiers && Array.isArray(company.identifiers) && company.identifiers.length > 0 ? 
              company.identifiers.filter((i:any) => (i.label || i.name)?.toUpperCase() !== 'TAGLINE').map((i:any) => `<p class="text-[11px] text-[var(--quo-text)] mt-2 tracking-wide font-medium uppercase">${i.label || i.name}: ${i.value}</p>`).join('')
            : ''}
          </div>
          
          <div class="w-[42%] pl-6 border-l border-[var(--quo-primary)]">
            <div class="flex items-center mb-3">
              <h3 class="uppercase text-[var(--quo-primary)] text-[10px] font-semibold tracking-[0.2em] mr-4">CLIENT DETAILS</h3>
              <div class="w-10 h-[1.5px] bg-[var(--quo-primary)]"></div>
            </div>
            <h4 class="font-semibold text-[13px] text-[var(--quo-text)] mb-0.5">${customer.customerName}</h4>
            <p class="text-[11px] text-[var(--quo-text-muted)] mb-2 uppercase tracking-wide">${customer.companyName || ''}</p>
            <div class="text-[12px] text-[var(--quo-text-muted)] leading-[1.7]">
              <p class="mb-1">${customer.mobileNumber || ''} ${customer.businessLabel && customer.businessLabelValue ? `<span class="mx-2 text-[var(--quo-border)]">|</span> ${customer.businessLabel.toUpperCase()}: ${customer.businessLabelValue}` : ''}</p>
              <p class="mb-1"><span class="font-semibold text-[var(--quo-text)]">Billing:</span> ${quotation.billingAddressSnapshot?.address || '-'}, ${quotation.billingAddressSnapshot?.city || ''}</p>
              <p><span class="font-semibold text-[var(--quo-text)]">Shipping:</span> ${quotation.shippingAddressSnapshot?.address || '-'}, ${quotation.shippingAddressSnapshot?.city || ''}</p>
            </div>
          </div>
          
          <div class="w-[32%] pl-6 border-l border-[var(--quo-primary)]">
            <div class="flex items-center mb-3">
              <h3 class="uppercase text-[var(--quo-primary)] text-[10px] font-semibold tracking-[0.2em] mr-4">ORDER DETAILS</h3>
              <div class="w-10 h-[1.5px] bg-[var(--quo-primary)]"></div>
            </div>
            <div class="flex flex-col gap-3 text-[11px] text-[var(--quo-text)]">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-[14px] text-[var(--quo-primary)]">description</span>
                <div class="flex flex-1">
                  <span class="w-24 font-medium text-[var(--quo-text-muted)]">Quotation No.</span>
                  <span class="font-semibold">: ${quotation.quotationNumber}</span>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-[14px] text-[var(--quo-primary)]">calendar_month</span>
                <div class="flex flex-1">
                  <span class="w-24 font-medium text-[var(--quo-text-muted)]">Date</span>
                  <span class="font-semibold">: ${qDate}</span>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-[14px] text-[var(--quo-primary)]">event_available</span>
                <div class="flex flex-1">
                  <span class="w-24 font-medium text-[var(--quo-text-muted)]">Valid Till</span>
                  <span class="font-semibold">: ${validTillDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-8 mb-6 mt-2">
          <table class="w-full text-center border-collapse border-b border-[var(--quo-border)]">
            <thead>
              <tr class="bg-[var(--quo-surface)] text-[var(--quo-primary)] text-[10px] uppercase font-bold tracking-[0.1em]">
                <th class="py-[16px] px-2 font-bold w-[5%]">#</th>
                <th class="py-[16px] px-2 font-bold ${prodWidth}">PRODUCT</th>
                ${settings.showSku && settings.showHsn ? `<th class="py-[16px] px-2 font-bold w-[15%]">SKU / HSN NUMBER</th>` : ''}
                ${settings.showSku && !settings.showHsn ? `<th class="py-[16px] px-2 font-bold w-[15%]">SKU NUMBER</th>` : ''}
                ${!settings.showSku && settings.showHsn ? `<th class="py-[16px] px-2 font-bold w-[15%]">HSN NUMBER</th>` : ''}
                <th class="py-[16px] px-2 font-bold w-[5%]">QTY</th>
                <th class="py-[16px] px-2 font-bold w-[12%]">UNIT PRICE (₹)</th>
                <th class="py-[16px] px-2 font-bold w-[10%]">DISCOUNT %</th>
                <th class="py-[16px] px-2 font-bold w-[8%]">TAX %</th>
                <th class="py-[16px] px-2 font-bold w-[12%]">TOTAL (₹)</th>
                <th class="py-[16px] px-2 font-bold ${imgWidth}">PRODUCT IMG</th>
              </tr>
            </thead>
            <tbody class="text-[13px] text-[var(--quo-text)] align-middle">
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div class="px-8 flex">
          <div class="w-[33%] pr-4 pb-2">
            <div class="flex items-center mb-4">
              <h3 class="uppercase text-[var(--quo-primary)] text-[11px] font-semibold tracking-wider mr-4">TERMS & CONDITIONS</h3>
              <div class="w-10 h-[1.5px] bg-[var(--quo-primary)]"></div>
            </div>
            <ul class="text-[11px] text-[var(--quo-text)] leading-[1.6] space-y-[10px]">
              ${tncHtml}
            </ul>
          </div>

          <div class="w-[33%] pl-8 border-l border-[var(--quo-primary)] pb-2">
            <div class="flex items-center mb-4">
              <h3 class="uppercase text-[var(--quo-primary)] text-[11px] font-semibold tracking-wider mr-4">BANK DETAILS</h3>
              <div class="w-10 h-[1.5px] bg-[var(--quo-primary)]"></div>
            </div>
            <div class="text-[11px] text-[var(--quo-text)] space-y-3">
              <div class="flex">
                <span class="w-[75px] font-medium text-[var(--quo-text-muted)]">Bank Name</span><span class="mr-8 text-[var(--quo-text-muted)]">:</span><span class="font-medium text-[var(--quo-text)]">${branch.bankName || '-'}</span>
              </div>
              <div class="flex">
                <span class="w-[75px] font-medium text-[var(--quo-text-muted)]">A/C Name</span><span class="mr-8 text-[var(--quo-text-muted)]">:</span><span class="font-medium text-[var(--quo-text)]">${company.name}</span>
              </div>
              <div class="flex">
                <span class="w-[75px] font-medium text-[var(--quo-text-muted)]">A/C No.</span><span class="mr-8 text-[var(--quo-text-muted)]">:</span><span class="font-medium text-[var(--quo-text)]">${branch.accountNumber || '-'}</span>
              </div>
              <div class="flex">
                <span class="w-[75px] font-medium text-[var(--quo-text-muted)]">IFSC Code</span><span class="mr-8 text-[var(--quo-text-muted)]">:</span><span class="font-medium text-[var(--quo-text)]">${branch.ifscCode || '-'}</span>
              </div>
              <div class="flex">
                <span class="w-[75px] font-medium text-[var(--quo-text-muted)]">UPI ID</span><span class="mr-8 text-[var(--quo-text-muted)]">:</span><span class="font-medium text-[var(--quo-text)]">${branch.upiId || '-'}</span>
              </div>
            </div>
          </div>

          <div class="w-[34%] ml-auto bg-[var(--quo-bg)] flex flex-col">
            <div class="flex border border-[var(--quo-border)] border-b-0 bg-[var(--quo-surface-alt)]">
               <span class="px-5 py-4 uppercase text-[10px] tracking-widest text-[var(--quo-text-muted)] w-1/2 border-r border-[var(--quo-border)]">SUBTOTAL</span>
               <span class="px-5 py-4 text-right w-1/2 text-sm font-medium">₹ ${quotation.subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div class="flex border border-[var(--quo-border)] border-b-0 bg-[var(--quo-surface-alt)]">
               <span class="px-5 py-4 uppercase text-[10px] tracking-widest text-[var(--quo-text-muted)] w-1/2 border-r border-[var(--quo-border)]">DISCOUNT %</span>
               <span class="px-5 py-4 text-right w-1/2 text-sm font-medium">₹ ${quotation.discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div class="flex border border-[var(--quo-border)] border-b-0 bg-[var(--quo-surface-alt)]">
               <span class="px-5 py-4 uppercase text-[10px] tracking-widest text-[var(--quo-text-muted)] w-1/2 border-r border-[var(--quo-border)]">TAX %</span>
               <span class="px-5 py-4 text-right w-1/2 text-sm font-medium">₹ ${quotation.taxAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div class="bg-[var(--quo-surface)] text-white p-5 flex flex-col">
               <span class="uppercase text-[10px] tracking-widest text-[var(--quo-primary)] mb-1">GRAND TOTAL</span>
               <span class="font-serif text-[32px] text-[var(--quo-primary)] tracking-wide leading-none mb-2">₹ ${quotation.grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
               <p class="text-[10px] text-[#c3c7cb] leading-snug">
                 (Rupees ${numberToWordsRupees(quotation.grandTotal)})
               </p>
            </div>
          </div>
        </div>

        <!-- Pre-Footer Grid (Pushed to bottom using mt-auto if needed, but min-h makes it stretch) -->
        <div class="mx-10 mt-auto pt-6 pb-2 flex items-end justify-between">
          <div class="flex flex-col items-start relative w-[25%] pl-2">
             <span class="text-[10.5px] text-[var(--quo-text-muted)] mb-1">Prepared By</span>
             <span class="text-[11.5px] text-[var(--quo-text)] font-medium z-10 relative bg-[var(--quo-bg)] pr-2">${company.name}</span>
             <div class="font-signature text-4xl text-[var(--quo-text)] mt-2 -ml-2 -mb-2 relative z-10 transform -rotate-2">
               ${branch.signatureValue ? 
                  (branch.signatureValue.startsWith('data:image') || branch.signatureValue.startsWith('/uploads') || branch.signatureValue.startsWith('http')
                    ? `<img src="${branch.signatureValue.startsWith('http') || branch.signatureValue.startsWith('data:') ? branch.signatureValue : `${baseUrl}/${branch.signatureValue.replace(/^\/+/, '')}`}" style="max-height: 40px;"/>` 
                    : branch.signatureValue) 
                  : 'Authorised'}
             </div>
          </div>

          <div class="text-center w-[40%] pb-[14px]">
             <div class="font-serif text-[15px] text-[var(--quo-text)] leading-[1.6]">
               ${bottomMessageHtml}
             </div>
             <div class="w-8 h-[1.5px] bg-[var(--quo-primary)] mx-auto mt-4"></div>
          </div>

          <div class="w-[35%] flex justify-end items-center pr-2 pb-2">
             <div class="h-[75px] w-[1.5px] bg-[var(--quo-primary)] mr-5 opacity-40"></div>
             ${branch.upiId ? `
             <div class="border border-[var(--quo-primary)] p-[4px] rounded-sm mr-5 shrink-0 bg-white">
               <img src="${qrCodeUrl}" alt="Payment QR Code" class="w-[72px] h-[72px] block" />
             </div>
             ` : ''}
             <div class="flex flex-col relative w-[130px] pt-1">
                <span class="text-[11px] font-bold tracking-[0.08em] pb-[2px] uppercase text-[var(--quo-text)] leading-tight">PAYMENT QR</span>
                <span class="text-[10px] font-medium tracking-[0.05em] uppercase text-[var(--quo-text-muted)] leading-tight mt-[2px]">SCAN TO PAY</span>
                
                <svg class="w-[140px] h-5 text-[var(--quo-primary)] mt-2 block -ml-2" viewBox="0 0 140 20" fill="none" stroke="currentColor">
                   <path d="M2 16 L125 16 Q135 16, 137 5 M132 8 L137 5 L140 10" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
             </div>
          </div>
        </div>

        <div class="bg-[var(--quo-surface)] px-12 py-[16px] flex items-center justify-center border-t border-[var(--quo-primary)]/20 w-full mt-0 shadow-[0_20px_0_0_#1B1C1D]">
           <span class="text-[var(--quo-primary)] text-[10px] uppercase tracking-[0.3em] font-medium opacity-80 flex items-center gap-3">
              <span class="w-8 h-[1px] bg-[var(--quo-primary)]/40"></span>
              BillTea By Indux Technology
              <span class="w-8 h-[1px] bg-[var(--quo-primary)]/40"></span>
           </span>
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
      await page.waitForFunction('window.tailwind !== undefined && document.querySelectorAll("style").length > 0', { timeout: 3000 }).catch(() => {});
      await page.waitForFunction('Array.from(document.images).every(img => img.complete)', { timeout: 4000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 500)); // wait for tailwind to apply
      await page.evaluateHandle('document.fonts.ready').catch(() => {});
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
      });
      
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
