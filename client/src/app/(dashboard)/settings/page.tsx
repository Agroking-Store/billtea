'use client';

import React from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative overflow-x-hidden selection:bg-primary/30">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          opacity: 0;
          animation: fadeSlideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}} />

      {/* Premium Background */}
      <div className="fixed inset-0 bg-surface pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-tertiary/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-12 pb-16">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(125,211,252,0.15)]">
              <span className="material-symbols-outlined text-[14px]">tune</span>
              Configuration Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
              <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Settings
              </span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Manage your company identity, preferences, billing structures, and integrations from a single command center.
            </p>
          </div>
        </header>

        {/* Categories */}
        <div className="flex flex-col gap-12">

          {/* Section 1: Account & Organization */}
          <section className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              Account & Organization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform bg-primary/10 shadow-[0_0_15px_rgba(125,211,252,0.1)] border border-primary/20">
                  <span className="material-symbols-outlined text-3xl">account_circle</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">User Profile</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Update your personal information, manage security settings, and change your password.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/profile" className="w-full glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-primary/30 group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage Profile
                  </Link>
                </div>
              </div>

              {/* Company Settings */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-secondary/40 hover:shadow-[0_20px_40px_-15px_rgba(136,180,204,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform bg-secondary/10 shadow-[0_0_15px_rgba(136,180,204,0.1)] border border-secondary/20">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>corporate_fare</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Company Profile</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Company name, brand, logo, and tax entries. Maintain your professional presence and legal identification.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/company" className="w-full glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-secondary/30 group-hover:text-secondary transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Business Settings */}
          <section className="animate-fade-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">domain</span>
              Business Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Users Card */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-tertiary/40 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-bl-full -z-10 group-hover:bg-tertiary/10 transition-colors"></div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-tertiary group-hover:scale-110 transition-transform bg-tertiary/10 shadow-[0_0_15px_rgba(200,160,240,0.1)] border border-tertiary/20">
                  <span className="material-symbols-outlined text-3xl">manage_accounts</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Staff Management</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Invite team members, assign roles, and manage access permissions across your organization.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link href="/settings/users" className="w-full sm:flex-1 glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-tertiary/30 group-hover:text-tertiary transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage
                  </Link>
                  <Link href="/settings/users?action=create" className="w-full sm:flex-1 bg-tertiary/10 border border-tertiary/30 hover:bg-tertiary/20 text-tertiary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(200,160,240,0.2)]">
                    <span className="material-symbols-outlined text-lg">person_add</span> Create User
                  </Link>
                </div>
              </div>

              {/* Branch Settings */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform bg-primary/10 shadow-[0_0_15px_rgba(125,211,252,0.1)] border border-primary/20">
                  <span className="material-symbols-outlined text-3xl">store</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Branch Settings</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Contact, address, bank, UPI, signature (per branch). Manage multiple operational branches.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/branches" className="flex-1 glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-primary/30 group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage
                  </Link>
                  <Link href="/settings/branches?action=create" className="flex-1 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(125,211,252,0.2)]">
                    <span className="material-symbols-outlined text-lg">add_location</span> Add
                  </Link>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-[#ec4899]/40 hover:shadow-[0_20px_40px_-15px_rgba(236,72,153,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-[#ec4899] group-hover:scale-110 transition-transform bg-[#ec4899]/10 shadow-[0_0_15px_rgba(236,72,153,0.1)] border border-[#ec4899]/20">
                  <span className="material-symbols-outlined text-3xl">palette</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Theme Settings</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Button, navigation and table header colors. Personalize the interface to match your corporate identity.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/theme" className="w-full glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-[#ec4899]/30 group-hover:text-[#ec4899] transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage Theme
                  </Link>
                </div>
              </div>

            </div>
          </section>

          {/* Section 3: Billing & Integrations */}
          <section className="animate-fade-slide-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">account_balance_wallet</span>
              Billing & Integrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

              {/* Invoice Settings */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:scale-110 transition-transform bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-emerald-500/20">
                  <span className="material-symbols-outlined text-3xl">receipt_long</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Invoice Settings</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Invoice prefix, start number and terms & conditions. Standardize your billing cycle and financial documentation.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/invoice-settings" className="flex-1 glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage
                  </Link>
                </div>
              </div>

              {/* Quotation Settings */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-amber-500/40 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -z-10 group-hover:bg-amber-500/10 transition-colors"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)] border border-amber-500/20">
                    <span className="material-symbols-outlined text-3xl">request_quote</span>
                  </div>
                  <Link
                    href="/settings/theme"
                    className="p-2 rounded-xl text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors tooltip tooltip-left cursor-pointer"
                    data-tip="Quotation Theme Setup"
                    title="Quotation Theme Setup"
                  >
                    <span className="material-symbols-outlined">brush</span>
                  </Link>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Quotation Settings</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Quotation prefix, start number and terms. Define how you present estimates and proposals to prospective clients.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/quotation-settings" className="flex-1 glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-amber-500/30 group-hover:text-amber-500 transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage
                  </Link>
                </div>
              </div>

              {/* WhatsApp Settings */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-[#25D366]/40 hover:shadow-[0_20px_40px_-15px_rgba(37,211,102,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/5 rounded-bl-full -z-10 group-hover:bg-[#25D366]/10 transition-colors"></div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-[#25D366] group-hover:scale-110 transition-transform bg-[rgba(37,211,102,0.1)] shadow-[0_0_15px_rgba(37,211,102,0.1)] border border-[#25D366]/20">
                  <span className="material-symbols-outlined text-3xl">chat</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">WhatsApp Integration</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Instance ID and access token for sending invoices and quotations via WhatsApp. Streamline client communication.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/whatsapp" className="w-full glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-[#25D366]/30 group-hover:text-[#25D366] transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Configure
                  </Link>
                </div>
              </div>

              {/* Plan & Subscription */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-[1px] rounded-3xl group hover:-translate-y-1 transition-all duration-300 shadow-xl">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[23px] flex flex-col h-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.15),_transparent_50%)]"></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary bg-primary/20 shadow-[0_0_20px_rgba(125,211,252,0.2)] border border-primary/30">
                      <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">Pro Tier</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 relative z-10">Plan & Subscription</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow relative z-10">
                    View your current plan and subscription. Access tiered features and license limits.
                  </p>

                  <div className="flex items-center gap-3 relative z-10">
                    <Link href="/settings/subscription" className="w-full bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                      <span className="material-symbols-outlined text-lg">upgrade</span> Manage Plan
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>



      {/* Footer Decoration */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 pb-8 opacity-40 text-center flex items-center justify-center gap-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
        <p className="text-xs font-semibold tracking-[0.2em] text-on-surface-variant uppercase">
          BillTea Settings • Professional Tier
        </p>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
      </footer>
    </div>
    </>
  );
}