'use client';

import React from 'react';

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative overflow-x-hidden selection:bg-primary/30">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(125,211,252,0.05)_0%,_transparent_40%),_radial-gradient(circle_at_80%_80%,_rgba(200,160,240,0.05)_0%,_transparent_40%)] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8 pb-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-3">Settings</h1>
            <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
              Manage your company identity, theme preferences, invoice structures, and integration access points from a single command center.
            </p>
          </div>
          <div className="hidden lg:block relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-tertiary rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none"></div>
            <div className="relative px-4 py-2 glass-panel rounded-xl flex items-center gap-3 border border-primary/20">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium text-on-surface-variant">System Status: Optimal</span>
            </div>
          </div>
        </header>

        {/* Reference Visualization */}
        <div className="mb-6 rounded-3xl overflow-hidden glass-panel h-48 relative border-none border border-primary/10">
          <img alt="System Overview Visualization" className="w-full h-full object-cover opacity-40 mix-blend-overlay" src="/images/settings-overview.png" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          <div className="absolute bottom-6 left-8">
            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-1 block">Global Configuration</span>
            <h2 className="text-xl font-semibold text-on-surface">Centralized Control Grid</h2>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Company Settings */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col h-full group hover:border-primary/40 hover:shadow-[0_0_30px_rgba(125,211,252,0.1)] hover:-translate-y-1 transition-all duration-300 hover:bg-surface-container/70">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform bg-[rgba(125,211,252,0.1)] shadow-[0_0_15px_rgba(125,211,252,0.05)]">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>corporate_fare</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Company Settings</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
              Company name, brand, logo, tax entries (company-wide). Maintain your professional presence and legal identification.
            </p>
            <div className="flex items-center gap-3">
              <button className="border border-[rgba(160,180,196,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(160,180,196,0.4)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">visibility</span> View
              </button>
              <button className="bg-[rgba(125,211,252,0.15)] border border-[rgba(125,211,252,0.3)] hover:bg-[rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.2)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-primary flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">edit</span> Edit
              </button>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col h-full group hover:border-tertiary/40 hover:shadow-[0_0_30px_rgba(200,160,240,0.1)] hover:-translate-y-1 transition-all duration-300 hover:bg-surface-container/70">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-tertiary group-hover:scale-110 transition-transform bg-[rgba(200,160,240,0.1)] shadow-[0_0_15px_rgba(200,160,240,0.05)]">
              <span className="material-symbols-outlined text-3xl">palette</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Theme Settings</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
              Button, navigation and table header colors. Personalize the Glacier interface to match your corporate visual identity.
            </p>
            <div className="flex items-center gap-3">
              <button className="border border-[rgba(160,180,196,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(160,180,196,0.4)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">visibility</span> View
              </button>
              <button className="bg-[rgba(125,211,252,0.15)] border border-[rgba(125,211,252,0.3)] hover:bg-[rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.2)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-primary flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">edit</span> Edit
              </button>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col h-full group hover:border-primary/40 hover:shadow-[0_0_30px_rgba(125,211,252,0.1)] hover:-translate-y-1 transition-all duration-300 hover:bg-surface-container/70">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform bg-[rgba(125,211,252,0.1)] shadow-[0_0_15px_rgba(125,211,252,0.05)]">
              <span className="material-symbols-outlined text-3xl">receipt_long</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Invoice Settings</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
              Invoice prefix, start number and terms & conditions. Standardize your billing cycle and financial documentation.
            </p>
            <div className="flex items-center gap-3">
              <button className="border border-[rgba(160,180,196,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(160,180,196,0.4)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">visibility</span> View
              </button>
              <button className="bg-[rgba(125,211,252,0.15)] border border-[rgba(125,211,252,0.3)] hover:bg-[rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.2)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-primary flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">edit</span> Edit
              </button>
            </div>
          </div>

          {/* Quotation Settings */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col h-full group hover:border-primary/40 hover:shadow-[0_0_30px_rgba(125,211,252,0.1)] hover:-translate-y-1 transition-all duration-300 hover:bg-surface-container/70">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform bg-[rgba(125,211,252,0.1)] shadow-[0_0_15px_rgba(125,211,252,0.05)]">
              <span className="material-symbols-outlined text-3xl">request_quote</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Quotation Settings</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
              Quotation prefix, start number and terms. Define how you present estimates and proposals to prospective clients.
            </p>
            <div className="flex items-center gap-3">
              <button className="border border-[rgba(160,180,196,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(160,180,196,0.4)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">visibility</span> View
              </button>
              <button className="bg-[rgba(125,211,252,0.15)] border border-[rgba(125,211,252,0.3)] hover:bg-[rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.2)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-primary flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">edit</span> Edit
              </button>
            </div>
          </div>

          {/* Plan & Subscription */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col h-full group hover:border-secondary/40 hover:shadow-[0_0_30px_rgba(136,180,204,0.1)] hover:-translate-y-1 transition-all duration-300 hover:bg-surface-container/70">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform bg-[rgba(136,180,204,0.1)] shadow-[0_0_15px_rgba(136,180,204,0.05)]">
              <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Plan & Subscription</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
              View your current plan and subscription. Access tiered features and license limits. Managed by administrative roles.
            </p>
            <div className="flex items-center gap-3">
              <button className="border border-[rgba(160,180,196,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(160,180,196,0.4)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface flex items-center gap-2 w-full justify-center cursor-pointer">
                <span className="material-symbols-outlined text-lg">visibility</span> View Details
              </button>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col h-full group hover:border-[#25D366]/40 hover:shadow-[0_0_30px_rgba(37,211,102,0.1)] hover:-translate-y-1 transition-all duration-300 hover:bg-surface-container/70">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-[#25D366] group-hover:scale-110 transition-transform bg-[rgba(37,211,102,0.1)] shadow-[0_0_15px_rgba(37,211,102,0.05)]">
              <span className="material-symbols-outlined text-3xl">chat</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">WhatsApp Settings</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
              Instance ID and access token for sending invoices and quotations via WhatsApp. Streamline client communication.
            </p>
            <div className="flex items-center gap-3">
              <button className="border border-[rgba(160,180,196,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(160,180,196,0.4)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">visibility</span> View
              </button>
              <button className="bg-[rgba(125,211,252,0.15)] border border-[rgba(125,211,252,0.3)] hover:bg-[rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.2)] transition-all ease-in-out duration-300 px-5 py-2.5 rounded-lg text-sm font-medium text-primary flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">edit</span> Edit
              </button>
            </div>
          </div>

          {/* Branch Settings (Spans 3 on desktop) */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:col-span-2 lg:col-span-3 group hover:border-primary/40 hover:shadow-[0_0_30px_rgba(125,211,252,0.1)] hover:-translate-y-1 transition-all duration-300 hover:bg-surface-container/70">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform bg-[rgba(125,211,252,0.1)] shadow-[0_0_15px_rgba(125,211,252,0.05)]">
                <span className="material-symbols-outlined text-4xl">store</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Branch Settings</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
                  Contact, address, bank, UPI, signature (per branch). Create and manage multiple operational branches with unique financial profiles.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0 mt-4 md:mt-0">
              <button className="border border-[rgba(160,180,196,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(160,180,196,0.4)] transition-all ease-in-out duration-300 px-8 py-3 rounded-lg text-sm font-medium text-on-surface flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">list_alt</span> Manage Branches
              </button>
              <button className="bg-[rgba(125,211,252,0.15)] border border-[rgba(125,211,252,0.3)] hover:bg-[rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.2)] transition-all ease-in-out duration-300 px-8 py-3 rounded-lg text-sm font-medium text-primary flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-lg">add_circle</span> Add Branch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 pb-12 opacity-40 text-center">
        <p className="text-sm font-medium tracking-widest text-on-surface-variant uppercase">
          © 2026 Indux Technology • Professional Infrastructure Tier
        </p>
      </footer>
    </div>
  );
}
