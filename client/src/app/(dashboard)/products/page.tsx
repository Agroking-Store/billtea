'use client';

import React from 'react';

export default function ProductsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative">
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(125,211,252,0.03)_0%,_transparent_70%)] pointer-events-none z-0 blur-[60px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,_rgba(200,160,240,0.02)_0%,_transparent_70%)] pointer-events-none z-0 blur-[50px]"></div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface mb-2">Products</h1>
          <p className="text-on-surface-variant text-sm font-body">Manage your luxury hardware inventory</p>
        </div>
        <button className="glass-button-primary group flex items-center gap-2 px-5 py-2.5 rounded-lg text-primary font-semibold text-sm transition-all duration-300 shadow-[0_0_15px_rgba(125,211,252,0.1)] hover:-translate-y-0.5 cursor-pointer">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          New Product
        </button>
      </div>

      {/* Main Content Card */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-lg border border-primary/10 relative z-10">
        {/* Table Controls */}
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-primary/10 bg-surface-container/30">
          <div className="flex items-center gap-3 text-sm text-on-surface-variant">
            <span>Show</span>
            <select className="glass-input text-sm px-3 py-1.5 rounded-lg text-on-surface focus:ring-0 cursor-pointer bg-surface-container-highest">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="relative w-full md:w-80 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">search</span>
            <input className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none transition-all" placeholder="Search products..." type="text"/>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-surface-container-low/50 text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-b border-primary/10">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">HSN Code</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 text-sm">
              {/* Product 1 */}
              <tr className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-6 text-on-surface-variant font-medium">3</td>
                <td className="px-6 py-6">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-primary/10 overflow-hidden">
                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="CHATUR ceramic planter" src="/images/product-chatur.png"/>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">CHATUR | चतुर</span>
                    <span className="text-xs text-on-surface-variant/70">Collection: Modern Earth</span>
                  </div>
                </td>
                <td className="px-6 py-6 font-semibold text-primary">₹2,800.00</td>
                <td className="px-6 py-6 text-on-surface-variant">HSN002</td>
                <td className="px-6 py-6 text-on-surface-variant font-mono">SKU002</td>
                <td className="px-6 py-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                    Inactive
                  </span>
                </td>
                <td className="px-6 py-6 text-right pr-8">
                  <div className="flex justify-end gap-2">
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer hover:text-primary hover:border-primary/30 hover:bg-primary/10" title="Edit">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-error hover:border-error/30 hover:bg-error/10 tooltip cursor-pointer" title="Delete">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Product 2 */}
              <tr className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-6 text-on-surface-variant font-medium">2</td>
                <td className="px-6 py-6">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-primary/10 overflow-hidden">
                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="GULARKA stone planter" src="/images/product-gularka.png"/>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">GULARKA | गुलार्का</span>
                    <span className="text-xs text-on-surface-variant/70">Collection: Arctic Stone</span>
                  </div>
                </td>
                <td className="px-6 py-6 font-semibold text-primary">₹8,000.00</td>
                <td className="px-6 py-6 text-on-surface-variant">HSN003</td>
                <td className="px-6 py-6 text-on-surface-variant font-mono">SKU003</td>
                <td className="px-6 py-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                    Inactive
                  </span>
                </td>
                <td className="px-6 py-6 text-right pr-8">
                  <div className="flex justify-end gap-2">
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer hover:text-primary hover:border-primary/30 hover:bg-primary/10" title="Edit">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-error hover:border-error/30 hover:bg-error/10 tooltip cursor-pointer" title="Delete">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Product 3 */}
              <tr className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-6 text-on-surface-variant font-medium">4</td>
                <td className="px-6 py-6">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-primary/10 overflow-hidden">
                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="PRITHVI vase" src="/images/product-prithvi.png"/>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">PRITHVI | पृथ्वी</span>
                    <span className="text-xs text-on-surface-variant/70">Collection: Obsidian Elegance</span>
                  </div>
                </td>
                <td className="px-6 py-6 font-semibold text-primary">₹4,850.00</td>
                <td className="px-6 py-6 text-on-surface-variant">HSN001</td>
                <td className="px-6 py-6 text-on-surface-variant font-mono">SKU001</td>
                <td className="px-6 py-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]">
                    Active
                  </span>
                </td>
                <td className="px-6 py-6 text-right pr-8">
                  <div className="flex justify-end gap-2">
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer hover:text-primary hover:border-primary/30 hover:bg-primary/10" title="Edit">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-error hover:border-error/30 hover:bg-error/10 tooltip cursor-pointer" title="Delete">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Product 4 */}
              <tr className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-6 text-on-surface-variant font-medium">1</td>
                <td className="px-6 py-6">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-primary/10 overflow-hidden">
                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="VRINDA decorative pot" src="/images/product-vrinda.png"/>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">VRINDA | वृंदा</span>
                    <span className="text-xs text-on-surface-variant/70">Collection: Industrial Zen</span>
                  </div>
                </td>
                <td className="px-6 py-6 font-semibold text-primary">₹1,000.00</td>
                <td className="px-6 py-6 text-on-surface-variant">HSN004</td>
                <td className="px-6 py-6 text-on-surface-variant font-mono">SKU004</td>
                <td className="px-6 py-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]">
                    Active
                  </span>
                </td>
                <td className="px-6 py-6 text-right pr-8">
                  <div className="flex justify-end gap-2">
                    <button className="glass-button-icon p-1 rounded-md transition-all tooltip cursor-pointer hover:text-primary hover:border-primary/30 hover:bg-primary/10" title="Edit">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-error hover:border-error/30 hover:bg-error/10 tooltip cursor-pointer" title="Delete">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="mt-auto p-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-on-surface-variant/70 border-t border-primary/10 bg-surface-container/30">
          <div>
            Showing <span className="text-on-surface font-medium">1</span> to <span className="text-on-surface font-medium">4</span> of <span className="text-on-surface font-medium">4</span> entries
          </div>
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
