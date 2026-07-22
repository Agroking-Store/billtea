'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBranch } from '../../../components/BranchProvider';
import { apiFetch } from '../../../lib/auth';

export default function SettingsPage() {
  const { selectedBranchId } = useBranch();
  const [showQuotationSettings, setShowQuotationSettings] = useState(false);
  const [quotationTheme, setQuotationTheme] = useState('INDUX_MODERN');
  const [themeColor, setThemeColor] = useState('#0ea5e9');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  // Fetch branch details when modal opens
  useEffect(() => {
    if (showQuotationSettings && selectedBranchId) {
      setIsLoadingSettings(true);
      apiFetch('/branches')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.branches) {
            const branch = data.branches.find((b: any) => b.id === selectedBranchId);
            if (branch) {
              if (branch.quotationTheme) setQuotationTheme(branch.quotationTheme);
              if (branch.themeColor) setThemeColor(branch.themeColor);
            }
          }
        })
        .finally(() => setIsLoadingSettings(false));
    }
  }, [showQuotationSettings, selectedBranchId]);

  const handleSaveQuotationSettings = async () => {
    if (!selectedBranchId) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`/branches/${selectedBranchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationTheme,
          themeColor
        })
      });
      if (res.ok) {
        setShowQuotationSettings(false);
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={() => setActiveDropdown(null)} 
        />
      )}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-0 relative overflow-x-hidden selection:bg-primary/30">
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
      <div className="fixed inset-0 z-0 bg-surface pointer-events-none">
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
                <h3 className="text-xl font-bold text-on-surface mb-3">Update Profile</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Update your personal information, manage security settings, and change your password.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/profile" className="w-full glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-primary/30 group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage Profile
                  </Link>
                </div>
              </div>

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
            </div>
          </section>

          {/* Section 2: Business Settings */}
          <section className="animate-fade-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">domain</span>
              Business Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Company Settings */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-secondary/40 hover:shadow-[0_20px_40px_-15px_rgba(136,180,204,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform bg-secondary/10 shadow-[0_0_15px_rgba(136,180,204,0.1)] border border-secondary/20">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>corporate_fare</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Company Settings</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                  Company name, brand, logo, and tax entries. Maintain your professional presence and legal identification.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/settings/company" className="w-full glass-button-icon py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:border-secondary/30 group-hover:text-secondary transition-all">
                    <span className="material-symbols-outlined text-lg">settings</span> Manage
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
                  <button
                    onClick={() => setShowQuotationSettings(true)}
                    className="p-2 rounded-xl text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors tooltip tooltip-left"
                    data-tip="Quick Theme Setup"
                    title="Quick Theme Setup"
                  >
                    <span className="material-symbols-outlined">brush</span>
                  </button>
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

      {/* Quotation Settings Modal - Refined */}
      {showQuotationSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-slide-up" style={{ animationDuration: '0.3s' }}>
          <div className="glass-elevated w-full max-w-lg p-6 sm:p-8 rounded-3xl relative border border-primary/20 shadow-[0_0_50px_rgba(125,211,252,0.2)]">
            <button
              onClick={() => setShowQuotationSettings(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-2 rounded-full transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">palette</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">Quotation Theme</h2>
            </div>

            <p className="text-on-surface-variant text-sm mb-8">Personalize the appearance of your generated Quotation PDFs to match your brand identity.</p>

            {isLoadingSettings ? (
              <div className="flex justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Layout Layout</label>
                  <div className="relative w-full" style={{ zIndex: activeDropdown === 'quotationTheme' ? 50 : 10 }}>
                    <button
                      type="button"
                      className="w-full bg-surface-container/50 border border-outline-variant/30 rounded-xl px-4 py-3.5 text-on-surface focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer font-medium flex items-center justify-between"
                      onClick={() => toggleDropdown('quotationTheme')}
                    >
                      <span>
                        {quotationTheme === 'INDUX_MODERN' ? 'Indux Modern (Recommended)' :
                         quotationTheme === 'CLASSIC' ? 'Classic Corporate' :
                         quotationTheme === 'MINIMAL' ? 'Minimalist' : 'Select Layout'}
                      </span>
                      <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-200 ${activeDropdown === 'quotationTheme' ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    
                    {activeDropdown === 'quotationTheme' && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface-container-highest rounded-xl border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                        {[
                          { value: 'INDUX_MODERN', label: 'Indux Modern (Recommended)' },
                          { value: 'CLASSIC', label: 'Classic Corporate' },
                          { value: 'MINIMAL', label: 'Minimalist' }
                        ].map(theme => (
                          <div 
                            key={theme.value}
                            onClick={() => { setQuotationTheme(theme.value); setActiveDropdown(null); }} 
                            className={`px-4 py-3 text-sm cursor-pointer transition-colors ${quotationTheme === theme.value ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                          >
                            {theme.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Brand Accent Color</label>
                  <div className="flex gap-3 items-center group">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-inner border border-outline-variant/50 cursor-pointer hover:scale-105 transition-transform">
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="flex-1 bg-surface-container/50 border border-outline-variant/30 rounded-xl px-4 py-3.5 text-on-surface focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all uppercase font-mono tracking-wider font-semibold"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>

                {/* Live Preview Sample */}
                <div className="mt-8 p-6 border border-outline-variant/30 rounded-2xl bg-surface-container/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: themeColor }}></div>
                  <div className="flex justify-between items-end border-b-2 pb-3 mb-4" style={{ borderColor: themeColor }}>
                    <div style={{ color: themeColor }} className="text-2xl font-black tracking-widest">QUOTATION</div>
                    <div className="text-xs text-on-surface-variant font-medium">Prepared For: <span className="text-on-surface">Client Name</span></div>
                  </div>
                  <div className="p-3 rounded-lg text-sm font-medium border" style={{ backgroundColor: `${themeColor}10`, color: themeColor, borderColor: `${themeColor}30` }}>
                    Sample block reflecting your selected accent color.
                  </div>
                </div>

                <div className="pt-6 mt-6 flex justify-end gap-3 border-t border-outline-variant/20">
                  <button
                    onClick={() => setShowQuotationSettings(false)}
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuotationSettings}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_8px_20px_rgba(3,105,161,0.3)] hover:shadow-[0_12px_25px_rgba(3,105,161,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:-translate-y-0.5"
                  >
                    {isSaving ? (
                      <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
