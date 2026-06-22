'use client';

import React from 'react';

export default function InvoicesPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Invoices</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage and track your operational billing cycles</p>
        </div>
        <button className="glass-button-primary rounded-lg py-2.5 px-5 flex items-center gap-2 text-sm font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(125,211,252,0.1)] hover:-translate-y-0.5 cursor-pointer">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          Create New Invoice
        </button>
      </div>

      {/* Glassmorphic Management Card */}
      <div className="glass-panel rounded-xl overflow-hidden flex flex-col flex-grow min-h-[600px] border border-primary/10 shadow-lg relative z-10">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        {/* Filters & Search Toolbar */}
        <div className="p-6 border-b border-primary/10 flex flex-wrap items-center justify-between gap-6 bg-surface-container/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">Show</span>
              <select className="glass-input h-9 px-3 rounded-md text-sm bg-surface-container-highest text-on-surface focus:ring-0 focus:border-primary/50 cursor-pointer">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="text-sm text-on-surface-variant">entries</span>
            </div>
            <div className="h-4 w-px bg-primary/10 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">Filter by:</span>
              <select className="glass-input h-9 px-3 rounded-md text-sm bg-surface-container-highest text-on-surface focus:ring-0 focus:border-primary/50 cursor-pointer">
                <option value="all">All Invoices</option>
                <option value="paid">Paid Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
          </div>
          <div className="relative flex-grow md:flex-grow-0 md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input className="glass-input w-full h-10 pl-9 pr-4 rounded-lg text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none transition-all" placeholder="Search invoices..." type="text" />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-surface-container-low/50 text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-b border-primary/10">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group">
                  <div className="flex items-center gap-1">
                    Invoice Number
                    <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group">
                  <div className="flex items-center gap-1">
                    Customer
                    <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group">
                  <div className="flex items-center gap-1">
                    Date
                    <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group">
                  <div className="flex items-center gap-1">
                    Total
                    <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 text-sm">
              {/* Row 1 */}
              <tr className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-4 text-on-surface-variant font-medium">1</td>
                <td className="px-6 py-4 font-semibold text-primary">INV-000002</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary text-xs font-bold border border-secondary/20">AS</div>
                    <span className="text-on-surface font-medium">Aditya Shastri</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">18-06-2026</td>
                <td className="px-6 py-4 font-bold text-on-surface">₹9,700.00</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Paid</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer hover:text-primary hover:border-primary/30 hover:bg-primary/10" title="View">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer hover:text-primary hover:border-primary/30 hover:bg-primary/10" title="Download">
                      <span className="material-symbols-outlined text-[16px]">download</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-error hover:border-error/30 hover:bg-error/10 tooltip cursor-pointer" title="Delete">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 tooltip cursor-pointer" title="Send">
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-4 text-on-surface-variant font-medium">2</td>
                <td className="px-6 py-4 font-semibold text-primary">INV-000001</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary text-xs font-bold border border-secondary/20">AS</div>
                    <span className="text-on-surface font-medium">Aditya Shastri</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">18-06-2026</td>
                <td className="px-6 py-4 font-bold text-on-surface">₹9,700.00</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="w-max inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-error/10 text-error border border-error/20 shadow-[0_0_10px_rgba(255,107,107,0.1)]">Pending</span>
                    <span className="text-[10px] text-error/60 mt-1 pl-1 font-medium">₹9,700.00 due</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer hover:text-primary hover:border-primary/30 hover:bg-primary/10" title="View">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer hover:text-primary hover:border-primary/30 hover:bg-primary/10" title="Download">
                      <span className="material-symbols-outlined text-[16px]">download</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-error hover:border-error/30 hover:bg-error/10 tooltip cursor-pointer" title="Delete">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 tooltip cursor-pointer" title="Send">
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="mt-auto p-6 border-t border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container/30">
          <div className="w-full h-2 bg-surface-container-highest rounded-full flex items-center px-1 relative md:hidden">
            <span className="material-symbols-outlined text-xs text-on-surface-variant absolute left-0 -ml-3">arrow_left</span>
            <div className="h-1.5 w-full bg-outline-variant rounded-full opacity-50"></div>
            <span className="material-symbols-outlined text-xs text-on-surface-variant absolute right-0 -mr-3">arrow_right</span>
          </div>
          <span className="text-sm text-on-surface-variant">Showing 1 to 2 of 2 entries</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface-container-highest border border-transparent transition-colors disabled:opacity-50 cursor-pointer" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)] cursor-pointer">
              1
            </button>
            <button className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border border-transparent transition-colors disabled:opacity-50 cursor-pointer" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
