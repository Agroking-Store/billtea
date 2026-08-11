import React from 'react';
import { StepProps } from './types';
import { AlertMessage } from '../../../../components/AlertMessage';

export function CompanyProfileStep({ formData, updateData, errors, clearError }: StepProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    clearError('companyLogo');
    updateData({ companyLogo: file });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Company Name</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">domain</span>
          <input
            type="text"
            maxLength={100}
            value={formData.companyName}
            onChange={(e) => { clearError('companyName'); updateData({ companyName: e.target.value }); }}
            placeholder="Acme Corp"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
        <AlertMessage message={errors.companyName} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Company Logo</label>
        <div className="flex items-center input-container rounded-3xl overflow-hidden input-glow px-4 py-4 border-dashed border-2">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-3xl select-none">image</span>
          <div className="w-full">
            <input
              type="file"
              accept="image/*,.heic"
              onChange={handleFileChange}
              className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
            />
            {formData.companyLogo && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">Selected: {formData.companyLogo.name}</p>
            )}
          </div>
        </div>
        <AlertMessage message={errors.companyLogo} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Company Tagline (Optional)</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">subtitles</span>
          <input
            type="text"
            maxLength={100}
            value={formData.tagline}
            onChange={(e) => { clearError('tagline'); updateData({ tagline: e.target.value }); }}
            placeholder="Innovating the future"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
        <AlertMessage message={errors.tagline} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Business Unique ID Name</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">badge</span>
          <input
            type="text"
            maxLength={50}
            value={formData.businessIdName}
            onChange={(e) => { clearError('businessIdName'); updateData({ businessIdName: e.target.value }); }}
            placeholder="e.g. GSTIN, PAN, VAT"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
        <AlertMessage message={errors.businessIdName} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Unique ID Number</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">pin</span>
          <input
            type="text"
            maxLength={20}
            value={formData.businessIdNumber}
            onChange={(e) => { clearError('businessIdNumber'); updateData({ businessIdNumber: e.target.value }); }}
            placeholder="22AAAAA0000A1Z5"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm uppercase"
          />
        </div>
        <AlertMessage message={errors.businessIdNumber} />
      </div>
    </div>
  );
}