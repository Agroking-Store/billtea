'use client';

import React, { useState, useMemo } from 'react';

interface Expense {
  id: string;
  date: string;
  amount: number;
  method: string;
  note: string;
  attachment: boolean;
  status: 'Approved' | 'Pending';
}

const initialExpenses: Expense[] = [
  {
    id: 'EX-9042',
    date: '22 Jun 2026',
    amount: 2500.00,
    method: 'Cash',
    note: 'Office stationery and supplies',
    attachment: true,
    status: 'Approved'
  },
  {
    id: 'EX-9041',
    date: '21 Jun 2026',
    amount: 12450.00,
    method: 'Bank Transfer',
    note: 'Cloud Infrastructure Monthly',
    attachment: true,
    status: 'Approved'
  },
  {
    id: 'EX-9040',
    date: '19 Jun 2026',
    amount: 850.00,
    method: 'Credit Card',
    note: 'Team Lunch - Client Onboarding',
    attachment: false,
    status: 'Pending'
  },
  {
    id: 'EX-9039',
    date: '18 Jun 2026',
    amount: 1200.00,
    method: 'Cash',
    note: 'Travel allowance for logistics team',
    attachment: true,
    status: 'Approved'
  }
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    method: 'Cash',
    note: '',
    attachment: false,
    status: 'Pending' as 'Pending' | 'Approved'
  });

  // Calculate dynamic stats
  const totalSpend = useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const uniqueMethods = useMemo(() => {
    return new Set(expenses.map(e => e.method)).size;
  }, [expenses]);

  const topMethod = useMemo(() => {
    if (expenses.length === 0) return 'None';
    const counts: Record<string, number> = {};
    expenses.forEach(e => {
      counts[e.method] = (counts[e.method] || 0) + 1;
    });
    let maxMethod = 'None';
    let maxCount = 0;
    Object.entries(counts).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxMethod = method;
      }
    });
    return maxMethod;
  }, [expenses]);

  // Open modal for new expense
  const handleNewExpense = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingExpense(null);
    setFormData({
      date: today,
      amount: '',
      method: 'Cash',
      note: '',
      attachment: false,
      status: 'Pending'
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    
    // Parse date from '22 Jun 2026' back to '2026-06-22' for HTML date input
    let formDate = '';
    try {
      const parts = expense.date.split(' ');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = months.indexOf(parts[1]);
        const month = String(monthIndex + 1).padStart(2, '0');
        const year = parts[2];
        if (monthIndex !== -1) {
          formDate = `${year}-${month}-${day}`;
        }
      }
    } catch (e) {
      formDate = '';
    }

    setFormData({
      date: formDate || new Date().toISOString().split('T')[0],
      amount: String(expense.amount),
      method: expense.method,
      note: expense.note,
      attachment: expense.attachment,
      status: expense.status
    });
    setIsModalOpen(true);
  };

  // Helper to format date back to UI: '22 Jun 2026'
  const formatDateToUI = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateString;
    }
  };

  // Save expense
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formData.amount) || 0;
    const formattedDate = formatDateToUI(formData.date);

    if (editingExpense) {
      // Edit
      setExpenses(prev => prev.map(item => 
        item.id === editingExpense.id 
          ? { ...item, ...formData, amount: parsedAmount, date: formattedDate }
          : item
      ));
    } else {
      // Create new ID: EX-XXXX
      const nextIdNum = expenses.length > 0 
        ? Math.max(...expenses.map(e => parseInt(e.id.replace('EX-', '')) || 0)) + 1 
        : 9043;
      const newExpense: Expense = {
        id: `EX-${nextIdNum}`,
        date: formattedDate,
        amount: parsedAmount,
        method: formData.method,
        note: formData.note,
        attachment: formData.attachment,
        status: formData.status
      };
      setExpenses(prev => [newExpense, ...prev]);
    }
    setIsModalOpen(false);
  };

  // Delete expense
  const handleDeleteExpense = (id: string) => {
    if (confirm(`Are you sure you want to delete expense ${id}?`)) {
      setExpenses(prev => prev.filter(item => item.id !== id));
    }
  };

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const matchesSearch = 
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.method.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        item.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [expenses, searchQuery, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / entriesPerPage) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredExpenses.slice(start, start + entriesPerPage);
  }, [filteredExpenses, currentPage, entriesPerPage]);

  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, filteredExpenses.length);

  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative overflow-x-hidden selection:bg-primary/30">
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(125,211,252,0.03)_0%,_transparent_70%)] pointer-events-none z-0 blur-[60px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,_rgba(200,160,240,0.02)_0%,_transparent_70%)] pointer-events-none z-0 blur-[50px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8 pb-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <span className="text-primary font-bold tracking-widest text-xs uppercase">Indux Tech Finance</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-3">Expenses</h1>
            <p className="text-on-surface-variant max-w-xl text-lg font-light leading-relaxed">
              Track and manage your business expenditures with our high-precision management engine. Real-time auditing for the modern ecosystem.
            </p>
          </div>
          <div>
            <button 
              onClick={handleNewExpense}
              className="shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-8 py-3 rounded-lg font-bold tracking-tight transition-all duration-300 flex items-center gap-2 group active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Expense
            </button>
          </div>
        </header>

        {/* Search and Filter Row */}
        <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Search Input Container */}
            <div className="relative w-full md:w-80 transition-all duration-300 rounded-lg border border-outline-variant focus-within:shadow-[0_0_15px_rgba(125,211,252,0.2)] focus-within:border-primary/50">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                className="w-full bg-surface-container-low rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface transition-all placeholder:text-on-surface-variant/50 border-none outline-none focus:ring-0" 
                placeholder="Search expenses..." 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            {/* Page Entry Selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">Show:</span>
              <select 
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:ring-0 focus:border-primary/50 outline-none cursor-pointer"
              >
                <option value={10}>10 entries</option>
                <option value={25}>25 entries</option>
                <option value={50}>50 entries</option>
              </select>
            </div>
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button 
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                  : 'text-on-surface-variant border border-outline-variant hover:border-primary/30 hover:text-primary'
              }`}
            >
              All Time
            </button>
            <button 
              onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                  : 'text-on-surface-variant border border-outline-variant hover:border-primary/30 hover:text-primary'
              }`}
            >
              Pending
            </button>
            <button 
              onClick={() => { setStatusFilter('approved'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                  : 'text-on-surface-variant border border-outline-variant hover:border-primary/30 hover:text-primary'
              }`}
            >
              Approved
            </button>
            <div className="h-6 w-px bg-outline-variant mx-1"></div>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary transition-all cursor-pointer">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="glass-panel rounded-xl overflow-hidden border border-primary/10">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/40 text-on-surface-variant text-xs font-bold uppercase tracking-widest border-b border-primary/10">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Note</th>
                  <th className="px-6 py-4">Attachment</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-on-surface-variant italic">
                      No expenses found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((item) => (
                    <tr key={item.id} className="row-hover transition-colors duration-200 group">
                      <td className="px-6 py-5 font-mono text-xs text-primary/70">{item.id}</td>
                      <td className="px-6 py-5 text-on-surface font-medium whitespace-nowrap">{item.date}</td>
                      <td className="px-6 py-5 font-bold text-on-surface">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          item.method === 'Bank Transfer' || item.method === 'UPI'
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-surface-container-highest border-outline-variant text-on-surface-variant'
                        }`}>
                          {item.method}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-on-surface-variant italic truncate max-w-[200px]" title={item.note}>{item.note}</td>
                      <td className="px-6 py-5">
                        {item.attachment ? (
                          <button className="flex items-center gap-2 text-primary hover:text-primary-fixed transition-colors font-medium cursor-pointer">
                            <span className="material-symbols-outlined text-base">attach_file</span>
                            View
                          </button>
                        ) : (
                          <button className="flex items-center gap-2 text-on-surface-variant opacity-40 cursor-not-allowed font-medium">
                            <span className="material-symbols-outlined text-base">cloud_off</span>
                            None
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditExpense(item)}
                            className="p-2 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">edit_square</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(item.id)}
                            className="p-2 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-all cursor-pointer"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Section */}
        <footer className="glass-panel-elevated rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-on-surface-variant font-medium">
            Showing <span className="text-on-surface">{filteredExpenses.length > 0 ? startIndex : 0}</span> to <span className="text-on-surface">{endIndex}</span> of <span className="text-on-surface">{filteredExpenses.length}</span> expenses
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button 
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-primary/20 text-primary border-primary/45 shadow-[0_0_10px_rgba(125,211,252,0.1)]'
                      : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/30'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </footer>

        {/* Bento Grid Stats */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full transition-all group-hover:scale-150"></div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Total Monthly Spend</h3>
            <div className="text-3xl font-extrabold text-on-surface">₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              12% from last month
            </div>
          </div>
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-tertiary/10 blur-3xl rounded-full transition-all group-hover:scale-150"></div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-tertiary mb-2">Active Categories</h3>
            <div className="text-3xl font-extrabold text-on-surface">{uniqueMethods} Method{uniqueMethods !== 1 ? 's' : ''}</div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              Top category: {topMethod}
            </div>
          </div>
          <div className="glass-panel rounded-xl p-0 overflow-hidden relative group md:col-span-1 min-h-[140px]">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10"></div>
            <div className="p-6 relative z-20 h-full flex flex-col justify-end">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Financial Report</h3>
              <div className="text-xl font-bold text-white">Q3 Projection</div>
            </div>
            <img 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt="System crystal pattern visualization" 
              src="/images/expenses-visualization.png"
            />
          </div>
        </section>
      </div>

      {/* Glassmorphic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md px-4">
          <div className="glass-panel-elevated max-w-lg w-full rounded-2xl p-6 relative overflow-hidden flex flex-col gap-5 border border-primary/20 shadow-2xl">
            {/* Decorative Glow */}
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 blur-3xl rounded-full"></div>
            
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 relative z-10">
              <h3 className="text-xl font-bold text-on-surface">
                {editingExpense ? 'Edit Expense' : 'New Expense'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-outline-variant/20 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">Date</label>
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">Amount (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-on-surface outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">Payment Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-on-surface outline-none cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Pending' | 'Approved' }))}
                    className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-on-surface outline-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">Note / Description</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Describe the expenditure..."
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-on-surface outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox"
                  id="attachment-checkbox"
                  checked={formData.attachment}
                  onChange={(e) => setFormData(prev => ({ ...prev, attachment: e.target.checked }))}
                  className="rounded border-outline-variant bg-surface-container-low text-primary focus:ring-0 cursor-pointer"
                />
                <label htmlFor="attachment-checkbox" className="text-sm text-on-surface-variant font-medium cursor-pointer select-none">
                  Include invoice/receipt attachment (mocked)
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-outline-variant/20 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-outline-variant/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-6 py-2.5 rounded-lg font-bold transition-all duration-300 shadow-[0_0_15px_rgba(125,211,252,0.2)] cursor-pointer animate-pulse-subtle"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
