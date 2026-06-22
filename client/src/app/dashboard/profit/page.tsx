'use client';

import React from 'react';

export default function ProfitReportPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative overflow-x-hidden">
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(125,211,252,0.03)_0%,_transparent_70%)] pointer-events-none z-0 blur-[60px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,_rgba(200,160,240,0.02)_0%,_transparent_70%)] pointer-events-none z-0 blur-[50px]"></div>

      <div className="relative z-10 max-w-[1440px] mx-auto flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2">Profit Report</h1>
            <p className="text-on-surface-variant text-lg">Financial performance and net earnings analysis</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="glass-panel px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium text-on-surface hover:bg-primary/10 transition-all duration-300 cursor-pointer">
              <span className="material-symbols-outlined text-primary text-xl">picture_as_pdf</span>
              Export PDF
            </button>
            <button className="glass-panel px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium text-on-surface hover:bg-primary/10 transition-all duration-300 cursor-pointer">
              <span className="material-symbols-outlined text-primary text-xl">csv</span>
              Export CSV
            </button>
            <button className="glass-panel px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium text-on-surface hover:bg-primary/10 transition-all duration-300 cursor-pointer">
              <span className="material-symbols-outlined text-primary text-xl">table_view</span>
              Export Excel
            </button>
          </div>
        </header>

        {/* Filters Section */}
        <section className="glass-elevated rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]">
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">From Date</label>
              <div className="relative">
                <input className="w-full bg-surface-container/50 border border-outline/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" type="date" defaultValue="2026-05-22" />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">To Date</label>
              <div className="relative">
                <input className="w-full bg-surface-container/50 border border-outline/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" type="date" defaultValue="2026-06-22" />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="bg-primary/20 text-primary border border-primary/40 px-8 py-3 rounded-xl font-bold hover:bg-primary/30 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.2)] cursor-pointer">
                <span className="material-symbols-outlined">filter_list</span>
                Apply Filter
              </button>
              <button className="glass-panel px-8 py-3 rounded-xl font-medium text-on-surface-variant hover:text-on-surface transition-all cursor-pointer">
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Summary Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Income */}
          <div className="glass-elevated rounded-2xl p-6 relative overflow-hidden group transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-primary">currency_rupee</span>
            </div>
            <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest mb-4">Total Income</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <h3 className="text-3xl font-bold text-on-surface tracking-tight">₹19,400.00</h3>
            </div>
            <div className="mt-4 h-1 w-full bg-primary/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[70%] opacity-40"></div>
            </div>
          </div>
          {/* Total Expense */}
          <div className="glass-elevated rounded-2xl p-6 relative overflow-hidden group transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-error">currency_rupee</span>
            </div>
            <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest mb-4">Total Expense</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center border border-error/20">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
              </div>
              <h3 className="text-3xl font-bold text-on-surface tracking-tight">₹0.00</h3>
            </div>
            <div className="mt-4 h-1 w-full bg-error/5 rounded-full overflow-hidden">
              <div className="h-full bg-error w-[5%] opacity-40"></div>
            </div>
          </div>
          {/* Net Profit */}
          <div className="glass-elevated rounded-2xl p-6 relative overflow-hidden group border-primary/30 shadow-[0_0_20px_rgba(125,211,252,0.2)] transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <span className="material-symbols-outlined text-6xl text-primary">analytics</span>
            </div>
            <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest mb-4">Net Profit</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/40">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              </div>
              <h3 className="text-3xl font-bold text-primary tracking-tight">₹19,400.00</h3>
            </div>
            <div className="mt-4 h-1 w-full bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full"></div>
            </div>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="glass-elevated rounded-2xl overflow-hidden border border-outline/10 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01] flex flex-col mb-12">
          {/* Table Header Controls */}
          <div className="p-6 border-b border-outline/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container/30">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
                <span className="text-sm font-bold text-on-surface whitespace-nowrap">Date-wise Breakdown</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span>Show</span>
                <select className="bg-surface-container border border-outline/20 rounded px-2 py-1 text-xs focus:ring-0 focus:border-primary/50 cursor-pointer outline-none">
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
                <span>entries</span>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="w-full bg-surface-container/50 border border-outline/20 rounded-xl pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/50" placeholder="Search dates..." type="text" />
            </div>
          </div>
          {/* Table Body */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-surface-container/30">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline/10">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline/10 text-right">Income (₹)</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline/10 text-right">Expense (₹)</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline/10 text-right">Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/5 text-sm">
                <tr className="hover:bg-primary/5 transition-colors group cursor-pointer active:scale-[0.995]">
                  <td className="px-6 py-5 font-medium text-on-surface">18 Jun 2026</td>
                  <td className="px-6 py-5 font-bold text-primary text-right">19,400.00</td>
                  <td className="px-6 py-5 font-medium text-error text-right">0.00</td>
                  <td className="px-6 py-5 font-bold text-on-surface text-right">19,400.00</td>
                </tr>
                {/* Repeat rows could go here */}
              </tbody>
              <tfoot>
                <tr className="bg-surface-container/50 border-t-2 border-primary/20">
                  <td className="px-6 py-5 text-sm font-black uppercase tracking-wider text-on-surface">TOTAL:</td>
                  <td className="px-6 py-5 text-lg font-black text-primary text-right">₹19,400.00</td>
                  <td className="px-6 py-5 text-lg font-black text-error text-right">₹0.00</td>
                  <td className="px-6 py-5 text-lg font-black text-on-surface text-right">₹19,400.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Pagination Footer */}
          <div className="p-6 border-t border-outline/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container/10">
            <p className="text-sm text-on-surface-variant">Showing 1 to 1 of 1 entries</p>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-on-surface-variant hover:bg-primary/10 transition-colors disabled:opacity-30 cursor-pointer" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 text-primary font-bold shadow-[0_0_10px_rgba(125,211,252,0.2)] cursor-pointer">1</button>
              <button className="p-2 rounded-lg text-on-surface-variant hover:bg-primary/10 transition-colors disabled:opacity-30 cursor-pointer" disabled>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
