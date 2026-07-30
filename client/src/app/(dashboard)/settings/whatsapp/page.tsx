"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSubscription } from "../../../../components/SubscriptionProvider";

type TemplateKey = "standard" | "friendly" | "overdue";

type SavedSettings = {
  instanceId: string;
  accessToken: string;
  autoSendInvoice: boolean;
  attachPdf: boolean;
  selectedTemplate: TemplateKey;
  invoiceTemplate: string;
  quotationTemplate: string;
  isLinked: boolean;
};

const STORAGE_KEY = "billtea.whatsapp.settings";

const DEFAULT_INSTANCE_ID = "ins_8f9a2b3c4d5e6f7g8h9i";
const DEFAULT_ACCESS_TOKEN = "wa_live_8f9a2b3c4d5e6f7g";

const INVOICE_TEMPLATES: Record<TemplateKey, string> = {
  standard: `Hello {customer_name},

This is a friendly message from {company_name}.
Your invoice {invoice_number} for the amount of {total_amount} is now ready.

Please find the details attached. The payment is due by {due_date}.

Thank you for your business!
Best regards,
{company_name} Team`,
  friendly: `Hi {customer_name},

Your invoice {invoice_number} from {company_name} is ready.
The amount due is {total_amount}, and the payment is due by {due_date}.

Please review the attached document and let us know if you need any help.

Thank you,
{company_name}`,
  overdue: `Hello {customer_name},

This is a reminder that invoice {invoice_number} from {company_name} is now overdue.
The outstanding amount is {total_amount}.

Kindly arrange payment at your earliest convenience. If you have already paid, please disregard this message.

Regards,
{company_name} Billing Team`,
};

const QUOTATION_TEMPLATE = `Hi {customer_name},

Thank you for requesting a quote from {company_name}.
We have prepared quote {quote_number} for {total_amount} based on your requirements.

Please review the attached document.

Regards,
{company_name}`;

const PLACEHOLDERS = [
  "{customer_name}",
  "{invoice_number}",
  "{total_amount}",
  "{due_date}",
  "{company_name}",
];

const QUOTATION_PLACEHOLDERS = ["{quote_number}", "{expiry_date}", "{sales_rep}"];

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
        className={`absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 top-0.5 transition-all duration-300 ${checked ? 'border-[#25D366]' : 'border-outline-variant'}`}
        style={{
          left: checked ? "auto" : "2px",
          right: checked ? "2px" : "auto",
        }}
        id={id}
        name={id}
      />
      <label
        className={`block overflow-hidden h-6 rounded-full border cursor-pointer transition-colors duration-300 ${checked ? 'bg-[#25D366]/20 border-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.6)]' : 'bg-surface-variant border-outline-variant'}`}
        htmlFor={id}
      />
    </div>
  );
}

function PlaceholderChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full bg-surface border border-[#25D366]/20 text-xs font-mono text-on-surface hover:bg-[#25D366]/10 hover:border-[#25D366]/40 transition-all shadow-sm"
    >
      {label}
    </button>
  );
}

