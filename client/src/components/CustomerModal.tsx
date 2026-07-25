import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/auth';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  editCustomerId?: string | null;
  initialData?: any;
  onSaveSuccess: (customer: any) => void;
}

export default function CustomerModal({ isOpen, onClose, branchId, editCustomerId, initialData, onSaveSuccess }: CustomerModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    email: '',
    mobileNumber: '',
    businessLabel: '',
    businessLabelValue: '',
    address: '',
    otherInfo: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          customerName: initialData.customerName || '',
          companyName: initialData.companyName || '',
          email: initialData.email || '',
          mobileNumber: initialData.mobileNumber || '',
          businessLabel: initialData.businessLabel || '',
          businessLabelValue: initialData.businessLabelValue || '',
          address: initialData.address || '',
          otherInfo: initialData.otherInfo || ''
        });
      } else {
        setFormData({
          customerName: '',
          companyName: '',
          email: '',
          mobileNumber: '',
          businessLabel: '',
          businessLabelValue: '',
          address: '',
          otherInfo: ''
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    setSaving(true);
    setError(null);

    try {
      const payload = editCustomerId ? formData : { ...formData, branchId };
      const endpoint = editCustomerId ? `/customers/${editCustomerId}` : '/customers';
      const method = editCustomerId ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSaveSuccess(data.customer);
        onClose();
      } else {
        setError(data.message || 'Failed to save customer');
      }
    } catch (err) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-primary/20 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 relative overflow-hidden">
        {/* Modal Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="p-6 sm:px-8 sm:pt-8 sm:pb-6 border-b border-primary/10 flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">{editCustomerId ? 'Edit Customer' : 'New Customer'}</h2>
            <p className="text-sm text-on-surface-variant/80 mt-1">{editCustomerId ? 'Update the details for this connection.' : 'Add a new connection to your selected branch.'}</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error transition-all group cursor-pointer">
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">close</span>
          </button>
        </div>

        <div className="p-6 sm:px-8 overflow-y-auto custom-scrollbar relative z-10">
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
              <p>{error}</p>
            </div>
          )}

          <form id="customerModalForm" onSubmit={handleSaveCustomer} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">person</span> Customer Name *
                </label>
                <input required name="customerName" value={formData.customerName} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">phone_iphone</span> Mobile Number *
                </label>
                <input required name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="+1 234 567 8900" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">mail</span> Email
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">corporate_fare</span> Company Name
                </label>
                <input name="companyName" value={formData.companyName} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="Doe Enterprises" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sell</span> Business Label
                </label>
                <input name="businessLabel" value={formData.businessLabel} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="e.g., GST No, VAT No" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">pin</span> Label Value
                </label>
                <input name="businessLabelValue" value={formData.businessLabelValue} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="Number/Value" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">location_on</span> Address
              </label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none custom-scrollbar border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="Full address"></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">notes</span> Other Info
              </label>
              <textarea name="otherInfo" value={formData.otherInfo} onChange={handleInputChange} rows={2} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none custom-scrollbar border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="Additional notes or info"></textarea>
            </div>
          </form>
        </div>

        <div className="p-6 sm:px-8 border-t border-primary/10 flex justify-end gap-4 bg-surface-container/30 relative z-10">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl glass-button text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="submit" form="customerModalForm" disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_0_15px_rgba(125,211,252,0.4)] hover:shadow-[0_0_25px_rgba(125,211,252,0.6)] hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
            {saving ? (
              <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Saving...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">check_circle</span> Save Customer</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
