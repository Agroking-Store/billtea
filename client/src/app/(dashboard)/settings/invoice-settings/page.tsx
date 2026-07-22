'use client';

import React, { useState } from 'react';

const DEFAULT_TERMS = `1. Payment Terms: Net 30 days from the invoice date.
2. Late Fees: A late fee of 1.5% per month will be applied to overdue balances.
3. Disputes: Any disputes regarding this invoice must be submitted in writing within 7 days of receipt.
4. Jurisdiction: This agreement shall be governed by the laws of the State of Incorporation.`;

export default function InvoiceSettingsPage() {
  const [prefix, setPrefix] = useState('');
  const [nextSequence, setNextSequence] = useState('');

  const [topHeaderMessage, setTopHeaderMessage] = useState('');
  const [footerMessage, setFooterMessage] = useState('');

  const [terms, setTerms] = useState('');

  const [showHSN, setShowHSN] = useState(true);
  const [showSKU, setShowSKU] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(true);
  const [showSalesperson, setShowSalesperson] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleGenerateStandardTerms = () => {
    setTerms(DEFAULT_TERMS);
  };

  const handleSave = () => {
    setSaving(true);
    
    console.log('Saving invoice settings:', {
      prefix,
      nextSequence,
      topHeaderMessage,
      footerMessage,
      terms,
      showHSN,
      showSKU,
      showPaymentMethod,
      showSalesperson,
    });
    setTimeout(() => setSaving(false), 600);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 pb-24">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-on-surface">Invoice Configuration</h1>
            <p className="text-on-surface-variant mt-2 text-sm leading-relaxed">
              Customize how your invoices are generated, numbered, and displayed to your clients.
              These settings apply globally to all future invoices.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(197,234,255,0.2)] flex items-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Primary Settings */}
          <div className="lg:col-span-8 space-y-6">
            {/* General Formatting */}
            <section className="glass-panel rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <span className="material-symbols-outlined text-primary">tune</span>
                <h3 className="text-xl font-semibold text-on-surface">General Formatting</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">Invoice Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. INV-"
                    className="bg-white text-gray-900 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/60"
                  />
                  <span className="text-xs text-on-surface-variant/70 mt-1">
                    Prepended to all invoice numbers.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Next Sequence Number
                  </label>
                  <input
                    type="number"
                    value={nextSequence}
                    onChange={(e) => setNextSequence(e.target.value)}
                    placeholder="e.g.1042"
                    className="bg-white text-gray-900 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/60"
                  />
                  <span className="text-xs text-on-surface-variant/70 mt-1">
                    Preview: {prefix || 'INV-'}
                    {nextSequence || '1042'}
                  </span>
                </div>
              </div>
            </section>

            {/* Default Messaging */}
            <section className="glass-panel rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <span className="material-symbols-outlined text-primary">chat</span>
                <h3 className="text-xl font-semibold text-on-surface">Default Messaging</h3>
              </div>
              <div className="space-y-5 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Top Header Message
                  </label>
                  <textarea
                    value={topHeaderMessage}
                    onChange={(e) => setTopHeaderMessage(e.target.value)}
                    placeholder="Enter a brief welcome or context message..."
                    rows={2}
                    className="bg-white text-gray-900 placeholder-gray-400 rounded-lg p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/60"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Footer / Thank You Note
                  </label>
                  <textarea
                    value={footerMessage}
                    onChange={(e) => setFooterMessage(e.target.value)}
                    placeholder="Thank you for your business. Payment is expected within 30 days."
                    rows={3}
                    className="bg-white text-gray-900 placeholder-gray-400 rounded-lg p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/60"
                  />
                </div>
              </div>
            </section>

            {/* Terms & Conditions */}
            <section className="glass-panel rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">gavel</span>
                  <h3 className="text-xl font-semibold text-on-surface">Terms &amp; Conditions</h3>
                </div>
                <button
                  onClick={handleGenerateStandardTerms}
                  className="text-sm font-medium text-primary flex items-center gap-1.5 hover:opacity-80 transition-opacity bg-primary/10 px-3 py-1.5 rounded-md"
                >
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  Generate Standard
                </button>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Enter your invoice terms and conditions..."
                  rows={6}
                  className="bg-white text-gray-900 placeholder-gray-400 rounded-lg p-4 text-sm resize-y leading-relaxed outline-none focus:ring-2 focus:ring-primary/60"
                />
              </div>
            </section>
          </div>

          {/* Right Column: Display Toggles */}
          <div className="lg:col-span-4 space-y-6">
            <section className="glass-panel rounded-xl p-6 flex flex-col gap-4 sticky top-6">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <h3 className="text-xl font-semibold text-on-surface">Display Columns</h3>
              </div>
              <p className="text-sm text-on-surface-variant">
                Toggle which fields are visible on the generated PDF invoice.
              </p>

              <div className="space-y-1">
                <ToggleRow
                  label="HSN/SAC Code"
                  description="Show tax classification codes"
                  checked={showHSN}
                  onChange={setShowHSN}
                />
                <ToggleRow
                  label="Product SKU"
                  description="Include item serials/SKUs"
                  checked={showSKU}
                  onChange={setShowSKU}
                />
                <ToggleRow
                  label="Payment Method"
                  description="Show bank details block"
                  checked={showPaymentMethod}
                  onChange={setShowPaymentMethod}
                />
                <ToggleRow
                  label="Salesperson Name"
                  description="Display account manager"
                  checked={showSalesperson}
                  onChange={setShowSalesperson}
                />
              </div>

              <div className="mt-2 p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 flex gap-3 items-start">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">info</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Changes to these display settings will only affect invoices generated after
                  saving. Historical invoices retain their original format.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-variant/20 transition-colors">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-on-surface">{label}</span>
        <span className="text-xs text-on-surface-variant">{description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
      </label>
    </div>
  );
}
