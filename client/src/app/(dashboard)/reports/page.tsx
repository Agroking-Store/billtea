'use client';

import React from 'react';

export default function ReportsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative">
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(125,211,252,0.03)_0%,_transparent_70%)] pointer-events-none z-0 blur-[60px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,_rgba(200,160,240,0.02)_0%,_transparent_70%)] pointer-events-none z-0 blur-[50px]"></div>

      <div className="flex flex-col gap-8 relative z-10 max-w-[1440px] mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display mb-2">
              <span className="text-on-surface">Invoice </span>
              <span className="bg-gradient-to-br from-primary to-tertiary bg-clip-text text-transparent">Reports</span>
            </h1>
            <p className="text-on-surface-variant text-lg">Financial overview and tracking for Indux Technology.</p>
          </div>
          <button className="glass-elevated px-6 py-3 rounded-xl border border-primary/30 text-primary font-semibold flex items-center gap-2 hover:bg-primary/10 transition-all duration-300 shadow-[0_0_15px_rgba(125,211,252,0.2)] hover:shadow-[0_0_25px_rgba(125,211,252,0.4)] active:scale-95 group cursor-pointer">
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">analytics</span>
            Profit & Loss Report
          </button>
        </header>

        {/* Filters Section */}
        <section className="glass-panel p-6 md:p-8 rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">filter_list</span>
            <h2 className="text-xl font-bold text-on-surface">Filters</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">From Date</label>
              <input className="w-full h-12 px-4 rounded-lg bg-surface-container text-on-surface focus:ring-0 border border-primary/20 focus:border-primary transition-colors focus:shadow-[0_0_10px_rgba(125,211,252,0.3)] outline-none" type="date" defaultValue="2026-05-21" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">To Date</label>
              <input className="w-full h-12 px-4 rounded-lg bg-surface-container text-on-surface focus:ring-0 border border-primary/20 focus:border-primary transition-colors focus:shadow-[0_0_10px_rgba(125,211,252,0.3)] outline-none" type="date" defaultValue="2026-06-21" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Customer</label>
              <select className="w-full h-12 px-4 rounded-lg bg-surface-container text-on-surface focus:ring-0 border border-primary/20 focus:border-primary transition-colors focus:shadow-[0_0_10px_rgba(125,211,252,0.3)] outline-none">
                <option>All Customers</option>
                <option>Aditya Shastri</option>
                <option>Indux Tech Corp</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Payment Status</label>
              <select className="w-full h-12 px-4 rounded-lg bg-surface-container text-on-surface focus:ring-0 border border-primary/20 focus:border-primary transition-colors focus:shadow-[0_0_10px_rgba(125,211,252,0.3)] outline-none">
                <option>All Status</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Overdue</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(125,211,252,0.2)] hover:shadow-[0_0_25px_rgba(125,211,252,0.4)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
              Apply Filters
            </button>
            <button className="bg-surface-variant text-on-surface px-8 py-3 rounded-lg font-semibold hover:bg-surface-container-highest transition-all cursor-pointer">
              Clear Filters
            </button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-elevated p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-9xl">receipt</span>
            </div>
            <p className="text-on-surface-variant text-sm font-medium mb-1">Total Invoices</p>
            <p className="text-4xl font-black text-on-surface">2</p>
          </div>
          <div className="glass-elevated p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-9xl">payments</span>
            </div>
            <p className="text-on-surface-variant text-sm font-medium mb-1">Total Amount</p>
            <p className="text-4xl font-black text-primary">₹19,400.00</p>
          </div>
          <div className="glass-elevated p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-9xl">verified_user</span>
            </div>
            <p className="text-on-surface-variant text-sm font-medium mb-1">Total Paid</p>
            <p className="text-4xl font-black text-secondary">₹9,700.00</p>
          </div>
          <div className="glass-elevated p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-9xl">pending_actions</span>
            </div>
            <p className="text-on-surface-variant text-sm font-medium mb-1">Total Pending</p>
            <p className="text-4xl font-black text-tertiary">₹9,700.00</p>
          </div>
        </section>

        {/* Invoice Details Table */}
        <section className="glass-panel rounded-xl overflow-hidden flex flex-col mb-12">
          <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container/30">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              <h2 className="text-xl font-bold text-on-surface">Invoice Details</h2>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64 group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">search</span>
                <input className="glass-input w-full pl-10 pr-4 h-10 rounded-full text-sm outline-none placeholder:text-on-surface-variant/50 transition-all" placeholder="Search invoices..." type="text" />
              </div>
              <div className="flex gap-2">
                <button className="p-2 glass-button-icon rounded-lg hover:bg-primary/10 transition-colors tooltip cursor-pointer" title="Export PDF">
                  <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                </button>
                <button className="p-2 glass-button-icon rounded-lg hover:bg-primary/10 transition-colors tooltip cursor-pointer" title="Export Excel">
                  <span className="material-symbols-outlined text-primary">table_view</span>
                </button>
                <button className="p-2 glass-button-icon rounded-lg hover:bg-primary/10 transition-colors tooltip cursor-pointer" title="Export CSV">
                  <span className="material-symbols-outlined text-primary">csv</span>
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-surface-container/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">#</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Invoice Number</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Total Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Paid Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Pending Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5 text-sm">
                <tr className="hover:bg-primary/5 transition-colors group cursor-pointer active:scale-[0.995]">
                  <td className="px-6 py-5 text-on-surface-variant font-medium">1</td>
                  <td className="px-6 py-5 font-bold text-on-surface group-hover:text-primary transition-colors">INV-000001</td>
                  <td className="px-6 py-5 text-on-surface-variant">18 Jun 2026</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">AS</div>
                      <span className="text-on-surface">Aditya Shastri</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-semibold text-on-surface">₹9,700.00</td>
                  <td className="px-6 py-5 text-right text-on-surface-variant">₹0.00</td>
                  <td className="px-6 py-5 text-right font-bold text-tertiary">₹9,700.00</td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-bold border border-error/20 bg-error/10 text-error shadow-[0_0_10px_rgba(255,107,107,0.1)]">Pending</span>
                  </td>
                </tr>
                <tr className="hover:bg-primary/5 transition-colors group cursor-pointer active:scale-[0.995]">
                  <td className="px-6 py-5 text-on-surface-variant font-medium">2</td>
                  <td className="px-6 py-5 font-bold text-on-surface group-hover:text-primary transition-colors">INV-000002</td>
                  <td className="px-6 py-5 text-on-surface-variant">18 Jun 2026</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary">AS</div>
                      <span className="text-on-surface">Aditya Shastri</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-semibold text-on-surface">₹9,700.00</td>
                  <td className="px-6 py-5 text-right font-bold text-secondary">₹9,700.00</td>
                  <td className="px-6 py-5 text-right text-on-surface-variant">₹0.00</td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-bold border border-secondary/20 bg-secondary/10 text-secondary shadow-[0_0_10px_rgba(136,180,204,0.1)]">Paid</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-outline-variant/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container/30">
            <p className="text-sm text-on-surface-variant">Showing <span className="text-on-surface font-semibold">2</span> entries</p>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest disabled:opacity-30 cursor-pointer transition-colors" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary font-bold shadow-[0_0_10px_rgba(125,211,252,0.3)] cursor-pointer">1</button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest cursor-pointer transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
