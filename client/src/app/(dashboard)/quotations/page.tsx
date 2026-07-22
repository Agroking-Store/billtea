'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/auth';
import PdfViewerModal from '@/components/PdfViewerModal';
import { useBranch } from '@/components/BranchProvider';

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  quotationDate: string;
  expiryDate: string;
  customer: {
    customerName: string;
    companyName: string;
  };
  notes?: string;
  followUpDate?: string;
  totals: {
    grandTotal: number;
  };
}

type SortDirection = 'asc' | 'desc';
type SortKey = 'quotationNumber' | 'customer' | 'quotationDate' | 'grandTotal' | '';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function QuotationsPage() {
  const { selectedBranchId, isLoadingBranches } = useBranch();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notesModalData, setNotesModalData] = useState<{ id: string, notes: string, followUpDate: string } | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [viewerPdfUrl, setViewerPdfUrl] = useState<{ url: string, title: string, id: string } | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [isSendingId, setIsSendingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Filters state (Customer / Date range) ----
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ---- Sorting state (asc <-> desc toggle, same as Invoices/Customers/Products) ----
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // ---- Pagination state ----
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [activeDropdown, setActiveDropdown] = useState<'customer' | 'status' | 'entries' | null>(null);

  const toggleDropdown = (name: 'customer' | 'status' | 'entries') => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchQuotations();
    } else {
      setQuotations([]);
      setLoading(false);
    }
  }, [selectedBranchId]);

  const stats = React.useMemo(() => {
    const total = quotations.length;
    const draft = quotations.filter((q) => q.status === 'DRAFT').length;
    const sent = quotations.filter((q) => q.status === 'SENT').length;
    const accepted = quotations.filter((q) => q.status === 'ACCEPTED').length;
    const totalValue = quotations.reduce((sum, q) => sum + (q.totals?.grandTotal || 0), 0);
    return { total, draft, sent, accepted, totalValue };
  }, [quotations]);

  const fetchQuotations = async () => {
    if (!selectedBranchId) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(`/quotations?branchId=${selectedBranchId}`);
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      } else {
        throw new Error('Failed to fetch quotations');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quotationToDelete) return;
    try {
      setIsDeleting(true);
      const res = await apiFetch(`/quotations/${quotationToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchQuotations();
        setQuotationToDelete(null);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to delete quotation');
      }
    } catch (err: any) {
      alert('Failed to delete quotation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!notesModalData) return;
    try {
      setIsSavingNotes(true);
      const res = await apiFetch(`/quotations/${notesModalData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesModalData.notes,
          followUpDate: notesModalData.followUpDate ? new Date(notesModalData.followUpDate).toISOString() : null,
        }),
      });
      if (res.ok) {
        setNotesModalData(null);
        fetchQuotations();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to save notes');
      }
    } catch (err: any) {
      alert('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      setIsSendingId(id);
      const res = await apiFetch(`/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      });
      if (res.ok) {
        fetchQuotations();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to send quotation');
      }
    } catch (err: any) {
      alert('Failed to send quotation');
    } finally {
      setIsSendingId(null);
    }
  };

  const handleDownloadPdf = async (id: string, quotationNumber: string) => {
    try {
      const res = await apiFetch(`/quotations/${id}/pdf?t=${Date.now()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quotation-${quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleViewPdf = async (id: string, quotationNumber: string) => {
    try {
      setIsLoadingPdf(true);
      const res = await apiFetch(`/quotations/${id}/pdf?t=${Date.now()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error('Failed to load PDF preview');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setViewerPdfUrl({ url, title: `Quotation-${quotationNumber}.pdf`, id });
    } catch (err) {
      alert('Failed to load PDF preview. Please try again.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const closePdfViewer = () => {
    if (viewerPdfUrl?.url) {
      window.URL.revokeObjectURL(viewerPdfUrl.url);
    }
    setViewerPdfUrl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'SENT': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ACCEPTED': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'EXPIRED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-surface-container text-on-surface-variant border-outline-variant/30';
    }
  };

  // ---- Unique customer list for the filter dropdown ----
  const uniqueCustomers = useMemo(() => {
    const names = new Set<string>();
    quotations.forEach((q) => {
      if (q.customer?.customerName) names.add(q.customer.customerName);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [quotations]);

  // ---- Search / filter (text search + customer + date range) ----
  const filteredQuotations = quotations.filter((q) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const customerName = q.customer?.customerName?.toLowerCase() || '';
      const companyName = q.customer?.companyName?.toLowerCase() || '';
      const quotationNumber = q.quotationNumber?.toLowerCase() || '';
      const amount = q.totals?.grandTotal?.toString() || '';

      const matchesSearch =
        customerName.includes(query) ||
        companyName.includes(query) ||
        quotationNumber.includes(query) ||
        amount.includes(query);

      if (!matchesSearch) return false;
    }

    if (customerFilter && q.customer?.customerName !== customerFilter) {
      return false;
    }

    if (statusFilter && q.status !== statusFilter) {
      return false;
    }

    if (fromDate || toDate) {
      const qDate = new Date(q.quotationDate);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (qDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (qDate > to) return false;
      }
    }

    return true;
  });
  const hasActiveFilters = Boolean(
    searchQuery || customerFilter || statusFilter || fromDate || toDate
  );
  const handleClearFilters = () => {
    setCustomerFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };



  // The "most recent" quotation is the one you're allowed to delete.
  // Derived from actual quotationDate (not row position/index), so it stays
  // correct no matter how the table is sorted or paginated.
  const mostRecentQuotationId = useMemo(() => {
    if (quotations.length === 0) return null;
    return quotations.reduce((latest, q) =>
      new Date(q.quotationDate) > new Date(latest.quotationDate) ? q : latest
    ).id;
  }, [quotations]);

  // ---- Sort click handler: asc <-> desc toggle (consistent with other pages) ----
  const requestSort = useCallback((key: SortKey) => {
    if (!key) return;
    setCurrentPage(1);
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // ---- Apply sort ----
  const sortedQuotations = useMemo(() => {
    if (!sortConfig) return filteredQuotations;

    const getValue = (q: Quotation): any => {
      switch (sortConfig.key) {
        case 'quotationNumber': return q.quotationNumber || '';
        case 'customer': return q.customer?.customerName || '';
        case 'quotationDate': return q.quotationDate ? new Date(q.quotationDate).getTime() : 0;
        case 'grandTotal': return q.totals?.grandTotal ?? 0;
        default: return '';
      }
    };

    return [...filteredQuotations].sort((a, b) => {
      let aVal = getValue(a);
      let bVal = getValue(b);
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      else if (aVal > bVal) comparison = 1;

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredQuotations, sortConfig]);

  // ---- Apply pagination ----
  const totalItems = sortedQuotations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // Reset to page 1 whenever the search query or filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, customerFilter, fromDate, toDate]);

  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedQuotations.slice(start, start + pageSize);
  }, [sortedQuotations, currentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // ---- Small helper to render a sortable header cell (icons aligned with Invoices/Customers/Products) ----
  const renderSortableHeader = (label: string, key: SortKey, align: 'left' | 'right' = 'left') => {
    const isActive = sortConfig?.key === key;
    const icon = !isActive ? 'unfold_more' : sortConfig!.direction === 'asc' ? 'expand_less' : 'expand_more';
    const ariaSort = isActive ? (sortConfig!.direction === 'asc' ? 'ascending' : 'descending') : 'none';

    return (
      <th
        className={`px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group select-none ${isActive ? 'text-primary' : ''}`}
        scope="col"
        role="columnheader"
        aria-sort={ariaSort as React.AriaAttributes['aria-sort']}
        onClick={() => requestSort(key)}
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
      {activeDropdown && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setActiveDropdown(null)}
        />
      )}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 z-0 relative overflow-x-hidden selection:bg-primary/30 [&::-webkit-scrollbar]:hidden w-full max-w-full min-w-0"
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
        <div className="fixed inset-0 z-0 bg-surface pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-tertiary/10 blur-[120px]"></div>
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-12 pb-16 w-full max-w-full min-w-0">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(125,211,252,0.15)]">
                <span className="material-symbols-outlined text-[14px]">request_quote</span>
                Quotations Management
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
                <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                  Quotations
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Manage and track your customer quotes. Create new quotations, monitor their status, and convert them into invoices.
              </p>
            </div>
            <Link href="/quotations/new">
              <button
                disabled={!selectedBranchId}
                className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                <span className="material-symbols-outlined">add</span>
                <span>Create Quotation</span>
              </button>
            </Link>
          </header>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 relative z-10">
              <span className="material-symbols-outlined text-error mt-0.5">error</span>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Quotations</p>
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">request_quote</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.total}</p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">for this branch</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-tertiary/40 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Draft</p>
                <span className="material-symbols-outlined text-tertiary p-2 rounded-lg bg-tertiary/10">edit_note</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.draft}</p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">not yet sent</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Accepted</p>
                <span className="material-symbols-outlined text-emerald-500 p-2 rounded-lg bg-emerald-500/10">task_alt</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.accepted}</p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">
                {stats.total > 0 ? `${Math.round((stats.accepted / stats.total) * 100)}% win rate` : 'no data yet'}
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Value</p>
                <span className="material-symbols-outlined text-secondary p-2 rounded-lg bg-secondary/10">payments</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">
                ₹ {stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">across all quotations</p>
            </div>
          </div>

          {/* Filters Section */}
          <section
            className="glass-panel rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 animate-fade-slide-up relative overflow-visible shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">
                  filter_list
                </span>
                <h2 className="text-xl font-bold text-on-surface">Filters</h2>
              </div>
              {hasActiveFilters && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Active
                </span>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-end gap-6 relative z-10">
              <div className="flex-1 min-w-[220px] relative" style={{ zIndex: activeDropdown === 'customer' ? 50 : 10 }}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                  Customer
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl pl-4 pr-10 py-3 text-sm font-medium text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-left flex items-center justify-between min-h-[46px]"
                    onClick={() => toggleDropdown('customer')}
                  >
                    <span>{customerFilter || 'All Customers'}</span>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] transition-transform duration-200 ${activeDropdown === 'customer' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'customer' && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-[60] bg-surface-container-highest rounded-xl border border-primary/10 overflow-y-auto max-h-60 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                      <div
                        onClick={() => { setCustomerFilter(''); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${customerFilter === '' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        All Customers
                      </div>
                      {uniqueCustomers.map((name) => (
                        <div
                          key={name}
                          onClick={() => { setCustomerFilter(name); setActiveDropdown(null); }}
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${customerFilter === name ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-[200px] relative" style={{ zIndex: activeDropdown === 'status' ? 50 : 10 }}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                  Status
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl pl-4 pr-10 py-3 text-sm font-medium text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-left flex items-center justify-between min-h-[46px] cursor-pointer"
                    onClick={() => toggleDropdown('status')}
                  >
                    <span>
                      {statusFilter === '' && 'All Status'}
                      {statusFilter === 'DRAFT' && 'Draft'}
                      {statusFilter === 'SENT' && 'Sent'}
                      {statusFilter === 'ACCEPTED' && 'Accepted'}
                      {statusFilter === 'EXPIRED' && 'Expired'}
                    </span>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] transition-transform duration-200 ${activeDropdown === 'status' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'status' && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-[60] bg-surface-container-highest rounded-xl border border-primary/10 overflow-y-auto max-h-60 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                      <div 
                        onClick={() => { setStatusFilter(''); setActiveDropdown(null); }} 
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${statusFilter === '' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        All Status
                      </div>
                      {['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED'].map((status) => (
                        <div 
                          key={status}
                          onClick={() => { setStatusFilter(status); setActiveDropdown(null); }} 
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${statusFilter === status ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          {status === 'DRAFT' && 'Draft'}
                          {status === 'SENT' && 'Sent'}
                          {status === 'ACCEPTED' && 'Accepted'}
                          {status === 'EXPIRED' && 'Expired'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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

              <div className="mt-8 flex flex-wrap gap-4 relative z-10">
                <button
                  disabled={!hasActiveFilters}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border border-outline-variant/20 hover:border-outline-variant/40 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant disabled:hover:border-outline-variant/20"
                  onClick={handleClearFilters}
                >
                  <span className="material-symbols-outlined text-[18px]">undo</span>
                  Reset Filters
                </button>
              </div>
            </div>
          </section>

          {/* Glassmorphic Data Table Container */}
          <div className="glass-panel rounded-3xl overflow-hidden relative z-10 animate-fade-slide-up shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] w-full max-w-full min-w-0" style={{ animationDelay: '0.3s' }}>
            {/* Glow Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            {/* Table Controls */}
            <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
              <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant relative" style={{ zIndex: activeDropdown === 'entries' ? 50 : 10 }}>
                <span>Show</span>
                <div className="relative">
                  <button
                    type="button"
                    className="glass-input text-sm pl-3 pr-9 py-1.5 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/50 cursor-pointer bg-surface-container-highest flex items-center justify-between min-w-[70px]"
                    onClick={() => toggleDropdown('entries')}
                  >
                    <span>{pageSize}</span>
                    <span className={`material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] transition-transform duration-200 ${activeDropdown === 'entries' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'entries' && (
                    <div className="absolute top-full left-0 mt-1 z-[60] bg-surface-container-highest rounded-lg border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 min-w-[70px]">
                      <div
                        onClick={() => { handlePageSizeChange(10); setActiveDropdown(null); }}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${pageSize === 10 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        10
                      </div>
                      <div
                        onClick={() => { handlePageSizeChange(25); setActiveDropdown(null); }}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${pageSize === 25 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                      >
                        25
                      </div>
                      <div
                        onClick={() => { handlePageSizeChange(50); setActiveDropdown(null); }}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${pageSize === 50 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
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
                  placeholder="Search quotations..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* The Table */}
            <div className="hidden lg:block overflow-x-auto w-full max-w-full">
              <table className="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
                <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low/50 border-b border-primary/10">
                  <tr>
                    {renderSortableHeader('Quotation Number', 'quotationNumber')}
                    {renderSortableHeader('Customer', 'customer')}
                    {renderSortableHeader('Date & Status', 'quotationDate')}
                    {renderSortableHeader('Total Amount', 'grandTotal')}
                    <th className="px-6 py-4 font-semibold tracking-wider text-right pr-8" scope="col">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {isLoadingBranches || loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                        <div className="flex justify-center items-center gap-2">
                          <span className="material-symbols-outlined animate-spin">refresh</span> Loading quotations...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-24 text-center">
                        <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6">
                          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-60">request_quote</span>
                        </div>
                        <h3 className="text-2xl text-on-surface font-bold mb-3">{searchQuery || hasActiveFilters ? 'No matching quotations found' : 'No quotations yet'}</h3>
                        <p className="text-on-surface-variant max-w-md mx-auto text-lg">{searchQuery || hasActiveFilters ? 'Try adjusting your search or filters.' : 'Create your first quotation for this branch.'}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedQuotations.map((quotation) => {
                      const isMostRecent = quotation.id === mostRecentQuotationId;
                      return (
                        <tr key={quotation.id} className="hover:bg-primary/5 transition-colors duration-200">
                          <td className="px-6 py-4 font-semibold text-primary">{quotation.quotationNumber}</td>
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {quotation.customer?.customerName?.substring(0, 2).toUpperCase() || 'NA'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-on-surface font-semibold">{quotation.customer?.customerName || 'Unknown'}</span>
                              <span className="text-[11px] text-on-surface-variant/70">{quotation.customer?.companyName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-on-surface-variant mb-1">
                              {new Date(quotation.quotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(quotation.status)}`}>
                              {quotation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-on-surface">
                            ₹ {quotation.totals?.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="px-6 py-4">
                            {openActionId === quotation.id ? (
                              <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <button onClick={() => handleViewPdf(quotation.id, quotation.quotationNumber)} disabled={isLoadingPdf} className="glass-button-icon p-1 rounded-md transition-all hover:text-blue-400 hover:bg-blue-400/10 tooltip cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="View">
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                </button>
                                <Link href={`/quotations/${quotation.id}/edit`}>
                                  <button className="glass-button-icon p-1 rounded-md transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/10 tooltip cursor-pointer" title="Edit">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                </Link>
                                <Link href={`/quotations/new?copyFrom=${quotation.id}`}>
                                  <button className="glass-button-icon p-1 rounded-md transition-all hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/10 tooltip cursor-pointer" title="Copy">
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                  </button>
                                </Link>
                                <Link href={`/invoices/new?copyFromQuotation=${quotation.id}`}>
                                  <button className="glass-button-icon p-1 rounded-md transition-all hover:text-purple-400 hover:border-purple-400/30 hover:bg-purple-400/10 tooltip cursor-pointer" title="Convert to Invoice">
                                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                  </button>
                                </Link>
                                <button onClick={() => handleSend(quotation.id)} disabled={isSendingId === quotation.id} className="glass-button-icon p-1 rounded-md transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 tooltip cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Send">
                                  {isSendingId === quotation.id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">send</span>}
                                </button>
                                <button
                                  onClick={() => handleDownloadPdf(quotation.id, quotation.quotationNumber)}
                                  className="glass-button-icon p-1 rounded-md transition-all hover:text-indigo-400 hover:border-indigo-400/30 hover:bg-indigo-400/10 tooltip cursor-pointer" title="Download PDF">
                                  <span className="material-symbols-outlined text-[16px]">download</span>
                                </button>
                                <button
                                  onClick={() => setNotesModalData({
                                    id: quotation.id,
                                    notes: quotation.notes || '',
                                    followUpDate: quotation.followUpDate ? new Date(quotation.followUpDate).toISOString().split('T')[0] : ''
                                  })}
                                  className="glass-button-icon p-1 rounded-md transition-all hover:text-amber-400 hover:border-amber-400/30 hover:bg-amber-400/10 tooltip cursor-pointer" title="Notes & Reminder">
                                  <span className="material-symbols-outlined text-[16px]">sticky_note_2</span>
                                </button>
                                <button
                                  onClick={() => isMostRecent && setQuotationToDelete(quotation.id)}
                                  disabled={!isMostRecent}
                                  className={`glass-button-icon p-1 rounded-md transition-all tooltip ${isMostRecent
                                      ? 'hover:text-error hover:border-error/30 hover:bg-error/10 cursor-pointer'
                                      : 'opacity-30 cursor-not-allowed'
                                    }`}
                                  title={isMostRecent ? 'Delete' : 'Only the most recent quotation can be deleted'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                                <div className="w-px h-4 bg-primary/20 mx-1"></div>
                                <button
                                  onClick={() => setOpenActionId(null)}
                                  className="glass-button-icon p-1 rounded-md transition-all hover:text-on-surface-variant hover:bg-surface-container-highest tooltip cursor-pointer" title="Close">
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2 animate-in fade-in duration-300">
                                <button onClick={() => handleViewPdf(quotation.id, quotation.quotationNumber)} disabled={isLoadingPdf} className="glass-button-icon p-1 rounded-md transition-all hover:text-blue-400 hover:bg-blue-400/10 tooltip cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="View">
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                </button>
                                <Link href={`/invoices/new?copyFromQuotation=${quotation.id}`}>
                                  <button className="glass-button-icon p-1 rounded-md transition-all hover:text-purple-400 hover:border-purple-400/30 hover:bg-purple-400/10 tooltip cursor-pointer" title="Convert to Invoice">
                                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                  </button>
                                </Link>
                                <button onClick={() => handleSend(quotation.id)} disabled={isSendingId === quotation.id} className="glass-button-icon p-1 rounded-md transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 tooltip cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Send">
                                  {isSendingId === quotation.id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">send</span>}
                                </button>
                                <div className="w-px h-4 bg-primary/20 mx-1"></div>
                                <button
                                  onClick={() => setOpenActionId(quotation.id)}
                                  className="glass-button-icon p-1 rounded-md transition-all hover:text-primary hover:bg-primary/10 tooltip cursor-pointer" title="More Actions">
                                  <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile-First Cards List */}
            <div className="block lg:hidden divide-y divide-primary/5">
              {isLoadingBranches || loading ? (
                <div className="px-6 py-8 text-center text-on-surface-variant">
                  <div className="flex justify-center items-center gap-2">
                    <span className="material-symbols-outlined animate-spin">refresh</span> Loading quotations...
                  </div>
                </div>
              ) : paginatedQuotations.length === 0 ? (
                <div className="px-6 py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-60">request_quote</span>
                  </div>
                  <h3 className="text-xl text-on-surface font-bold mb-2">{searchQuery || hasActiveFilters ? 'No matching quotations found' : 'No quotations yet'}</h3>
                  <p className="text-on-surface-variant max-w-xs mx-auto text-sm">{searchQuery || hasActiveFilters ? 'Try adjusting your search or filters.' : 'Create your first quotation for this branch.'}</p>
                </div>
              ) : (
                paginatedQuotations.map((quotation) => {
                  const isMostRecent = quotation.id === mostRecentQuotationId;
                  return (
                    <div key={quotation.id} className="p-5 space-y-4 hover:bg-primary/5 transition-colors duration-200">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-primary">{quotation.quotationNumber}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(quotation.status)}`}>
                          {quotation.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          {quotation.customer?.customerName?.substring(0, 2).toUpperCase() || 'NA'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-on-surface">{quotation.customer?.customerName || 'Unknown'}</span>
                          <span className="text-[11px] text-on-surface-variant/70">{quotation.customer?.companyName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-on-surface-variant/60 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Date</span>
                          <span className="text-on-surface font-medium">
                            {new Date(quotation.quotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant/60 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Amount</span>
                          <span className="text-on-surface font-bold">
                            ₹ {quotation.totals?.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </span>
                        </div>
                      </div>

                      {/* Actions Toggle Panel */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-primary/5">
                        {openActionId === quotation.id ? (
                          <div className="flex flex-wrap items-center justify-end gap-2 w-full animate-in fade-in duration-300">
                            <button onClick={() => handleViewPdf(quotation.id, quotation.quotationNumber)} disabled={isLoadingPdf} className="glass-button-icon p-2 rounded-md hover:text-blue-400 hover:bg-blue-400/10 cursor-pointer disabled:opacity-50" title="View">
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                            <Link href={`/quotations/${quotation.id}/edit`}>
                              <button className="glass-button-icon p-2 rounded-md hover:text-primary hover:bg-primary/10 cursor-pointer" title="Edit">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                            </Link>
                            <Link href={`/quotations/new?copyFrom=${quotation.id}`}>
                              <button className="glass-button-icon p-2 rounded-md hover:text-blue-400 hover:bg-blue-400/10 cursor-pointer" title="Copy">
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                              </button>
                            </Link>
                            <Link href={`/invoices/new?copyFromQuotation=${quotation.id}`}>
                              <button className="glass-button-icon p-2 rounded-md hover:text-purple-400 hover:bg-purple-400/10 cursor-pointer" title="Convert to Invoice">
                                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                              </button>
                            </Link>
                            <button onClick={() => handleSend(quotation.id)} disabled={isSendingId === quotation.id} className="glass-button-icon p-2 rounded-md hover:text-emerald-400 hover:bg-emerald-400/10 cursor-pointer disabled:opacity-50" title="Send">
                              {isSendingId === quotation.id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">send</span>}
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(quotation.id, quotation.quotationNumber)}
                              className="glass-button-icon p-2 rounded-md hover:text-indigo-400 hover:bg-indigo-400/10 cursor-pointer" title="Download PDF">
                              <span className="material-symbols-outlined text-[16px]">download</span>
                            </button>
                            <button
                              onClick={() => setNotesModalData({
                                id: quotation.id,
                                notes: quotation.notes || '',
                                followUpDate: quotation.followUpDate ? new Date(quotation.followUpDate).toISOString().split('T')[0] : ''
                              })}
                              className="glass-button-icon p-2 rounded-md hover:text-amber-400 hover:bg-amber-400/10 cursor-pointer" title="Notes & Reminder">
                              <span className="material-symbols-outlined text-[16px]">sticky_note_2</span>
                            </button>
                            <button
                              onClick={() => isMostRecent && setQuotationToDelete(quotation.id)}
                              disabled={!isMostRecent}
                              className={`glass-button-icon p-2 rounded-md ${isMostRecent ? 'hover:text-error hover:bg-error/10 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                              title={isMostRecent ? 'Delete' : 'Only the most recent can be deleted'}
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                            <div className="w-px h-5 bg-primary/20"></div>
                            <button
                              onClick={() => setOpenActionId(null)}
                              className="glass-button-icon p-2 rounded-md hover:bg-surface-container-highest cursor-pointer" title="Close">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 animate-in fade-in duration-300">
                            <button onClick={() => handleViewPdf(quotation.id, quotation.quotationNumber)} disabled={isLoadingPdf} className="glass-button-icon p-2 rounded-md hover:text-blue-400 hover:bg-blue-400/10 cursor-pointer disabled:opacity-50" title="View">
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                            <Link href={`/invoices/new?copyFromQuotation=${quotation.id}`}>
                              <button className="glass-button-icon p-2 rounded-md hover:text-purple-400 hover:bg-purple-400/10 cursor-pointer" title="Convert to Invoice">
                                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                              </button>
                            </Link>
                            <button onClick={() => handleSend(quotation.id)} disabled={isSendingId === quotation.id} className="glass-button-icon p-2 rounded-md hover:text-emerald-400 hover:bg-emerald-400/10 cursor-pointer disabled:opacity-50" title="Send">
                              {isSendingId === quotation.id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">send</span>}
                            </button>
                            <div className="w-px h-5 bg-primary/20"></div>
                            <button
                              onClick={() => setOpenActionId(quotation.id)}
                              className="glass-button-icon p-2 rounded-md hover:text-primary hover:bg-primary/10 cursor-pointer" title="More Actions">
                              <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                <span className="text-sm text-on-surface-variant">
                  {totalItems === 0 ? 'Showing 0 entries' : `Showing ${startIndex} to ${endIndex} of ${totalItems} entries`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface-container-highest border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>

                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-primary text-on-primary shadow-[0_0_10px_rgba(125,211,252,0.3)]">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {quotationToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-fade-slide-up" style={{ animationDuration: '0.3s' }}>
              <div className="bg-surface w-full max-w-md rounded-[2rem] p-8 shadow-2xl shadow-error/10 border border-outline-variant/20 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/50 to-transparent"></div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0 border border-error/20">
                    <span className="material-symbols-outlined text-error text-[24px]">warning</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Delete Quotation?</h3>
                    <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                      Are you sure you want to delete this quotation? This will permanently remove the quotation, its items, and all attached files. This action cannot be undone.
                      <br /><br />
                      <span className="font-semibold text-error/80 text-xs uppercase tracking-wide">Note: You can only delete the most recent quotation for the branch.</span>
                    </p>
                    <div className="flex items-center justify-end gap-3 mt-6">
                      <button
                        onClick={() => setQuotationToDelete(null)}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <><span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> Deleting...</>
                        ) : (
                          <><span className="material-symbols-outlined text-[16px]">delete</span> Delete Quotation</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes & Reminder Modal */}
          {notesModalData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-fade-slide-up" style={{ animationDuration: '0.3s' }}>
              <div className="bg-surface w-full max-w-md rounded-[2rem] p-8 shadow-2xl shadow-primary/10 border border-outline-variant/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-headline font-bold text-on-surface">Notes & Reminder</h3>
                    <button onClick={() => setNotesModalData(null)} className="text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={notesModalData.followUpDate}
                      onChange={(e) => setNotesModalData({ ...notesModalData, followUpDate: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Notes</label>
                    <textarea
                      rows={4}
                      value={notesModalData.notes}
                      onChange={(e) => setNotesModalData({ ...notesModalData, notes: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none custom-scrollbar"
                      placeholder="Enter notes here..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      onClick={() => setNotesModalData(null)}
                      disabled={isSavingNotes}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-on-primary shadow-[0_0_15px_rgba(125,211,252,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingNotes ? (
                        <><span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> Saving...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[16px]">save</span> Save</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* PDF Viewer Modal */}
          {viewerPdfUrl && (
            <PdfViewerModal
              url={viewerPdfUrl.url}
              title={viewerPdfUrl.title}
              documentId={viewerPdfUrl.id}
              documentType="quotation"
              onClose={closePdfViewer}
              renderActions={(documentId) => {
                const activeQuotation = quotations.find(q => q.id === documentId);
                if (!activeQuotation) return null;
                return (
                  <>
                    <Link href={`/invoices/new?copyFromQuotation=${activeQuotation.id}`}>
                      <button onClick={closePdfViewer} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest/50 hover:bg-purple-400/10 hover:text-purple-400 border border-transparent hover:border-purple-400/20 text-on-surface-variant transition-all cursor-pointer tooltip" title="Convert to Invoice">
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      </button>
                    </Link>
                    <button onClick={() => handleSend(activeQuotation.id)} disabled={isSendingId === activeQuotation.id} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest/50 hover:bg-emerald-400/10 hover:text-emerald-400 border border-transparent hover:border-emerald-400/20 text-on-surface-variant transition-all cursor-pointer tooltip disabled:opacity-50 disabled:cursor-not-allowed" title="Send">
                      {isSendingId === activeQuotation.id ? <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                    </button>
                    <button
                      onClick={() => {
                        closePdfViewer();
                        setNotesModalData({
                          id: activeQuotation.id,
                          notes: activeQuotation.notes || '',
                          followUpDate: activeQuotation.followUpDate ? new Date(activeQuotation.followUpDate).toISOString().split('T')[0] : ''
                        });
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest/50 hover:bg-amber-400/10 hover:text-amber-400 border border-transparent hover:border-amber-400/20 text-on-surface-variant transition-all cursor-pointer tooltip" title="Notes & Reminder">
                      <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
                    </button>
                  </>
                );
              }}
            />
          )}

          {/* Footer Decoration */}
          <footer className="relative z-10 w-full opacity-40 text-center flex items-center justify-center gap-4 mt-8">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
            <p className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              BillTea
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
          </footer>

        </div>
      </div>
    </>
  );
}