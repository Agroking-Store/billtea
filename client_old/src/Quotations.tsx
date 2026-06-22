import React from 'react';

export default function Quotations() {
  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Quotations</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage and track your customer quotes.</p>
        </div>
        <button className="glass-button-primary rounded-lg py-2.5 px-5 flex items-center gap-2 text-sm font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(125,211,252,0.1)] hover:-translate-y-0.5 cursor-pointer">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          Create Quotation
        </button>
      </div>

      {/* Glassmorphic Data Table Container */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-lg border border-primary/10 relative z-10">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        {/* Table Controls */}
        <div className="p-6 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container/30">
          <div className="flex items-center gap-3 text-sm text-on-surface-variant">
            <span>Show</span>
            <select className="glass-input rounded-md py-1.5 px-3 text-on-surface focus:ring-0 focus:border-primary/50 text-sm cursor-pointer appearance-none pr-8 relative bg-surface-container-highest">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input className="glass-input pl-9 pr-4 py-2 rounded-lg text-sm text-on-surface placeholder-on-surface-variant/50 w-full sm:w-72 focus:outline-none transition-all" placeholder="Search quotations..." type="text" />
          </div>
        </div>
        
        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low/50 border-b border-primary/10">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group" scope="col">
                  <div className="flex items-center gap-1">
                    # <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group" scope="col">
                  <div className="flex items-center gap-1">
                    Quotation Number <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group" scope="col">
                  <div className="flex items-center gap-1">
                    Customer <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group" scope="col">
                  <div className="flex items-center gap-1">
                    Date <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group" scope="col">
                  <div className="flex items-center gap-1">
                    Total Amount <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100">unfold_more</span>
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider text-center" scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {/* Row 1 */}
              <tr className="hover:bg-primary/5 transition-colors duration-200">
                <td className="px-6 py-4 font-medium text-on-surface-variant">1</td>
                <td className="px-6 py-4 font-semibold text-primary">QT-000001</td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    AS
                  </div>
                  <span className="text-on-surface">Aditya Shastri</span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">18-06-2026</td>
                <td className="px-6 py-4 font-semibold text-on-surface">₹106.20</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer" title="View">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer" title="Download">
                      <span className="material-symbols-outlined text-[16px]">download</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer" title="Copy">
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-error hover:border-error/30 hover:bg-error/10 tooltip cursor-pointer" title="Delete">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 tooltip cursor-pointer" title="Send">
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer relative" title="Comments">
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                      <span className="absolute -top-1 -right-1.5 bg-primary text-on-primary text-[9px] font-bold px-1 py-0.5 rounded-full shadow-sm leading-none flex items-center justify-center min-w-[14px] h-[14px] pointer-events-none">3</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination & Scrollbar Track */}
        <div className="p-6 border-t border-primary/10 bg-surface-container/30 flex flex-col gap-4">
          <div className="w-full h-2 bg-surface-container-highest rounded-full flex items-center px-1 relative">
            <span className="material-symbols-outlined text-xs text-on-surface-variant absolute left-0 -ml-3">arrow_left</span>
            <div className="h-1.5 w-full bg-outline-variant rounded-full opacity-50"></div>
            <span className="material-symbols-outlined text-xs text-on-surface-variant absolute right-0 -mr-3">arrow_right</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
            <span className="text-sm text-on-surface-variant">Showing 1 to 1 of 1 entries</span>
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
    </div>
  );
}
