"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/auth";
import { useBranch } from "../../../../components/BranchProvider";
import { useRouter } from 'next/navigation';

// ---- Toggle switch ----
function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in mt-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 top-0.5 transition-all duration-300 ${checked ? 'border-primary' : 'border-outline-variant'}`}
        style={{
          left: checked ? "auto" : "2px",
          right: checked ? "2px" : "auto",
        }}
        id={id}
        name={id}
      />
      <label
        className={`block overflow-hidden h-6 rounded-full border cursor-pointer transition-colors duration-300 ${checked ? 'bg-primary/20 border-primary shadow-[0_0_8px_var(--color-primary)]' : 'bg-surface-variant border-outline-variant'}`}
        htmlFor={id}
      />
    </div>
  );
}

function Icon({
  name,
  className = "",
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={style}
    >
      {name}
    </span>
  );
}

export default function InvoiceConfigurationPage() {
  const router = useRouter();
  const { selectedBranchId } = useBranch();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hsn, setHsn] = useState(true);
  const [sku, setSku] = useState(false);

  const [prefix, setPrefix] = useState("INV-");
  const [startingNumber, setStartingNumber] = useState("1");
  const [topMessage, setTopMessage] = useState("");
  const [bottomMessage, setBottomMessage] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/document-settings/${selectedBranchId}?type=INVOICE`);
        const data = await res.json();
        if (data && data.settings) {
          setHsn(data.settings.showHsn);
          setSku(data.settings.showSku);
          setPrefix(data.settings.prefix || "INV-");
          setStartingNumber(data.settings.nextNumber?.toString() || "1");
          setTopMessage(data.settings.topMessage || "");
          setBottomMessage(data.settings.bottomMessage || "");
          setTerms(data.settings.terms || "");
        }
      } catch (error) {
        alert('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [selectedBranchId]);

  const handleSave = async () => {
    if (!selectedBranchId) {
      alert('No branch selected');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`/document-settings/${selectedBranchId}`, {
        method: "PUT",
        body: JSON.stringify({
          type: "INVOICE",
          prefix,
          nextNumber: parseInt(startingNumber) || 1,
          topMessage,
          bottomMessage,
          terms,
          showSku: sku,
          showHsn: hsn
        }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto relative bg-background">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          opacity: 0;
          animation: fadeSlideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .glass-card {
          background: linear-gradient(145deg, rgba(var(--surface-container-rgb), 0.4) 0%, rgba(var(--surface-container-rgb), 0.1) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(var(--outline-variant-rgb), 0.2);
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(3, 105, 161, 0.15);
          color: var(--on-surface);
          transition: all 0.3s ease;
        }
        .glass-input:focus {
          outline: none;
          border-color: rgba(3, 105, 161, 0.3);
          box-shadow: 0 0 15px rgba(3, 105, 161, 0.1);
          background: rgba(255, 255, 255, 0.9);
        }
        .dark .glass-input {
          background: rgba(15, 21, 36, 0.4);
          border: 1px solid rgba(125, 211, 252, 0.1);
        }
        .dark .glass-input:focus {
          background: rgba(15, 21, 36, 0.6);
          border-color: rgba(125, 211, 252, 0.4);
          box-shadow: 0 0 15px rgba(125, 211, 252, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(137, 146, 152, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(197, 234, 255, 0.3);
        }
      `}} />

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        {/* Header Section */}
        <div className="mb-10 animate-fade-slide-up">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4 font-medium tracking-wide uppercase">
            <button onClick={() => router.back()} className="hover:bg-surface-container p-1 rounded-full transition-colors mr-1 group flex items-center justify-center" aria-label="Go back">
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            </button>
            <span>Settings</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary">Invoice Settings</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4 tracking-tight">Invoice Settings</h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">Configure default behaviors, display preferences, and legal messaging for all newly generated invoices.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving || loading}
              className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
              {saving ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span><span>Saving...</span></>
              ) : (
                <><span className="material-symbols-outlined">save</span><span>Save Settings</span></>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-slide-up">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-on-surface-variant font-medium tracking-wide">Loading configuration...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* General Configuration */}
              <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
                <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <span className="material-symbols-outlined text-[24px]">tune</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-on-surface tracking-tight">General Configuration</h3>
                        <p className="text-sm text-on-surface-variant font-medium">Format and numbering defaults</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface">Invoice Prefix</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={prefix}
                          onChange={(e) => setPrefix(e.target.value)}
                          placeholder="INV-"
                          className="w-full glass-input rounded-xl pl-12 pr-5 py-4 text-on-surface font-mono transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-[20px]">tag</span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant/70 mt-1 font-medium">
                        Appears before the invoice number (e.g., INV-001).
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface">Starting Number</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={startingNumber}
                          onChange={(e) => setStartingNumber(e.target.value)}
                          className="w-full glass-input rounded-xl pl-12 pr-5 py-4 text-on-surface font-mono transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-[20px]">numbers</span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant/70 mt-1 font-medium">
                        The next generated invoice will use this number.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard Messaging */}
              <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
                <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                        <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-on-surface tracking-tight">Standard Messaging</h3>
                        <p className="text-sm text-on-surface-variant font-medium">Automated text for PDFs</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface">Top Message (Header)</label>
                      <textarea
                        className="w-full glass-input rounded-xl p-5 text-on-surface transition-all resize-none"
                        placeholder="Thank you for your business. Please find your invoice details below..."
                        rows={3}
                        value={topMessage}
                        onChange={(e) => setTopMessage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface">Bottom Message (Footer)</label>
                      <textarea
                        className="w-full glass-input rounded-xl p-5 text-on-surface transition-all resize-none"
                        placeholder="We appreciate your business! If you have any questions about this invoice, please contact us."
                        rows={3}
                        value={bottomMessage}
                        onChange={(e) => setBottomMessage(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legal Panel */}
              <div className="group bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden relative">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
                <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/20 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center border border-tertiary/20">
                        <span className="material-symbols-outlined text-[24px]">gavel</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-on-surface tracking-tight">Legal</h3>
                        <p className="text-sm text-on-surface-variant font-medium">Terms &amp; conditions</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <label className="block text-sm font-bold text-on-surface">Terms &amp; Conditions</label>
                    <textarea
                      className="w-full glass-input rounded-xl p-5 text-on-surface font-mono transition-all leading-relaxed resize-none text-sm"
                      rows={6}
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Display Preferences Panel */}
              <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
                <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
                        <span className="material-symbols-outlined text-[24px]">visibility</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-on-surface tracking-tight">Display</h3>
                        <p className="text-sm text-on-surface-variant font-medium">Column preferences</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="pr-4">
                        <h4 className="text-sm font-bold text-on-surface">Show HSN Code</h4>
                        <p className="text-[12px] mt-1 text-on-surface-variant font-medium">Display HSN codes for items in generated PDFs.</p>
                      </div>
                      <Toggle id="toggle_hsn" checked={hsn} onChange={setHsn} />
                    </div>
                    
                    <div className="flex items-start justify-between">
                      <div className="pr-4">
                        <h4 className="text-sm font-bold text-on-surface">Show SKU</h4>
                        <p className="text-[12px] mt-1 text-on-surface-variant font-medium">Include internal Stock Keeping Unit identifiers.</p>
                      </div>
                      <Toggle id="toggle_sku" checked={sku} onChange={setSku} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
