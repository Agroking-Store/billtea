import React from 'react';
import { StepProps } from './types';

export function BankDetailsStep({ formData, updateData }: StepProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 mb-4 text-sm text-emerald-800 dark:text-emerald-300">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-emerald-500 mt-0.5">info</span>
          <p>
            <strong>Note:</strong> These bank details are strictly used to display on your generated Invoices or Quotation PDFs so your clients know where to send payments.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Bank Name</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">account_balance</span>
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => updateData({ bankName: e.target.value })}
            placeholder="e.g. HDFC Bank"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Account Name</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">badge</span>
          <input
            type="text"
            value={formData.accountName}
            onChange={(e) => updateData({ accountName: e.target.value })}
            placeholder="e.g. Acme Corp Private Limited"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Account Number</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">numbers</span>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => updateData({ accountNumber: e.target.value })}
            placeholder="Account Number"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">IFSC Code</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">account_balance_wallet</span>
          <input
            type="text"
            value={formData.ifscCode}
            onChange={(e) => updateData({ ifscCode: e.target.value })}
            placeholder="e.g. HDFC0001234"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm uppercase"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">UPI ID (Optional)</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">qr_code</span>
          <input
            type="text"
            value={formData.upiId}
            onChange={(e) => updateData({ upiId: e.target.value })}
            placeholder="e.g. acmecorp@upi"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
