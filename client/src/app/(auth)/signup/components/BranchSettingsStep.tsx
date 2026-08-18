import React from 'react';
import { StepProps } from './types';
import { AlertMessage } from '../../../../components/AlertMessage';

export function BranchSettingsStep({ formData, updateData, errors, clearError }: StepProps) {
  const addTax = () => {
    if (formData.taxes.length < 5) {
      updateData({ taxes: [...formData.taxes, { label: '', percentage: 0 }] });
    }
  };

  const removeTax = (index: number) => {
    const newTaxes = formData.taxes.filter((_, i) => i !== index);
    updateData({ taxes: newTaxes });
  };

  const updateTax = (index: number, field: 'label' | 'percentage', value: string) => {
    const newTaxes = [...formData.taxes];
    if (field === 'percentage') {
      newTaxes[index].percentage = parseFloat(value) || 0;
    } else {
      newTaxes[index].label = value;
    }
    updateData({ taxes: newTaxes });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Branch Name</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">storefront</span>
          <input
            type="text"
            maxLength={100}
            value={formData.branchName}
            onChange={(e) => { clearError('branchName'); updateData({ branchName: e.target.value }); }}
            placeholder="Main Branch"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
        <AlertMessage message={errors.branchName} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Phone</label>
          <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
            <input
              type="text"
              maxLength={10}
              value={formData.branchPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                clearError('branchPhone');
                updateData({ branchPhone: val });
              }}
              placeholder="Branch Phone"
              className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
            />
          </div>
          <AlertMessage message={errors.branchPhone} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Email</label>
          <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
            <input
              type="email"
              maxLength={100}
              value={formData.branchEmail}
              onChange={(e) => { clearError('branchEmail'); updateData({ branchEmail: e.target.value }); }}
              placeholder="Branch Email"
              className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
            />
          </div>
          <AlertMessage message={errors.branchEmail} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Address</label>
        <div className="flex items-start input-container rounded-3xl overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 mt-2 text-xl select-none">location_on</span>
          <textarea
            maxLength={200}
            value={formData.address}
            onChange={(e) => { clearError('address'); updateData({ address: e.target.value }); }}
            placeholder="Street address... (max 200 characters)"
            rows={2}
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm resize-none"
          />
        </div>
        <AlertMessage message={errors.address} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">City</label>
          <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
            <input
              type="text"
              maxLength={50}
              value={formData.city}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-z\s.'-]/g, '');
                clearError('city');
                updateData({ city: val });
              }}
              placeholder="City"
              className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
            />
          </div>
          <AlertMessage message={errors.city} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">State</label>
          <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
            <input
              type="text"
              maxLength={50}
              value={formData.state}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-z\s.'-]/g, '');
                clearError('state');
                updateData({ state: val });
              }}
              placeholder="State"
              className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
            />
          </div>
          <AlertMessage message={errors.state} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Pincode</label>
          <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
            <input
              type="text"
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                clearError('pincode');
                updateData({ pincode: val });
              }}
              placeholder="Pincode"
              className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
            />
          </div>
          <AlertMessage message={errors.pincode} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Signature Text</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">draw</span>
          <input
            type="text"
            maxLength={100}
            value={formData.signatureText}
            onChange={(e) => { clearError('signatureText'); updateData({ signatureText: e.target.value }); }}
            placeholder="For Acme Corp"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
        <AlertMessage message={errors.signatureText} />
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Tax Labels (Max 5)</label>
          {formData.taxes.length < 5 && (
            <button type="button" onClick={addTax} className="text-xs text-primary hover:text-primary-fixed-dim font-bold flex items-center">
              <span className="material-symbols-outlined text-[16px] mr-1">add_circle</span> Add Tax
            </button>
          )}
        </div>
        
        {formData.taxes.map((tax, i) => (
          <div key={i} className="flex gap-2 items-center animate-fade-in">
            <div className="flex-1 input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
              <input
                type="text"
                maxLength={20}
                value={tax.label}
                onChange={(e) => updateTax(i, 'label', e.target.value)}
                placeholder="e.g. CGST"
                className="w-full bg-transparent border-none text-on-surface focus:ring-0 focus:outline-none py-2 text-sm"
              />
            </div>
            <div className="w-24 flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
              <input
                type="number"
                min={0}
                max={100}
                value={tax.percentage || ''}
                onChange={(e) => updateTax(i, 'percentage', e.target.value)}
                placeholder="9"
                className="w-full bg-transparent border-none text-on-surface focus:ring-0 focus:outline-none py-2 text-sm"
              />
              <span className="text-on-surface-variant text-sm ml-1">%</span>
            </div>
            <button type="button" onClick={() => removeTax(i)} className="text-error hover:bg-error/10 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}