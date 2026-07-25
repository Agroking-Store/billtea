'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/auth';
import { useBranch } from '@/components/BranchProvider';
import { exportProfitPDF, exportProfitExcel } from '@/lib/exportUtils';

interface Invoice {
  invoiceDate: string;
  totals: {
    grandTotal: number;
  };
}

interface Expense {
  date: string;
  amount: number;
}

type SortDirection = 'asc' | 'desc';
type SortKey = 'date' | 'income' | 'expense' | 'profit';
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProfitReportPage() {
  const { selectedBranchId } = useBranch();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ---- Table controls: search, sorting, pagination ----
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [activeDropdown, setActiveDropdown] = useState<'entries' | null>(null);

  const toggleDropdown = (name: 'entries') => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // ---- Default date range (used both to initialize and to detect "nothing to reset") ----
  const defaultDateRange = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatDateInput(firstDayOfMonth), to: formatDateInput(today) };
  }, []);

  useEffect(() => {
    setFromDate(defaultDateRange.from);
    setToDate(defaultDateRange.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedBranchId) {
      setInvoices([]);
      setExpenses([]);
      return;
    }

    let mounted = true;

    async function loadData() {
      try {
        const [invoicesRes, expensesRes] = await Promise.all([
          apiFetch(`/invoices?branchId=${selectedBranchId}`),
          apiFetch(`/expenses?branchId=${selectedBranchId}`),
        ]);

        if (!mounted) return;

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(Array.isArray(data) ? data : []);
        } else {
          setInvoices([]);
        }

        if (expensesRes.ok) {
          const data = await expensesRes.json();
          setExpenses(Array.isArray(data) ? data : []);
        } else {
          setExpenses([]);
        }
      } catch (err) {
        if (mounted) {
          setInvoices([]);
          setExpenses([]);
        }
      } finally {
        // no-op; data updates above drive the UI
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [selectedBranchId]);

  const filteredInvoices = useMemo(() => {
    if (!fromDate && !toDate) return invoices;

    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate);
      invoiceDate.setHours(0, 0, 0, 0);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (invoiceDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(0, 0, 0, 0);
        if (invoiceDate > to) return false;
      }

      return true;
    });
  }, [fromDate, invoices, toDate]);

  const filteredExpenses = useMemo(() => {
    if (!fromDate && !toDate) return expenses;

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      expenseDate.setHours(0, 0, 0, 0);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (expenseDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(0, 0, 0, 0);
        if (expenseDate > to) return false;
      }

      return true;
    });
  }, [expenses, fromDate, toDate]);

  const groupedRows = useMemo(() => {
    const rows = new Map<
      string,
      { date: string; income: number; expense: number }
    >();

    filteredInvoices.forEach((invoice) => {
      const key = new Date(invoice.invoiceDate).toISOString().split('T')[0];
      const existing = rows.get(key) || { date: key, income: 0, expense: 0 };
      existing.income += invoice.totals?.grandTotal || 0;
      rows.set(key, existing);
    });

    filteredExpenses.forEach((expense) => {
      const key = new Date(expense.date).toISOString().split('T')[0];
      const existing = rows.get(key) || { date: key, income: 0, expense: 0 };
      existing.expense += expense.amount || 0;
      rows.set(key, existing);
    });

    return Array.from(rows.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [filteredExpenses, filteredInvoices]);

  const totalIncome = useMemo(
    () => filteredInvoices.reduce((sum, invoice) => sum + (invoice.totals?.grandTotal || 0), 0),
    [filteredInvoices],
  );

  const totalExpense = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    [filteredExpenses],
  );

  const netProfit = totalIncome - totalExpense;
  const totalIncomeBar = totalIncome > 0 ? 100 : 0;
  const totalExpenseBar = totalIncome > 0
    ? Math.min((totalExpense / totalIncome) * 100, 100)
    : 0;
  const netProfitBar = totalIncome > 0
    ? Math.max(0, Math.min((netProfit / totalIncome) * 100, 100))
    : 0;

  // Export handlers using active filtered data
  const handleExportPDF = () => {
    try {
      const items = sortedRows.map((r) => ({
        date: r.date,
        income: r.income,
        expense: r.expense,
        profit: r.income - r.expense,
      }));

      const totals = {
        totalIncome,
        totalExpense,
        netProfit,
      };

      const filterDetails = {
        fromDate,
        toDate,
        searchQuery,
      };

      exportProfitPDF(items, totals, filterDetails);
    } catch (err) {
      console.error('Export Profit PDF Error:', err);
    }
  };

  const handleExportExcel = () => {
    try {
      const items = sortedRows.map((r) => ({
        date: r.date,
        income: r.income,
        expense: r.expense,
        profit: r.income - r.expense,
      }));

      const totals = {
        totalIncome,
        totalExpense,
        netProfit,
      };

      const filterDetails = {
        fromDate,
        toDate,
        searchQuery,
      };

      exportProfitExcel(items, totals, filterDetails);
    } catch (err) {
      console.error('Export Profit Excel Error:', err);
    }
  };

  // ---- Search (by formatted date string) ----
  const searchedRows = useMemo(() => {
    if (!searchQuery) return groupedRows;
    const query = searchQuery.toLowerCase();
    return groupedRows.filter((row) => {
      const formatted = new Date(row.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toLowerCase();
      return formatted.includes(query);
    });
  }, [groupedRows, searchQuery]);

  // ---- Sorting ----
  const handleSort = (key: SortKey) => {
    setCurrentPage(1);
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: SortKey): string => {
    if (sortConfig?.key !== key) return 'unfold_more';
    return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more';
  };

  const sortValue = (row: { date: string; income: number; expense: number }, key: SortKey): number => {
    switch (key) {
      case 'date': return new Date(row.date).getTime();
      case 'income': return row.income;
      case 'expense': return row.expense;
      case 'profit': return row.income - row.expense;
      default: return 0;
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortConfig) return searchedRows;
    return [...searchedRows].sort((a, b) => {
      const aVal = sortValue(a, sortConfig.key);
      const bVal = sortValue(b, sortConfig.key);
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedRows, sortConfig]);

  // ---- Pagination ----
  const totalEntries = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, fromDate, toDate]);

  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);

  const paginatedRows = useMemo(() => {
    return sortedRows.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  }, [sortedRows, currentPage, entriesPerPage]);

  const handleEntriesPerPageChange = (n: number) => {
    setEntriesPerPage(n);
    setCurrentPage(1);
  };

  // ---- Whether there's anything for Reset to actually clear ----
  const hasActiveFilters = Boolean(
    fromDate !== defaultDateRange.from ||
    toDate !== defaultDateRange.to ||
    searchQuery ||
    sortConfig
  );

  const handleResetFilters = () => {
    setFromDate(defaultDateRange.from);
    setToDate(defaultDateRange.to);
    setSearchQuery('');
    setSortConfig(null);
    setCurrentPage(1);
  };

  const renderSortableHeader = (label: string, key: SortKey, align: 'left' | 'right' = 'left') => {
    const isActive = sortConfig?.key === key;
    const icon = !isActive ? 'unfold_more' : sortConfig!.direction === 'asc' ? 'expand_less' : 'expand_more';
    const ariaSort = isActive ? (sortConfig!.direction === 'asc' ? 'ascending' : 'descending') : 'none';

    return (
      <th
        className={`px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group select-none ${isActive ? 'text-primary' : ''} ${align === 'right' ? 'text-right' : 'text-left'}`}
        scope="col"
        role="columnheader"
        aria-sort={ariaSort as React.AriaAttributes['aria-sort']}
        onClick={() => handleSort(key)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
          {label}
          <span className={`material-symbols-outlined text-[12px] transition-opacity ${isActive ? 'opacity-100 text-primary' : 'opacity-50 group-hover:opacity-100'}`}>
            {icon}
          </span>
        </div>
      </th>
    );
  };

  return (
    <>
      
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 relative overflow-x-hidden selection:bg-primary/30 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
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
                <span className="material-symbols-outlined text-[14px]">analytics</span>
                Profit & Loss
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
                <span className="text-on-surface">Profit </span>
                <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                  Report
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Financial performance and net earnings analysis. Monitor your income and expenses over time.
              </p>
            </div>
          </header>

          {/* Summary Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
            {/* Total Income */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Income</p>
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <h3 className="text-3xl font-bold text-on-surface tracking-tight relative z-10">₹{formatCurrency(totalIncome)}</h3>
              <div className="mt-5 h-1 w-full bg-primary/10 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-primary opacity-60 rounded-full transition-all duration-1000 ease-out" style={{ width: `${totalIncomeBar}%` }}></div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-error/40 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Expense</p>
                <span className="material-symbols-outlined text-error p-2 rounded-lg bg-error/10" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
              </div>
              <h3 className="text-3xl font-bold text-on-surface tracking-tight relative z-10">₹{formatCurrency(totalExpense)}</h3>
              <div className="mt-5 h-1 w-full bg-error/10 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-error opacity-60 rounded-full transition-all duration-1000 ease-out" style={{ width: `${totalExpenseBar}%` }}></div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Net Profit</p>
                <span className="material-symbols-outlined text-emerald-500 p-2 rounded-lg bg-emerald-500/10" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              </div>
              <h3 className="text-3xl font-bold text-emerald-500 tracking-tight relative z-10">₹{formatCurrency(netProfit)}</h3>
              <div className="mt-5 h-1 w-full bg-emerald-500/10 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" style={{ width: `${netProfitBar}%` }}></div>
              </div>
            </div>
          </section>

          {/* Filters Section */}
          <section
            className="glass-panel rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 animate-fade-slide-up relative overflow-hidden shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap relative z-10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">
                  filter_list
                </span>
                <h2 className="text-xl font-bold text-on-surface">Filters</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExportPDF();
                  }}
                  className="p-2 glass-button-icon rounded-lg hover:bg-primary/10 hover:text-primary transition-colors tooltip cursor-pointer" 
                  title="Export PDF"
                >
                  <span className="material-symbols-outlined pointer-events-none">picture_as_pdf</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExportExcel();
                  }}
                  className="p-2 glass-button-icon rounded-lg hover:bg-primary/10 hover:text-primary transition-colors tooltip cursor-pointer" 
                  title="Export Excel"
                >
                  <span className="material-symbols-outlined pointer-events-none">table_view</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-end gap-6 relative z-10">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                  From Date
                </label>
                <input
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                  To Date
                </label>
                <input
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                className="h-[46px] px-6 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface hover:text-on-surface border border-outline-variant/20 hover:border-outline-variant/40 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant disabled:hover:border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[18px]">undo</span>
                Reset Filters
              </button>
            </div>
          </section>

          {/* Data Table Section */}
          <section className="glass-panel rounded-3xl overflow-hidden relative z-10 animate-fade-slide-up shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] flex flex-col" style={{ animationDelay: '0.3s' }}>
            {/* Glow Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            {/* Table Controls */}
            <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
              <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                <span>Show</span>
                <div className="relative">
                  <button
                    type="button"
                    className="bg-surface-container border border-outline-variant/30 rounded-xl py-2 pl-4 pr-10 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm cursor-pointer appearance-none hover:bg-surface-container-high transition-colors font-semibold flex items-center justify-between min-w-[70px]"
                    onClick={() => toggleDropdown('entries')}
                  >
                    <span>{entriesPerPage}</span>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] transition-transform duration-200 ${activeDropdown === 'entries' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'entries' && (
                    <div className="absolute top-full left-0 mt-1 z-[60] bg-surface rounded-xl border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 min-w-[70px]">
                      <div
                        onMouseDown={() => { handleEntriesPerPageChange(10); setActiveDropdown(null); }}
                        className={`px-4 py-2 text-sm cursor-pointer transition-colors ${entriesPerPage === 10 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        10
                      </div>
                      <div
                        onMouseDown={() => { handleEntriesPerPageChange(25); setActiveDropdown(null); }}
                        className={`px-4 py-2 text-sm cursor-pointer transition-colors ${entriesPerPage === 25 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        25
                      </div>
                      <div
                        onMouseDown={() => { handleEntriesPerPageChange(50); setActiveDropdown(null); }}
                        className={`px-4 py-2 text-sm cursor-pointer transition-colors ${entriesPerPage === 50 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        50
                      </div>
                    </div>
                  )}
                </div>
                <span>entries</span>
              </div>
              <div className="relative w-full sm:w-auto">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                  className="w-full sm:w-80 bg-surface-container border border-outline-variant/30 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Search dates..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table Body */}
            <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="w-full text-left border-separate border-spacing-0 whitespace-nowrap text-sm">
                <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low/50 border-b border-primary/10">
                  <tr>
                    {renderSortableHeader('Date', 'date')}
                    {renderSortableHeader('Income (₹)', 'income', 'right')}
                    {renderSortableHeader('Expense (₹)', 'expense', 'right')}
                    {renderSortableHeader('Profit (₹)', 'profit', 'right')}
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-24 text-center">
                        <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6">
                          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-60">analytics</span>
                        </div>
                        <h3 className="text-2xl text-on-surface font-bold mb-3">{searchQuery ? 'No matching dates found' : 'No data for the selected date range'}</h3>
                        <p className="text-on-surface-variant max-w-md mx-auto text-lg">{searchQuery ? 'Try adjusting your search filters.' : 'There are no financial records for this period.'}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr key={row.date} className="hover:bg-primary/5 transition-colors group cursor-pointer active:scale-[0.995]">
                        <td className="px-6 py-5 font-semibold text-primary">
                          {new Date(row.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-5 font-bold text-on-surface text-right">
                          ₹{formatCurrency(row.income)}
                        </td>
                        <td className="px-6 py-5 font-medium text-error text-right">
                          ₹{formatCurrency(row.expense)}
                        </td>
                        <td className="px-6 py-5 font-bold text-emerald-500 text-right">
                          ₹{formatCurrency(row.income - row.expense)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-container-lowest border-t border-primary/20">
                    <td className="px-6 py-5 text-sm font-black uppercase tracking-wider text-on-surface">TOTAL:</td>
                    <td className="px-6 py-5 text-lg font-black text-on-surface text-right">₹{formatCurrency(totalIncome)}</td>
                    <td className="px-6 py-5 text-lg font-black text-error text-right">₹{formatCurrency(totalExpense)}</td>
                    <td className="px-6 py-5 text-lg font-black text-emerald-500 text-right">₹{formatCurrency(netProfit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile-First Cards List */}
            <div className="block md:hidden divide-y divide-primary/5">
              {paginatedRows.length === 0 ? (
                <div className="px-6 py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-60">analytics</span>
                  </div>
                  <h3 className="text-xl text-on-surface font-bold mb-2">
                    {searchQuery ? 'No matching dates found' : 'No data for the selected range'}
                  </h3>
                  <p className="text-on-surface-variant max-w-xs mx-auto text-sm">
                    {searchQuery ? 'Try adjusting your search filters.' : 'There are no financial records.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-primary/5">
                    {paginatedRows.map((row) => {
                      const profitVal = row.income - row.expense;
                      return (
                        <div key={row.date} className="p-5 space-y-4 hover:bg-primary/5 transition-colors duration-200">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-primary">
                              {new Date(row.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${profitVal >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-error/10 text-error'}`}>
                              {profitVal >= 0 ? 'Profit' : 'Loss'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-left">
                              <span className="text-on-surface-variant/60 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Income</span>
                              <span className="text-on-surface font-bold text-sm whitespace-nowrap">₹{formatCurrency(row.income)}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-on-surface-variant/60 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Expense</span>
                              <span className="text-error font-bold text-sm whitespace-nowrap">₹{formatCurrency(row.expense)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-on-surface-variant/60 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Net</span>
                              <span className={`font-bold text-sm whitespace-nowrap ${profitVal >= 0 ? 'text-emerald-500' : 'text-error'}`}>
                                ₹{formatCurrency(profitVal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Totals Summary Block */}
                  <div className="p-6 bg-surface-container-lowest border-t border-primary/10 space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-on-surface mb-2">Total Summary</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Total Income</span>
                      <span className="font-bold text-on-surface">₹{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Total Expense</span>
                      <span className="font-bold text-error">₹{formatCurrency(totalExpense)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black border-t border-primary/10 pt-3">
                      <span className="text-on-surface">Net Profit</span>
                      <span className="text-emerald-500">₹{formatCurrency(netProfit)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                <span className="text-sm text-on-surface-variant">
                  {totalEntries === 0
                    ? 'Showing 0 entries'
                    : `Showing ${startIndex} to ${endIndex} of ${totalEntries} entries`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>

                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-primary text-on-primary shadow-[0_0_10px_rgba(125,211,252,0.3)]">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface hover:text-on-surface border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Decoration */}
          <footer className="relative z-10 w-full opacity-40 text-center flex items-center justify-center gap-4 mt-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
            <p className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              BillTea • Profit Report
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
          </footer>

        </div>
      </div>
    </>
  );
}