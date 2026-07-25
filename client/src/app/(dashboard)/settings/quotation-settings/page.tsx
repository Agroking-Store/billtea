"use client";

import React, { useState } from "react";

// Removed hardcoded colors, using global Tailwind theme variables instead

// ---- Toggle switch (custom, matches .toggle-checkbox / .toggle-label) ----
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
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-outline-variant/30" />
    </label>
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

export default function QuotationConfigurationPage() {
  const [hsn, setHsn] = useState(true);
  const [sku, setSku] = useState(false);

  const [personalName, setPersonalName] = useState(false);

  const [prefix, setPrefix] = useState("QT-");
  const [startingNumber, setStartingNumber] = useState("1001");
  const [topMessage, setTopMessage] = useState(
    "Thank you for considering Glacier Corp for your enterprise needs. The following estimate is valid for 30 days."
  );
  const [bottomMessage, setBottomMessage] = useState(
    "If you have any questions regarding this quotation, please contact our support team at support@glacier.corp."
  );
  const [terms, setTerms] = useState(
    `1. VALIDITY: This quotation is valid for 30 days from the date of issue.
2. PAYMENT TERMS: 50% advance along with Purchase Order, 50% prior to delivery.
3. TAXES: All applicable taxes are exclusive and will be charged extra as per government regulations at the time of billing.
4. DELIVERY: 4-6 weeks from receipt of firm order and advance payment.`
  );

  return (
    // FIX 1: use a fixed-height (h-screen) flex frame instead of `minHeight: 100vh` + `overflow-hidden`.
    // The old combo let the outer box grow past the viewport while still clipping (overflow-hidden),
    // which is what made the bottom of the page look like it was "cut off" mid-scroll.
    // With h-screen + overflow-hidden, the outer box is a true fixed viewport frame, and the
    // <main> below becomes the only scrollable region, so it scrolls all the way to its real end.
    <div
      className="flex h-screen overflow-hidden bg-background text-on-surface"
      style={{
        backgroundImage:
          "radial-gradient(at 0% 0%, color-mix(in srgb, var(--primary) 5%, transparent) 0px, transparent 50%), radial-gradient(at 100% 100%, color-mix(in srgb, var(--primary) 3%, transparent) 0px, transparent 50%)",
      }}
    >
      {/* SideNavBar placeholder — original mock left this empty */}

      {/* Main Content Area */}
      {/* FIX: h-full (not min-h-screen) so this column matches the fixed parent height exactly */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* TopNavBar */}

        {/* Canvas */}
        {/* FIX 2: widened max-w-5xl -> max-w-[1600px] and reduced side padding so content
            uses the available width instead of floating in a narrow centered column.
            FIX 1 (cont.): this is the actual scroll container now — flex-1 + min-h-0 lets it
            shrink correctly inside the flex column, and overflow-y-auto lets it scroll its full length.
            Added extra bottom padding so the last panel/action bar is never flush with the edge. */}
        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-6 lg:px-10 lg:py-8">
          <div className="max-w-[1600px] mx-auto space-y-6 pb-16">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="settings" className="text-primary/70" />
                <span className="text-sm tracking-wider uppercase text-on-surface-variant">
                  Settings
                </span>
                <Icon
                  name="chevron_right"
                  className="text-sm text-on-surface-variant/50"
                />
                <span className="text-sm text-primary">
                  Quotation
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display mb-2">
                <span className="text-on-surface">Quotation </span>
                <span className="bg-gradient-to-br from-primary to-tertiary bg-clip-text text-transparent">Settings
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg">
                Configure default behaviors, display preferences, and legal
                messaging for all newly generated quotes.
              </p>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (Wider) */}
              <div className="lg:col-span-2 space-y-6">
                {/* General Configuration Panel */}
                <GlassPanel>
                  <PanelHeader icon="tune" title="General Configuration" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FieldLabel>Quotation Prefix</FieldLabel>
                      <div className="relative">
                        <Icon
                          name="tag"
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary/50"
                        />
                        <input
                          className="w-full pl-9 pr-4 py-3 rounded-lg font-mono focus:ring-0 focus:outline-none glass-input"
                          type="text"
                          value={prefix}
                          onChange={(e) => setPrefix(e.target.value)}
                        />
                      </div>
                      <p className="text-[12px] text-on-surface-variant/70">
                        Appears before the quotation number (e.g., QT-001).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Starting Number</FieldLabel>
                      <div className="relative">
                        <Icon
                          name="numbers"
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary/50"
                        />
                        <input
                          className="w-full pl-9 pr-4 py-3 rounded-lg font-mono focus:ring-0 focus:outline-none glass-input"
                          type="number"
                          value={startingNumber}
                          onChange={(e) => setStartingNumber(e.target.value)}
                        />
                      </div>
                      <p className="text-[12px] text-on-surface-variant/70">
                        The next generated quotation will use this number.
                      </p>
                    </div>
                  </div>
                </GlassPanel>

                {/* Messaging Panel */}
                <GlassPanel>
                  <PanelHeader icon="chat_bubble" title="Standard Messaging" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FieldLabel>Top Message (Header)</FieldLabel>
                      <textarea
                        className="w-full p-4 rounded-lg resize-none focus:ring-0 focus:outline-none glass-input"
                        placeholder="Thank you for your inquiry. Please find our quotation attached below..."
                        rows={3}
                        value={topMessage}
                        onChange={(e) => setTopMessage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Bottom Message (Footer)</FieldLabel>
                      <textarea
                        className="w-full p-4 rounded-lg resize-none focus:ring-0 focus:outline-none glass-input"
                        placeholder="We appreciate your business..."
                        rows={3}
                        value={bottomMessage}
                        onChange={(e) => setBottomMessage(e.target.value)}
                      />
                    </div>
                  </div>
                </GlassPanel>

                {/* Legal Panel */}
                <GlassPanel className="relative overflow-hidden group">
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
                  <div className="flex items-center justify-between pb-4 mb-4 relative z-10 border-b border-primary/10">
                    <div className="flex items-center gap-2">
                      <Icon name="gavel" className="text-primary" />
                      <h3 className="font-semibold text-xl text-on-surface">
                        Legal
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <FieldLabel>Terms &amp; Conditions</FieldLabel>
                    <textarea
                      className="w-full p-4 rounded-lg text-sm font-mono leading-relaxed focus:ring-0 focus:outline-none glass-input"
                      rows={6}
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                    />
                  </div>
                </GlassPanel>
              </div>

              {/* Right Column (Narrower) */}
              <div className="space-y-6">
                {/* Display Preferences Panel */}
                <GlassPanel>
                  <PanelHeader icon="visibility" title="Display Preferences" />
                  <div className="space-y-6">
                    <PreferenceRow
                      title="Show HSN Code"
                      description="Display HSN codes for items."
                      checked={hsn}
                      onChange={setHsn}
                      id="toggle_hsn"
                    />
                    <PreferenceRow
                      title="Show SKU"
                      description="Include internal Stock Keeping Unit identifiers."
                      checked={sku}
                      onChange={setSku}
                      id="toggle_sku"
                    />

                    <PreferenceRow
                      title="Display Personal Name"
                      description="Show the generating agent's name instead of just the company."
                      checked={personalName}
                      onChange={setPersonalName}
                      id="toggle_name"
                    />
                  </div>
                  <div className="mt-2 p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 flex gap-3 items-start">
                    <span className="material-symbols-outlined text-secondary-fixed text-lg">info</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Changes to these display settings will only affect invoices generated after
                      saving. Historical invoices retain their original format.
                    </p>
                  </div>
                </GlassPanel>


              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3 mt-8 border-t border-primary/10">
              <button className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm transition-colors text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 text-center">
                Discard Changes
              </button>
              <button className="w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-sm transition-all relative overflow-hidden group glass-button-primary btn-login-glow text-center flex items-center justify-center">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                Save Configuration
              </button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        .material-symbols-outlined {
          font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
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
      `}</style>
    </div>
  );
}

// ---- Reusable pieces ----
function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl p-6 glass-panel ${className}`}>
      {children}
    </section>
  );
}

function PanelHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-4 mb-4 border-b border-primary/10">
      <Icon name={icon} className="text-primary" />
      <h3 className="font-semibold text-xl text-on-surface">
        {title}
      </h3>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-on-surface-variant">
      {children}
    </label>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  onChange,
  id,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="pr-4">
        <h4 className="text-sm font-medium text-on-surface">
          {title}
        </h4>
        <p className="text-[12px] mt-1 text-on-surface-variant">
          {description}
        </p>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  );
}