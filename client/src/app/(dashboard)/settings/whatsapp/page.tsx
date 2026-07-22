"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
}) {
  return (
    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in shrink-0">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-on-surface border-4 appearance-none cursor-pointer border-surface-container transition-transform duration-300 translate-x-0 checked:translate-x-6 checked:border-primary"
      />
      <label
        htmlFor={id}
        className="toggle-label block overflow-hidden h-6 rounded-full bg-surface-container-high cursor-pointer transition-colors duration-300 border border-outline-variant/30"
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
      className="px-3 py-1.5 rounded-full bg-surface-container-highest border border-primary/10 text-xs font-mono text-primary-container hover:bg-primary/20 hover:border-primary/30 transition-all shadow-sm"
    >
      {label}
    </button>
  );
}

export default function WhatsAppSettingsPage() {
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
    setInvoiceTemplate(INVOICE_TEMPLATES[selectedTemplate]);
  }, [selectedTemplate]);

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
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background text-on-surface">
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={() => setActiveDropdown(null)} 
        />
      )}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-tertiary/5 rounded-full blur-[120px] -z-10 pointer-events-none -translate-x-1/4 translate-y-1/4" />

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-6 py-6 lg:px-10 lg:py-8">
        <div className="max-w-[1600px] mx-auto space-y-6 pb-16">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-on-surface-variant mb-2 font-medium text-sm">
                <span className="material-symbols-outlined text-sm">settings</span>
                <span>Settings</span>
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
                <span className="text-primary">WhatsApp Configuration</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                <span className="text-on-surface">WhatsApp </span>
                <span className="bg-gradient-to-br from-primary to-tertiary bg-clip-text text-transparent">
                  Integration
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg max-w-3xl">
                Configure your WhatsApp Business API credentials and manage
                automated message templates for invoices and quotations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSubscriptionLoading ? (
                <span className="px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">
                  Checking plan...
                </span>
              ) : isWhatsAppEnabled ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  API Connected
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning font-semibold text-sm">
                  API Not Connected
                </span>
              )}
              {typeof whatsappMessagesRemaining === "number" && (
                <span className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary font-semibold text-sm">
                  Messages left:{" "}
                  {whatsappMessagesRemaining === 0
                    ? "Unlimited"
                    : whatsappMessagesRemaining}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass-panel rounded-xl p-6 md:p-8 border border-primary/20 relative overflow-hidden shadow-[0_0_20px_rgba(125,211,252,0.08)] flex flex-col flex-grow h-full">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">key</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">
                      API Credentials
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Manage your connection tokens.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                      Instance ID
                    </label>
                    <div className="relative group">
                      <input
                        readOnly
                        value={instanceId}
                        className="w-full bg-surface-container-low/40 rounded-xl py-3 pl-4 pr-12 text-on-surface font-mono text-sm border border-primary/10 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(instanceId)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          content_copy
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                      Access Token
                    </label>
                    <div className="relative group">
                      <input
                        readOnly
                        value={showToken ? accessToken : "****************************************"}
                        className="w-full bg-surface-container-low/40 rounded-xl py-3 pl-4 pr-12 text-on-surface font-mono text-sm text-primary border border-primary/10 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((current) => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                        title={showToken ? "Hide" : "Reveal"}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showToken ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-2 flex items-start gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        info
                      </span>
                      <span>
                        Tokens should be kept secure. Never share them publicly.
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-5 border-t border-primary/10">
                  <button
                    type="button"
                    onClick={handleRegenerateCredentials}
                    className="w-full py-3 rounded-xl border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      refresh
                    </span>
                    Regenerate Credentials
                  </button>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-6 md:p-8 border border-outline-variant/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <span className="material-symbols-outlined">
                        smartphone
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-on-surface">
                        Device Linked
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Last sync: 2 mins ago
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlinkDevice}
                    className="text-error hover:bg-error/10 p-2 rounded-xl transition-colors"
                    title="Unlink Device"
                  >
                    <span className="material-symbols-outlined">link_off</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="glass-panel rounded-xl p-6 md:p-8 border border-outline-variant/30">
                <h2 className="text-lg font-bold text-on-surface mb-6">
                  Automation Preferences
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low/50 border border-primary/5 hover:border-primary/20 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5">
                        send_time_extension
                      </span>
                      <div>
                        <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                          Auto-send on Invoice Creation
                        </p>
                        <p className="text-sm text-on-surface-variant mt-0.5">
                          Automatically trigger WhatsApp message when a new
                          invoice is generated.
                        </p>
                      </div>
                    </div>
                    <Toggle
                      id="auto-send"
                      checked={autoSendInvoice}
                      onChange={setAutoSendInvoice}
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low/50 border border-primary/5 hover:border-primary/20 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5">
                        picture_as_pdf
                      </span>
                      <div>
                        <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                          Attach PDF Document
                        </p>
                        <p className="text-sm text-on-surface-variant mt-0.5">
                          Include a generated PDF file along with the text
                          message.
                        </p>
                      </div>
                    </div>
                    <Toggle
                      id="attach-pdf"
                      checked={attachPdf}
                      onChange={setAttachPdf}
                    />
                  </label>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-6 md:p-8 border border-outline-variant/30 flex flex-col flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      description
                    </span>
                    <h2 className="text-lg font-bold text-on-surface">
                      Invoice Template
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative" style={{ zIndex: activeDropdown === 'selectedTemplate' ? 50 : 10 }}>
                      <button
                        type="button"
                        className="bg-surface-container-low border border-primary/20 text-on-surface text-sm rounded-lg py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-primary focus:border-primary outline-none flex items-center gap-1.5 cursor-pointer"
                        onClick={() => toggleDropdown('selectedTemplate')}
                      >
                        <span>
                          {selectedTemplate === 'standard' ? 'Standard Professional' :
                           selectedTemplate === 'friendly' ? 'Friendly Reminder' :
                           selectedTemplate === 'overdue' ? 'Overdue Notice' : 'Select Template'}
                        </span>
                        <span className={`material-symbols-outlined text-on-surface-variant text-[16px] transition-transform duration-200 ${activeDropdown === 'selectedTemplate' ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>
                      
                      {activeDropdown === 'selectedTemplate' && (
                        <div className="absolute right-0 top-full mt-1 w-48 z-50 bg-surface-container-highest rounded-lg border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                          {[
                            { value: 'standard', label: 'Standard Professional' },
                            { value: 'friendly', label: 'Friendly Reminder' },
                            { value: 'overdue', label: 'Overdue Notice' }
                          ].map(tpl => (
                            <div 
                              key={tpl.value}
                              onClick={() => { setSelectedTemplate(tpl.value as TemplateKey); setActiveDropdown(null); }} 
                              className={`px-3 py-2 text-xs cursor-pointer transition-colors ${selectedTemplate === tpl.value ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
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
                      className="p-1.5 rounded-lg border border-primary/20 text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Reset to Default"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        restart_alt
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-on-surface-variant mb-2">
                    Click to insert placeholders:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PLACEHOLDERS.map((placeholder) => (
                      <PlaceholderChip
                        key={placeholder}
                        label={placeholder}
                        onClick={() =>
                          insertAtCursor(
                            invoiceRef,
                            setInvoiceTemplate,
                            placeholder,
                          )
                        }
                      />
                    ))}
                    <button
                      type="button"
                      onClick={handleMorePlaceholder}
                      className="px-3 py-1 rounded-full bg-surface-container border border-dashed border-primary/30 text-xs text-on-surface-variant hover:text-primary hover:border-primary transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        add
                      </span>
                      More
                    </button>
                  </div>
                </div>

                <div className="relative flex-grow">
                  <textarea
                    ref={invoiceRef}
                    value={invoiceTemplate}
                    onChange={(e) => setInvoiceTemplate(e.target.value)}
                    className="w-full h-48 glacier-input rounded-xl p-4 text-on-surface font-body-lg text-sm leading-relaxed resize-none font-mono bg-surface-container-low/40 border border-primary/10"
                    placeholder="Write your message here..."
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-surface-container-highest/80 backdrop-blur-md rounded-lg p-1 border border-primary/10">
                    <button
                      type="button"
                      onClick={() => wrapSelection(invoiceRef, setInvoiceTemplate, "**")}
                      className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors font-bold text-sm"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => wrapSelection(invoiceRef, setInvoiceTemplate, "*")}
                      className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors italic text-sm"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => wrapSelection(invoiceRef, setInvoiceTemplate, "~~")}
                      className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors line-through text-sm"
                      title="Strikethrough"
                    >
                      S
                    </button>
                    <div className="w-px h-4 bg-outline-variant mx-1" />
                    <button
                      type="button"
                      onClick={() => insertAtCursor(invoiceRef, setInvoiceTemplate, "🙂")}
                      className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors"
                      title="Insert emoji"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        mood
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="glass-panel rounded-xl p-6 md:p-8 border border-outline-variant/30 border-l-2 border-l-secondary">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary">
                request_quote
              </span>
              <h2 className="text-lg font-bold text-on-surface">
                Quotation Template
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <textarea
                  ref={quotationRef}
                  value={quotationTemplate}
                  onChange={(e) => setQuotationTemplate(e.target.value)}
                  className="w-full h-32 glacier-input rounded-xl p-4 text-on-surface font-body-lg text-sm leading-relaxed resize-none font-mono bg-surface-container-low/40 border border-primary/10"
                  placeholder="Write your quotation message here..."
                />
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-xs text-on-surface-variant">
                  Available Placeholders:
                </p>
                    <div className="flex flex-col gap-2">
                      {QUOTATION_PLACEHOLDERS.map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          onClick={() =>
                            insertAtCursor(
                              quotationRef,
                              setQuotationTemplate,
                              placeholder,
                            )
                          }
                          className="text-left text-xs font-mono text-secondary-fixed bg-secondary-container/30 px-2 py-1 rounded border border-secondary/20 hover:bg-secondary-container/50 hover:border-secondary/40 transition-colors"
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

      <div className="shrink-0 z-30 w-full p-4 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-primary/10 rounded-t-xl">
        <div className="max-w-[1600px] mx-auto flex justify-end gap-4">
          <Link
            href="/settings"
            className="px-6 py-2.5 rounded-lg border border-primary/30 text-primary font-label-md text-label-md hover:bg-primary/10 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            className="px-8 py-2.5 rounded-lg bg-primary/20 border border-primary text-primary font-label-md text-label-md hover:bg-primary/30 hover:shadow-[0_0_20px_rgba(197,234,255,0.4)] transition-all flex items-center gap-2 group relative overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              save
            </span>
            {saveStatus === "saving" ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .toggle-checkbox:checked + .toggle-label {
          background-color: rgba(125, 211, 252, 0.2);
          border-color: rgba(125, 211, 252, 0.5);
        }

        .toggle-checkbox {
          right: 24px;
          z-index: 1;
          border-color: #3f484e;
        }

        .toggle-label {
          background-color: rgba(43, 53, 74, 0.5);
          border: 1px solid rgba(137, 146, 152, 0.3);
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