export default function WhatsAppSettingsPage() {
  const router = useRouter();
  const { data: subscriptionData, isLoading: isSubscriptionLoading } =
    useSubscription();

  const [instanceId, setInstanceId] = useState(DEFAULT_INSTANCE_ID);
  const [accessToken, setAccessToken] = useState(DEFAULT_ACCESS_TOKEN);
  const [showToken, setShowToken] = useState(false);
  const [autoSendInvoice, setAutoSendInvoice] = useState(true);
  const [attachPdf, setAttachPdf] = useState(true);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateKey>("standard");
  const [invoiceTemplate, setInvoiceTemplate] = useState(
    INVOICE_TEMPLATES.standard,
  );
  const [quotationTemplate, setQuotationTemplate] =
    useState(QUOTATION_TEMPLATE);
  const [isLinked, setIsLinked] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);
  
  const [nextPlaceholderIndex, setNextPlaceholderIndex] = useState(0);

  const invoiceRef = useRef<HTMLTextAreaElement | null>(null);
  const quotationRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as Partial<SavedSettings>;
      if (typeof parsed.instanceId === "string") setInstanceId(parsed.instanceId);
      if (typeof parsed.accessToken === "string") setAccessToken(parsed.accessToken);
      if (typeof parsed.autoSendInvoice === "boolean")
        setAutoSendInvoice(parsed.autoSendInvoice);
      if (typeof parsed.attachPdf === "boolean") setAttachPdf(parsed.attachPdf);
      if (parsed.selectedTemplate && parsed.selectedTemplate in INVOICE_TEMPLATES) {
        setSelectedTemplate(parsed.selectedTemplate);
        setInvoiceTemplate(INVOICE_TEMPLATES[parsed.selectedTemplate]);
      } else if (typeof parsed.invoiceTemplate === "string") {
        setInvoiceTemplate(parsed.invoiceTemplate);
      }
      if (typeof parsed.quotationTemplate === "string") {
        setQuotationTemplate(parsed.quotationTemplate);
      }
      if (typeof parsed.isLinked === "boolean") setIsLinked(parsed.isLinked);
    } catch {
      // Ignore malformed saved state and keep defaults.
    }
  }, []);

  useEffect(() => {
    if (saveStatus !== "saving") return;
    const timer = window.setTimeout(() => setSaveStatus("saved"), 350);
    return () => window.clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = window.setTimeout(() => setSaveStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [saveStatus]);

  const insertAtCursor = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    token: string,
  ) => {
    const textarea = ref.current;
    if (!textarea) {
      setter((current) => `${current}${token}`);
      return;
    }

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const nextValue = `${textarea.value.slice(0, start)}${token}${textarea.value.slice(end)}`;

    setter(nextValue);
    window.requestAnimationFrame(() => {
      const nextPosition = start + token.length;
      textarea.focus();
      textarea.setSelectionRange(nextPosition, nextPosition);
    });
  };

  const wrapSelection = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    prefix: string,
    suffix: string = prefix,
  ) => {
    const textarea = ref.current;
    if (!textarea) {
      setter((current) => `${current}${prefix}${suffix}`);
      return;
    }

    const value = textarea.value;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selectedText = value.slice(start, end);
    const nextValue = `${value.slice(0, start)}${prefix}${selectedText}${suffix}${value.slice(end)}`;

    setter(nextValue);

    window.requestAnimationFrame(() => {
      const nextPosition = selectedText
        ? start + prefix.length + selectedText.length + suffix.length
        : start + prefix.length;
      textarea.focus();
      textarea.setSelectionRange(nextPosition, nextPosition);
    });
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Ignore clipboard failures in restricted browsers.
    }
  };

  const handleSave = () => {
    const payload: SavedSettings = {
      instanceId,
      accessToken,
      autoSendInvoice,
      attachPdf,
      selectedTemplate,
      invoiceTemplate,
      quotationTemplate,
      isLinked,
    };

    setSaveStatus("saving");
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const handleRegenerateCredentials = () => {
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    setAccessToken(`wa_live_${randomSuffix}`);
    setShowToken(false);
  };

  const handleUnlinkDevice = () => {
    setIsLinked(false);
    setShowToken(false);
  };

  const handleResetInvoiceTemplate = () => {
    setSelectedTemplate("standard");
    setInvoiceTemplate(INVOICE_TEMPLATES.standard);
  };

  const handleMorePlaceholder = () => {
    const placeholder = PLACEHOLDERS[nextPlaceholderIndex % PLACEHOLDERS.length];
    setNextPlaceholderIndex((current) => current + 1);
    insertAtCursor(invoiceRef, setInvoiceTemplate, placeholder);
  };

  const isWhatsAppEnabled = Boolean(
    subscriptionData?.subscription?.plan?.whatsappIntegration,
  );
  const whatsappMessagesRemaining =
    subscriptionData?.usage?.whatsappMessages?.remaining ?? null;

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
          border: 1px solid rgba(37, 211, 102, 0.15);
          color: var(--on-surface);
          transition: all 0.3s ease;
        }
        .glass-input:focus {
          outline: none;
          border-color: rgba(37, 211, 102, 0.3);
          box-shadow: 0 0 15px rgba(37, 211, 102, 0.1);
          background: rgba(255, 255, 255, 0.9);
        }
        .dark .glass-input {
          background: rgba(15, 21, 36, 0.4);
          border: 1px solid rgba(37, 211, 102, 0.1);
        }
        .dark .glass-input:focus {
          background: rgba(15, 21, 36, 0.6);
          border-color: rgba(37, 211, 102, 0.4);
          box-shadow: 0 0 15px rgba(37, 211, 102, 0.1);
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#25D366]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        {/* Header Section */}
        <div className="mb-10 animate-fade-slide-up">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4 font-medium tracking-wide uppercase">
            <button onClick={() => router.back()} className="hover:bg-surface-container p-1 rounded-full transition-colors mr-1 group flex items-center justify-center cursor-pointer" aria-label="Go back">
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            </button>
            <span>Settings</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[#25D366]">WhatsApp Configuration</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4 tracking-tight flex items-center gap-3">
                <span>WhatsApp Integration</span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Configure your WhatsApp Business API credentials and manage automated message templates.
              </p>
              
              <div className="flex items-center gap-3 mt-4">
                {isSubscriptionLoading ? (
                  <span className="px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">
                    Checking plan...
                  </span>
                ) : isWhatsAppEnabled ? (
                  <span className="px-3 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-semibold text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                    API Connected
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning font-semibold text-sm">
                    API Not Connected
                  </span>
                )}
                {typeof whatsappMessagesRemaining === "number" && (
                  <span className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary font-semibold text-sm">
                    Messages left: {whatsappMessagesRemaining === 0 ? "Unlimited" : whatsappMessagesRemaining}
                  </span>
                )}
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="group relative h-14 px-8 rounded-2xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-3 overflow-hidden shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer min-w-[200px]"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
              {saveStatus === "saving" ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span><span>Saving...</span></>
              ) : saveStatus === "saved" ? (
                <><span className="material-symbols-outlined">check</span><span>Saved!</span></>
              ) : (
                <><span className="material-symbols-outlined">save</span><span>Save Settings</span></>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Left Column (API & Triggers) */}
          <div className="space-y-6">
            
            {/* API Credentials */}
            <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
              <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/20">
                      <span className="material-symbols-outlined text-[24px]">key</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-on-surface tracking-tight">API Credentials</h3>
                      <p className="text-sm text-on-surface-variant font-medium">Manage connection tokens</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface">Instance ID</label>
                    <div className="relative">
                      <input
                        readOnly
                        value={instanceId}
                        className="w-full glass-input rounded-xl py-3 pl-4 pr-12 text-on-surface font-mono text-sm transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(instanceId)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors cursor-pointer"
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface">Access Token</label>
                    <div className="relative">
                      <input
                        readOnly
                        value={showToken ? accessToken : "••••••••••••••••••••••••••••••••"}
                        className="w-full glass-input rounded-xl py-3 pl-4 pr-12 text-on-surface font-mono text-sm transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((current) => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors cursor-pointer"
                        title={showToken ? "Hide" : "Reveal"}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showToken ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-2 font-medium">
                      Keep your access token secure and do not share it.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={handleRegenerateCredentials}
                    className="w-full py-3 rounded-xl border border-[#25D366]/30 text-[#25D366] font-bold text-sm hover:bg-[#25D366]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Regenerate Credentials
                  </button>
                </div>
              </div>
            </div>

            {/* Linked Device */}
            <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
              <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <span className="material-symbols-outlined text-[20px]">smartphone</span>
                    </div>
                    <div>
                      <h2 className="text-md font-bold text-on-surface">Device Linked</h2>
                      <p className="text-xs text-on-surface-variant font-medium">Last sync: 2 mins ago</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlinkDevice}
                    className="text-error hover:bg-error/10 p-2 rounded-xl transition-colors cursor-pointer"
                    title="Unlink Device"
                  >
                    <span className="material-symbols-outlined text-[20px]">link_off</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Automation Preferences */}
            <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
              <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                      <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-on-surface tracking-tight">Automation</h3>
                      <p className="text-sm text-on-surface-variant font-medium">Trigger preferences</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="pr-4">
                      <h4 className="text-sm font-bold text-on-surface">Auto-send on Invoice Creation</h4>
                      <p className="text-[12px] mt-1 text-on-surface-variant font-medium">Automatically trigger WhatsApp message when a new invoice is generated.</p>
                    </div>
                    <Toggle id="auto-send" checked={autoSendInvoice} onChange={setAutoSendInvoice} />
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="pr-4">
                      <h4 className="text-sm font-bold text-on-surface">Attach PDF Document</h4>
                      <p className="text-[12px] mt-1 text-on-surface-variant font-medium">Include a generated PDF file along with the text message.</p>
                    </div>
                    <Toggle id="attach-pdf" checked={attachPdf} onChange={setAttachPdf} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Templates) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Invoice Template Panel */}
            <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
              <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                      <span className="material-symbols-outlined text-[24px]">description</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-on-surface tracking-tight">Invoice Template</h3>
                      <p className="text-sm text-on-surface-variant font-medium">Customize billing messages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="dropdown-container relative" style={{ zIndex: activeDropdown === 'selectedTemplate' ? 50 : 10 }}>
                      <button
                        type="button"
                        className="bg-surface border border-outline-variant/30 text-on-surface text-sm rounded-xl py-2 pl-4 pr-10 focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] outline-none flex items-center gap-1.5 cursor-pointer font-medium transition-all"
                        onClick={() => toggleDropdown('selectedTemplate')}
                      >
                        <span>
                          {selectedTemplate === 'standard' ? 'Standard Professional' :
                           selectedTemplate === 'friendly' ? 'Friendly Reminder' :
                           selectedTemplate === 'overdue' ? 'Overdue Notice' : 'Select Template'}
                        </span>
                        <span className={`material-symbols-outlined text-on-surface-variant text-[18px] absolute right-3 transition-transform duration-200 ${activeDropdown === 'selectedTemplate' ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>
                      
                      {activeDropdown === 'selectedTemplate' && (
                        <div className="absolute right-0 top-full mt-2 w-56 z-50 bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                          {[
                            { value: 'standard', label: 'Standard Professional' },
                            { value: 'friendly', label: 'Friendly Reminder' },
                            { value: 'overdue', label: 'Overdue Notice' }
                          ].map(tpl => (
                            <div 
                              key={tpl.value}
                              onMouseDown={() => { setSelectedTemplate(tpl.value as TemplateKey); setActiveDropdown(null); }} 
                              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedTemplate === tpl.value ? 'bg-[#25D366]/20 text-[#25D366] font-bold' : 'text-on-surface font-medium hover:bg-[#25D366]/10'}`}
                            >
                              {tpl.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleResetInvoiceTemplate}
                      className="p-2 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors cursor-pointer bg-surface"
                      title="Reset to Default"
                    >
                      <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                    </button>
                  </div>
                </div>

                <div className="mb-4 space-y-3">
                  <p className="text-xs font-bold text-on-surface uppercase tracking-wide">
                    Available Placeholders
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PLACEHOLDERS.map((placeholder) => (
                      <PlaceholderChip
                        key={placeholder}
                        label={placeholder}
                        onClick={() => insertAtCursor(invoiceRef, setInvoiceTemplate, placeholder)}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={handleMorePlaceholder}
                      className="px-3 py-1.5 rounded-full bg-transparent border border-dashed border-outline-variant text-xs text-on-surface-variant hover:text-[#25D366] hover:border-[#25D366]/50 transition-all flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      More
                    </button>
                  </div>
                </div>

                <div className="relative flex-grow mt-2">
                  <textarea
                    ref={invoiceRef}
                    value={invoiceTemplate}
                    onChange={(e) => setInvoiceTemplate(e.target.value)}
                    className="w-full h-[280px] glass-input rounded-2xl p-5 text-on-surface font-body-lg text-sm leading-relaxed resize-none font-mono"
                    placeholder="Write your message here..."
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md rounded-xl p-1.5 border border-outline-variant/30 shadow-lg">
                    <button
                      type="button"
                      onClick={() => wrapSelection(invoiceRef, setInvoiceTemplate, "**")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-[#25D366]/20 hover:text-[#25D366] transition-colors font-bold text-sm cursor-pointer"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => wrapSelection(invoiceRef, setInvoiceTemplate, "*")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-[#25D366]/20 hover:text-[#25D366] transition-colors italic text-sm cursor-pointer"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => wrapSelection(invoiceRef, setInvoiceTemplate, "~~")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-[#25D366]/20 hover:text-[#25D366] transition-colors line-through text-sm cursor-pointer"
                      title="Strikethrough"
                    >
                      S
                    </button>
                    <div className="w-px h-5 bg-outline-variant/50 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertAtCursor(invoiceRef, setInvoiceTemplate, "🙂")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-[#25D366]/20 hover:text-[#25D366] transition-colors cursor-pointer"
                      title="Insert emoji"
                    >
                      <span className="material-symbols-outlined text-[18px]">mood</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quotation Template Panel */}
            <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
              <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-outline-variant/20">
                  <div className="w-12 h-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center border border-tertiary/20">
                    <span className="material-symbols-outlined text-[24px]">request_quote</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-on-surface tracking-tight">Quotation Template</h3>
                    <p className="text-sm text-on-surface-variant font-medium">Default text for quotes</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="md:col-span-3 relative">
                    <textarea
                      ref={quotationRef}
                      value={quotationTemplate}
                      onChange={(e) => setQuotationTemplate(e.target.value)}
                      className="w-full h-[200px] glass-input rounded-2xl p-5 text-on-surface font-body-lg text-sm leading-relaxed resize-none font-mono"
                      placeholder="Write your quotation message here..."
                    />
                  </div>
                  <div className="md:col-span-1 flex flex-col gap-3">
                    <p className="text-xs font-bold text-on-surface uppercase tracking-wide">
                      Placeholders
                    </p>
                    <div className="flex flex-col gap-2">
                      {QUOTATION_PLACEHOLDERS.map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          onClick={() => insertAtCursor(quotationRef, setQuotationTemplate, placeholder)}
                          className="text-left text-xs font-mono text-tertiary bg-tertiary/10 px-3 py-2 rounded-xl border border-tertiary/20 hover:bg-tertiary/20 hover:border-tertiary/40 transition-colors cursor-pointer font-semibold"
                        >
                          {placeholder}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
