'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/auth';
import { useBranch } from '@/components/BranchProvider';
import { exportInvoicesPDF, exportInvoicesExcel } from '@/lib/exportUtils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  amountPaid: number;
  amountDue: number;
  customer: {
    id?: string;
    customerName: string;
    companyName: string;
  } | null;
  totals: {
    grandTotal: number;
  };
}

type SortDirection = 'asc' | 'desc';
type SortKey = 'invoiceNumber' | 'date' | 'customer' | 'total' | 'paid' | 'pending' | 'status';
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

// Formats an amount in Indian numbering style, switching to "Cr" once the
// value crosses 1 crore (1,00,00,000) so large totals never wrap/overflow
// inside the stat cards.
const formatINR = (amount: number, compact: boolean = false): string => {
  const value = amount || 0;
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 10000000) {
      const crores = value / 10000000;
      return `₹${crores.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
    }
    if (abs >= 100000) {
      const lakhs = value / 100000;
      return `₹${lakhs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
    }
    if (abs >= 1000) {
      const thousands = value / 1000;
      return `₹${thousands.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} K`;
    }
  }
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function ReportsPage() {
  const { selectedBranchId, isLoadingBranches } = useBranch();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [activeDropdown, setActiveDropdown] = useState<'customer' | 'status' | 'entries' | null>(null);

  const toggleDropdown = (name: 'customer' | 'status' | 'entries') => {
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

  useEffect(() => {
    if (selectedBranchId) {
      fetchInvoices();
    } else {
      setInvoices([]);
      setLoading(false);
    }
  }, [selectedBranchId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/invoices?branchId=${selectedBranchId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedCustomerId('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setSortConfig(null);
    setCurrentPage(1);
  };

  // ---- Whether there's anything for Clear Filters to actually clear ----
  const hasActiveFilters = Boolean(
    fromDate ||
    toDate ||
    selectedCustomerId !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    searchQuery ||
    sortConfig
  );

  // Derived state for Customers Dropdown
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, Invoice['customer']>();
    invoices.forEach(inv => {
      if (inv.customer && inv.customer.id) {
        map.set(inv.customer.id, inv.customer);
      }
    });
    return Array.from(map.values());
  }, [invoices]);

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Date filter
      if (fromDate) {
        const invDate = new Date(inv.invoiceDate);
        const from = new Date(fromDate);
        // Set time to start of day for comparison
        invDate.setHours(0, 0, 0, 0);
        from.setHours(0, 0, 0, 0);
        if (invDate < from) return false;
      }
      if (toDate) {
        const invDate = new Date(inv.invoiceDate);
        const to = new Date(toDate);
        // Set time to start of day for comparison
        invDate.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);
        if (invDate > to) return false;
      }
      // Customer filter
      if (selectedCustomerId !== 'ALL' && inv.customer?.id !== selectedCustomerId) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && inv.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchInvoice = inv.invoiceNumber?.toLowerCase().includes(query) || false;
        const matchCustomer = inv.customer?.customerName?.toLowerCase().includes(query) || false;

        if (!matchInvoice && !matchCustomer) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, fromDate, toDate, selectedCustomerId, selectedStatus, searchQuery]);

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

  const sortValue = (inv: Invoice, key: SortKey): string | number => {
    switch (key) {
      case 'invoiceNumber': return inv.invoiceNumber || '';
      case 'date': return new Date(inv.invoiceDate).getTime() || 0;
      case 'customer': return inv.customer?.customerName || '';
      case 'total': return inv.totals?.grandTotal || 0;
      case 'paid': return inv.amountPaid || 0;
      case 'pending': return inv.amountDue || 0;
      case 'status': return inv.status || '';
      default: return '';
    }
  };

  const sortedInvoices = useMemo(() => {
    if (!sortConfig) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      const aVal = sortValue(a, sortConfig.key);
      const bVal = sortValue(b, sortConfig.key);
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInvoices, sortConfig]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedInvoices = useMemo(() => {
    return sortedInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedInvoices, currentPage, itemsPerPage]);

  const startIndex = sortedInvoices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, sortedInvoices.length);

  const handleItemsPerPageChange = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  // Stats calculation
  const stats = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => {
      acc.totalAmount += inv.totals?.grandTotal || 0;
      acc.totalPaid += inv.amountPaid || 0;
      acc.totalPending += inv.amountDue || 0;
      return acc;
    }, { totalAmount: 0, totalPaid: 0, totalPending: 0 });
  }, [filteredInvoices]);

  // Export Handlers using active filtered data
  const handleExportPDF = () => {
    try {
      const items = sortedInvoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        date: inv.invoiceDate,
        customerName: inv.customer?.customerName || '',
        companyName: inv.customer?.companyName,
        totalAmount: inv.totals?.grandTotal || 0,
        paidAmount: inv.amountPaid || 0,
        pendingAmount: inv.amountDue || 0,
        status: inv.status === 'UNPAID' ? 'Pending' : (inv.status || 'Pending'),
      }));

      const customerObj = uniqueCustomers.find(c => c?.id === selectedCustomerId);
      const filterDetails = {
        fromDate,
        toDate,
        customerName: selectedCustomerId === 'ALL' ? 'All Customers' : (customerObj?.customerName || 'Selected Customer'),
        status: selectedStatus === 'ALL' ? 'All Status' : (selectedStatus === 'UNPAID' ? 'Pending' : selectedStatus),
        searchQuery,
      };

      exportInvoicesPDF(items, { ...stats, totalInvoices: items.length }, filterDetails);
    } catch (err) {
      console.error('Export PDF Error:', err);
    }
  };

  const handleExportExcel = () => {
    try {
      const items = sortedInvoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        date: inv.invoiceDate,
        customerName: inv.customer?.customerName || '',
        companyName: inv.customer?.companyName,
        totalAmount: inv.totals?.grandTotal || 0,
        paidAmount: inv.amountPaid || 0,
        pendingAmount: inv.amountDue || 0,
        status: inv.status === 'UNPAID' ? 'Pending' : (inv.status || 'Pending'),
      }));

      const customerObj = uniqueCustomers.find(c => c?.id === selectedCustomerId);
      const filterDetails = {
        fromDate,
        toDate,
        customerName: selectedCustomerId === 'ALL' ? 'All Customers' : (customerObj?.customerName || 'Selected Customer'),
        status: selectedStatus === 'ALL' ? 'All Status' : (selectedStatus === 'UNPAID' ? 'Pending' : selectedStatus),
        searchQuery,
      };

      exportInvoicesExcel(items, { ...stats, totalInvoices: items.length }, filterDetails);
    } catch (err) {
      console.error('Export Excel Error:', err);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 text-error shadow-[0_0_10px_rgba(255,107,107,0.1)] border-error/20 bg-error/10'; // using the exact tailwind classes they had for Pending if it's UNPAID/Pending
      case 'PARTIAL': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'PAID': return 'border-secondary/20 bg-secondary/10 text-secondary shadow-[0_0_10px_rgba(136,180,204,0.1)]'; // using exact ones from static
      case 'OVERDUE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-surface-container text-on-surface-variant border-outline-variant/30';
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'UNPAID') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const sortHeaderClass = (key: SortKey, align: 'left' | 'right' | 'center' = 'left') =>
    `px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group select-none ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
    } ${sortConfig?.key === key ? 'text-primary' : ''}`;

  const sortIconClass = (key: SortKey) =>
    `material-symbols-outlined text-[12px] transition-opacity ${sortConfig?.key === key ? 'opacity-100 text-primary' : 'opacity-50 group-hover:opacity-100'
    }`;

  return (
    <>
      
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 z-0 relative overflow-x-hidden selection:bg-primary/30 [&::-webkit-scrollbar]:hidden"
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
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
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
                <span className="material-symbols-outlined text-[14px]">analytics</span>
                Financial Reports
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
                <span className="text-on-surface">Invoice </span>
                <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                  Reports
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Financial overview and tracking for Indux Technology. Analyze invoices, payments, and track outstanding balances.
              </p>
            </div>
            <Link href="/profit" className="w-full md:w-auto">
              <button className="w-full md:w-auto group relative h-14 px-8 rounded-2xl bg-surface border border-primary/20 text-primary font-bold flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_15px_rgba(125,211,252,0.1)] hover:shadow-[0_0_25px_rgba(125,211,252,0.3)] transition-all hover:-translate-y-0.5 hover:border-primary/40 cursor-pointer">
                <div className="absolute inset-0 w-full h-full bg-primary/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">analytics</span>
                <span>Profit & Loss Report</span>
              </button>
            </Link>
          </header>


          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Invoices</p>
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">receipt</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{filteredInvoices.length}</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Amount</p>
                <span className="material-symbols-outlined text-blue-500 p-2 rounded-lg bg-blue-500/10">payments</span>
              </div>
              <p className="text-3xl font-bold text-blue-500 tracking-tight relative z-10 whitespace-nowrap" title={formatINR(stats.totalAmount)}>{formatINR(stats.totalAmount, true)}</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Paid</p>
                <span className="material-symbols-outlined text-emerald-500 p-2 rounded-lg bg-emerald-500/10">verified_user</span>
              </div>
              <p className="text-3xl font-bold text-emerald-500 tracking-tight relative z-10 whitespace-nowrap" title={formatINR(stats.totalPaid)}>{formatINR(stats.totalPaid, true)}</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-tertiary/40 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Pending</p>
                <span className="material-symbols-outlined text-tertiary p-2 rounded-lg bg-tertiary/10">pending_actions</span>
              </div>
              <p className="text-3xl font-bold text-tertiary tracking-tight relative z-10 whitespace-nowrap" title={formatINR(stats.totalPending)}>{formatINR(stats.totalPending, true)}</p>
            </div>
          </div>

          {/* Filters Section */}
          <section className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-visible animate-fade-slide-up shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] z-20" style={{ animationDelay: '0.2s' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap relative z-10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">filter_list</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">From Date</label>
                <input
                  className="w-full h-12 px-4 rounded-xl glass-input text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">To Date</label>
                <input
                  className="w-full h-12 px-4 rounded-xl glass-input text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="dropdown-container space-y-2 relative" style={{ zIndex: activeDropdown === 'customer' ? 50 : 10 }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Customer</label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium flex items-center justify-between"
                    onClick={() => toggleDropdown('customer')}
                  >
                    <span className="truncate pr-4">
                      {selectedCustomerId === 'ALL'
                        ? 'All Customers'
                        : uniqueCustomers.find(c => c?.id === selectedCustomerId)?.customerName || 'All Customers'}
                    </span>
                    <span className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform duration-200 ${activeDropdown === 'customer' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'customer' && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-surface rounded-xl border border-primary/10 overflow-y-auto max-h-60 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                      <div
                        onMouseDown={() => { setSelectedCustomerId('ALL'); setCurrentPage(1); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedCustomerId === 'ALL' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        All Customers
                      </div>
                      {uniqueCustomers.map(customer => (
                        <div
                          key={customer?.id}
                          onMouseDown={() => { if (customer?.id) { setSelectedCustomerId(customer.id); setCurrentPage(1); } setActiveDropdown(null); }}
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedCustomerId === customer?.id ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          {customer?.customerName} {customer?.companyName ? `(${customer.companyName})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="dropdown-container space-y-2 relative" style={{ zIndex: activeDropdown === 'status' ? 50 : 10 }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Payment Status</label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium flex items-center justify-between"
                    onClick={() => toggleDropdown('status')}
                  >
                    <span>
                      {selectedStatus === 'ALL' ? 'All Status' : getStatusText(selectedStatus)}
                    </span>
                    <span className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform duration-200 ${activeDropdown === 'status' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'status' && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-surface rounded-xl border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                      <div
                        onMouseDown={() => { setSelectedStatus('ALL'); setCurrentPage(1); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedStatus === 'ALL' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        All Status
                      </div>
                      <div
                        onMouseDown={() => { setSelectedStatus('PAID'); setCurrentPage(1); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedStatus === 'PAID' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        Paid
                      </div>
                      <div
                        onMouseDown={() => { setSelectedStatus('UNPAID'); setCurrentPage(1); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedStatus === 'UNPAID' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        Pending
                      </div>
                      <div
                        onMouseDown={() => { setSelectedStatus('PARTIAL'); setCurrentPage(1); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedStatus === 'PARTIAL' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        Partial
                      </div>
                      <div
                        onMouseDown={() => { setSelectedStatus('OVERDUE'); setCurrentPage(1); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedStatus === 'OVERDUE' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        Overdue
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 relative z-10">
              <button
                disabled={!hasActiveFilters}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface hover:text-on-surface border border-outline-variant/20 hover:border-outline-variant/40 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant disabled:hover:border-outline-variant/20"
                onClick={handleClearFilters}
              >
                <span className="material-symbols-outlined text-[18px]">undo</span>
                Reset Filters
              </button>
            </div>
          </section>

          {/* Glassmorphic Data Table Container */}
          <div className="glass-panel rounded-3xl overflow-hidden relative z-10 animate-fade-slide-up shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]" style={{ animationDelay: '0.4s' }}>
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
                    <span>{itemsPerPage}</span>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] transition-transform duration-200 ${activeDropdown === 'entries' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'entries' && (
                    <div className="absolute top-full left-0 mt-1 z-[60] bg-surface rounded-xl border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 min-w-[70px]">
                      <div
                        onMouseDown={() => { handleItemsPerPageChange(10); setActiveDropdown(null); }}
                        className={`px-4 py-2 text-sm cursor-pointer transition-colors ${itemsPerPage === 10 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        10
                      </div>
                      <div
                        onMouseDown={() => { handleItemsPerPageChange(25); setActiveDropdown(null); }}
                        className={`px-4 py-2 text-sm cursor-pointer transition-colors ${itemsPerPage === 25 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        25
                      </div>
                      <div
                        onMouseDown={() => { handleItemsPerPageChange(50); setActiveDropdown(null); }}
                        className={`px-4 py-2 text-sm cursor-pointer transition-colors ${itemsPerPage === 50 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
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
                  placeholder="Search invoices..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* The Table */}
            <div className="hidden md:block overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
                <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low/50 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">#</th>
                    <th className={sortHeaderClass('invoiceNumber')} onClick={() => handleSort('invoiceNumber')} role="columnheader" aria-sort={sortConfig?.key === 'invoiceNumber' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <div className="flex items-center gap-1">
                        Invoice Number <span className={sortIconClass('invoiceNumber')}>{getSortIcon('invoiceNumber')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('date')} onClick={() => handleSort('date')} role="columnheader" aria-sort={sortConfig?.key === 'date' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <div className="flex items-center gap-1">
                        Date <span className={sortIconClass('date')}>{getSortIcon('date')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('customer')} onClick={() => handleSort('customer')} role="columnheader" aria-sort={sortConfig?.key === 'customer' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <div className="flex items-center gap-1">
                        Customer <span className={sortIconClass('customer')}>{getSortIcon('customer')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('total', 'right')} onClick={() => handleSort('total')} role="columnheader" aria-sort={sortConfig?.key === 'total' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <div className="flex items-center justify-end gap-1">
                        Total Amount <span className={sortIconClass('total')}>{getSortIcon('total')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('paid', 'right')} onClick={() => handleSort('paid')} role="columnheader" aria-sort={sortConfig?.key === 'paid' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <div className="flex items-center justify-end gap-1">
                        Paid Amount <span className={sortIconClass('paid')}>{getSortIcon('paid')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('pending', 'right')} onClick={() => handleSort('pending')} role="columnheader" aria-sort={sortConfig?.key === 'pending' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <div className="flex items-center justify-end gap-1">
                        Pending Amount <span className={sortIconClass('pending')}>{getSortIcon('pending')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('status', 'center')} onClick={() => handleSort('status')} role="columnheader" aria-sort={sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <div className="flex items-center justify-center gap-1">
                        Status <span className={sortIconClass('status')}>{getSortIcon('status')}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {isLoadingBranches || loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant">
                        <div className="flex justify-center items-center gap-2">
                          <span className="material-symbols-outlined animate-spin">refresh</span> Loading invoices...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-24 text-center">
                        <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6">
                          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-60">search_off</span>
                        </div>
                        <h3 className="text-2xl text-on-surface font-bold mb-3">No invoices found</h3>
                        <p className="text-on-surface-variant max-w-md mx-auto text-lg">Try adjusting your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((invoice, idx) => (
                      <tr key={invoice.id} className="hover:bg-primary/5 transition-colors duration-200">
                        <td className="px-6 py-4 text-on-surface-variant font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-primary">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 text-on-surface-variant mb-1">
                          {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {invoice.customer?.customerName?.substring(0, 2).toUpperCase() || 'NA'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-on-surface font-semibold">{invoice.customer?.customerName || 'Unknown'}</span>
                            <span className="text-[11px] text-on-surface-variant/70">{invoice.customer?.companyName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-on-surface text-right">
                          {formatINR(invoice.totals?.grandTotal || 0)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-on-surface text-right">
                          {formatINR(invoice.amountPaid || 0)}
                        </td>
                        <td className="px-6 py-4 font-bold text-tertiary text-right">
                          {formatINR(invoice.amountDue || 0)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(invoice.status)}`}>
                            {getStatusText(invoice.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile-Only Invoice Cards List */}
            <div className="block md:hidden divide-y divide-primary/5">
              {isLoadingBranches || loading ? (
                <div className="px-6 py-8 text-center text-on-surface-variant font-medium">
                  <div className="flex justify-center items-center gap-2">
                    <span className="material-symbols-outlined animate-spin">refresh</span> Loading invoices...
                  </div>
                </div>
              ) : paginatedInvoices.length === 0 ? (
                <div className="px-6 py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-60">search_off</span>
                  </div>
                  <h3 className="text-xl text-on-surface font-bold mb-2">No invoices found</h3>
                  <p className="text-on-surface-variant max-w-xs mx-auto text-sm">Try adjusting your filters.</p>
                </div>
              ) : (
                paginatedInvoices.map((invoice, idx) => (
                  <div key={invoice.id} className="p-5 space-y-4 hover:bg-primary/5 transition-colors duration-200">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant font-bold">#{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                        <span className="text-sm font-semibold text-primary">{invoice.invoiceNumber}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 border-t border-primary/5 pt-3">
                      <div className="w-8 h-8 rounded-full bg-surface border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {invoice.customer?.customerName?.substring(0, 2).toUpperCase() || 'NA'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-on-surface">{invoice.customer?.customerName || 'Unknown'}</div>
                        <div className="text-xs text-on-surface-variant/70">{invoice.customer?.companyName}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs border-t border-primary/5 pt-3">
                      <div>
                        <span className="text-on-surface-variant/60 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Total</span>
                        <span className="text-on-surface font-bold">{formatINR(invoice.totals?.grandTotal || 0)}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant/60 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Paid</span>
                        <span className="text-on-surface font-semibold">{formatINR(invoice.amountPaid || 0)}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant/60 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Pending</span>
                        <span className="text-tertiary font-bold">{formatINR(invoice.amountDue || 0)}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-on-surface-variant/70 text-right">
                      Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                <span className="text-sm text-on-surface-variant">
                  {sortedInvoices.length === 0
                    ? 'Showing 0 entries'
                    : `Showing ${startIndex} to ${endIndex} of ${sortedInvoices.length} entries`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>

                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-primary text-on-primary shadow-[0_0_10px_rgba(125,211,252,0.3)]">
                    {currentPage}
                  </span>

                  <button
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface hover:text-on-surface border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Decoration */}
          <footer className="relative z-10 w-full opacity-40 text-center flex items-center justify-center gap-4 mt-8">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
            <p className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              BillTea • Reports
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
          </footer>

        </div>
      </div>
    </>
  );
}