import React from 'react';

export default function Customers() {
  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative">
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(125,211,252,0.03)_0%,_transparent_70%)] pointer-events-none z-0 blur-[60px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,_rgba(200,160,240,0.02)_0%,_transparent_70%)] pointer-events-none z-0 blur-[50px]"></div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">
            Customers
          </h1>
          <p className="text-on-surface-variant/80 text-sm font-body">Manage your business connections and relationship data.</p>
        </div>
        <button className="glass-button-primary group flex items-center gap-2 px-5 py-2.5 rounded-lg text-primary font-semibold text-sm transition-all duration-300 shadow-[0_0_15px_rgba(125,211,252,0.1)] hover:-translate-y-0.5 cursor-pointer">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          New Customer
        </button>
      </div>

      {/* Main Content Glass Card */}
      <section className="glass-panel rounded-xl overflow-hidden mb-12 relative z-10 border border-primary/10 shadow-lg">
        {/* Table Controls */}
        <div className="p-6 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container/30">
          <div className="flex items-center gap-3">
            <span className="text-sm text-on-surface-variant">Show</span>
            <select className="glass-input text-sm px-3 py-1.5 rounded-lg text-on-surface focus:ring-0 cursor-pointer bg-surface-container-highest">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-sm text-on-surface-variant">entries</span>
          </div>
          <div className="relative w-full sm:w-80 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">search</span>
            <input className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none transition-all" placeholder="Search customers..." type="text"/>
          </div>
        </div>

        {/* High-Fidelity Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-surface-container-low/50 text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-b border-primary/10">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-center">Invoices</th>
                <th className="px-6 py-4 text-center">Quotations</th>
                <th className="px-6 py-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 text-sm">
              {/* Row 1 */}
              <tr className="group hover:bg-primary/5 transition-colors duration-200">
                <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">1</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-400/20 flex items-center justify-center text-primary font-bold shadow-lg">
                      SA
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-on-surface">Sarang Sharad Wagh</div>
                      <div className="text-xs text-on-surface-variant/70">WS Creators</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-on-surface-variant">sarangwagh54321@gmail.com</td>
                <td className="px-6 py-5 text-sm text-on-surface-variant">8180849725</td>
                <td className="px-6 py-5 text-sm text-on-surface-variant max-w-[200px] truncate">B T Kawade Road Ghorpadi</td>
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-container/45 text-secondary text-xs font-medium border border-secondary/10">
                    <span className="material-symbols-outlined text-sm">description</span>
                    0
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tertiary-container/45 text-tertiary text-xs font-medium border border-tertiary/10">
                    <span className="material-symbols-outlined text-sm">request_quote</span>
                    0
                  </span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
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
              {/* Row 2 */}
              <tr className="group hover:bg-primary/5 transition-colors duration-200">
                <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">2</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 border border-rose-400/20 flex items-center justify-center text-rose-300 font-bold shadow-lg">
                      AD
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-on-surface">Aditya Shastri</div>
                      <div className="text-xs text-on-surface-variant/70">Kings Company</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-on-surface-variant">cust@email.com</td>
                <td className="px-6 py-5 text-sm text-on-surface-variant">1235469780</td>
                <td className="px-6 py-5 text-sm text-on-surface-variant max-w-[200px] truncate">Sus, Pune</td>
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-container/45 text-secondary text-xs font-medium border border-secondary/20 shadow-[0_0_10px_rgba(136,180,204,0.1)]">
                    <span className="material-symbols-outlined text-sm">description</span>
                    2
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tertiary-container/45 text-tertiary text-xs font-medium border border-tertiary/20 shadow-[0_0_10px_rgba(200,160,240,0.1)]">
                    <span className="material-symbols-outlined text-sm">request_quote</span>
                    1
                  </span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
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

        {/* Pagination */}
        <div className="mt-auto p-6 border-t border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container/30">
          <span className="text-sm text-on-surface-variant/70">
            Showing <span className="text-on-surface font-semibold">1</span> to <span className="text-on-surface font-semibold">2</span> of <span className="text-on-surface font-semibold">2</span> entries
          </span>
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
      </section>
    </div>
  );
}
