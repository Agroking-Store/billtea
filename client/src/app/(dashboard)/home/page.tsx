'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/auth';
import PdfViewerModal from '@/components/PdfViewerModal';
import PaymentModal from '@/components/PaymentModal';

interface SalesDataPoint {
  date: string;
  sales: string;
  salesRaw: number;
  x: number;
  y: number;
}

export default function DashboardHome() {
  const router = useRouter();
  const [hoveredInvoicePoint, setHoveredInvoicePoint] = useState<SalesDataPoint | null>(null);
  const [hoveredQuotationPoint, setHoveredQuotationPoint] = useState<SalesDataPoint | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const [activeDropdown, setActiveDropdown] = useState<'branch' | 'range' | null>(null);

  const toggleDropdown = (name: 'branch' | 'range') => {
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

  const [dateRangeType, setDateRangeType] = useState<string>('30_days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);

  const [viewerPdfUrl, setViewerPdfUrl] = useState<{ url: string; title: string; id: string, type: 'quotation' | 'invoice' } | null>(null);
  
  const [isSendingId, setIsSendingId] = useState<string | null>(null);
  const [notesModalData, setNotesModalData] = useState<{ id: string, notes: string, followUpDate: string } | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [paymentModalInvoice, setPaymentModalInvoice] = useState<{ id: string, invoiceNumber: string, amountDue: number } | null>(null);

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
        setRefreshKey(prev => prev + 1);
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

  const handleSend = async (id: string, type: 'quotation' | 'invoice' = 'quotation') => {
    try {
      setIsSendingId(id);
      const res = await apiFetch(`/${type}s/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      });
      if (res.ok) {
        setRefreshKey(prev => prev + 1);
      } else {
        const errData = await res.json();
        alert(errData.message || `Failed to send ${type}`);
      }
    } catch (err: any) {
      alert(`Failed to send ${type}`);
    } finally {
      setIsSendingId(null);
    }
  };
  
  const handleViewPdf = async (id: string, numberStr: string, type: 'quotation' | 'invoice' = 'quotation') => {
    try {
      const endpoint = type === 'quotation' ? `/quotations/${id}/pdf` : `/invoices/${id}/pdf`;
      const prefix = type === 'quotation' ? 'Quotation' : 'Invoice';
      const cacheBustedEndpoint = `${endpoint}?t=${Date.now()}`;
      const res = await apiFetch(cacheBustedEndpoint, { method: 'GET' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setViewerPdfUrl({ url, title: `${prefix}-${numberStr}.pdf`, id, type });
    } catch (err) {
      alert('Failed to load PDF');
    }
  };

  const closePdfViewer = () => {
    if (viewerPdfUrl) {
      window.URL.revokeObjectURL(viewerPdfUrl.url);
      setViewerPdfUrl(null);
    }
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await apiFetch('/branches');
        const data = await res.json();
        if (data.branches) setBranches(data.branches);
      } catch (err) {
        console.error('Failed to fetch branches', err);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (branchId) queryParams.append('branchId', branchId);

        let start = '';
        let end = '';
        const today = new Date();
        const yyyyMmDd = (d: Date) => d.toISOString().split('T')[0];

        if (dateRangeType === 'custom') {
          start = customStartDate;
          end = customEndDate;
        } else {
          end = yyyyMmDd(today);
          const pastDate = new Date();
          if (dateRangeType === 'today') {
            start = end;
          } else if (dateRangeType === '1_week') {
            pastDate.setDate(today.getDate() - 7);
            start = yyyyMmDd(pastDate);
          } else if (dateRangeType === '15_days') {
            pastDate.setDate(today.getDate() - 15);
            start = yyyyMmDd(pastDate);
          } else if (dateRangeType === '30_days') {
            pastDate.setDate(today.getDate() - 30);
            start = yyyyMmDd(pastDate);
          } else if (dateRangeType === '6_months') {
            pastDate.setMonth(today.getMonth() - 6);
            start = yyyyMmDd(pastDate);
          } else if (dateRangeType === '1_year') {
            pastDate.setFullYear(today.getFullYear() - 1);
            start = yyyyMmDd(pastDate);
          }

          if (customStartDate !== start || customEndDate !== end) {
            setCustomStartDate(start);
            setCustomEndDate(end);
          }
        }

        if (start) queryParams.append('startDate', start);
        if (end) queryParams.append('endDate', end);

        const url = `/dashboard/stats?${queryParams.toString()}`;
        const res = await apiFetch(url);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [branchId, dateRangeType, customStartDate, customEndDate, refreshKey]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  // Prepare chart data
  const createSmoothPath = (points: { x: number, y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M${points[0].x},${points[0].y}`;
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  let invoiceSalesData: SalesDataPoint[] = [];
  let quotationSalesData: SalesDataPoint[] = [];
  let invoicePath = '';
  let quotationPath = '';
  let maxInvoiceSales = 1;
  let maxQuotationSales = 1;

  if (stats && stats.salesTrend) {
    maxInvoiceSales = Math.max(...stats.salesTrend.map((d: any) => d.invoices), 1);
    maxQuotationSales = Math.max(...stats.salesTrend.map((d: any) => d.quotations), 1);

    const xStep = 400 / Math.max(1, stats.salesTrend.length - 1);

    invoiceSalesData = stats.salesTrend.map((d: any, i: number) => ({
      date: formatDate(d.date),
      sales: formatCurrency(d.invoices),
      salesRaw: d.invoices,
      x: i * xStep,
      y: 100 - (d.invoices / maxInvoiceSales) * 80, // Leave some padding
    }));

    quotationSalesData = stats.salesTrend.map((d: any, i: number) => ({
      date: formatDate(d.date),
      sales: formatCurrency(d.quotations),
      salesRaw: d.quotations,
      x: i * xStep,
      y: 100 - (d.quotations / maxQuotationSales) * 80,
    }));

    invoicePath = createSmoothPath(invoiceSalesData);
    quotationPath = createSmoothPath(quotationSalesData);
  }

  return (
    <>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-0 relative overflow-x-hidden selection:bg-primary/30">
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

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-12 pb-16">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(125,211,252,0.15)]">
              <span className="material-symbols-outlined text-[14px]">monitoring</span>
              Overview Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
              <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Monitor your business metrics, track sales performance, and manage recent activities in real-time.
            </p>
          </div>
        </header>

        {!stats ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-slide-up">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-on-surface-variant font-medium tracking-wide">Loading dashboard data...</p>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 relative flex flex-col gap-12 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {loading && (
              <div className="absolute inset-0 z-50 flex items-start justify-center pt-32 pointer-events-none">
                <div className="bg-surface p-3 rounded-full shadow-lg border border-outline-variant/20 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-on-surface-variant pr-2">Refreshing...</span>
                </div>
              </div>
            )}
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Invoices</p>
                  <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">receipt_long</span>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight">{stats?.kpis?.totalInvoices || 0}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className={`${(stats?.kpis?.invoicesChange || 0) >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'} px-2 py-0.5 rounded flex items-center`}>
                    <span className="material-symbols-outlined text-[14px]">{(stats?.kpis?.invoicesChange || 0) >= 0 ? 'arrow_upward' : 'arrow_downward'}</span> {Math.abs(stats?.kpis?.invoicesChange || 0)}%
                  </span>
                  <span className="text-on-surface-variant/60">vs last month</span>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-tertiary/40 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Quotations</p>
                  <span className="material-symbols-outlined text-tertiary p-2 rounded-lg bg-tertiary/10">request_quote</span>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight">{stats?.kpis?.totalQuotations || 0}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className={`${(stats?.kpis?.quotationsChange || 0) >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'} px-2 py-0.5 rounded flex items-center`}>
                    <span className="material-symbols-outlined text-[14px]">{(stats?.kpis?.quotationsChange || 0) >= 0 ? 'arrow_upward' : 'arrow_downward'}</span> {Math.abs(stats?.kpis?.quotationsChange || 0)}%
                  </span>
                  <span className="text-on-surface-variant/60">vs last month</span>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Sales</p>
                  <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">payments</span>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight">{formatCurrency(stats?.kpis?.totalSales || 0)}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className={`${(stats?.kpis?.salesChange || 0) >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'} px-2 py-0.5 rounded flex items-center`}>
                    <span className="material-symbols-outlined text-[14px]">{(stats?.kpis?.salesChange || 0) >= 0 ? 'arrow_upward' : 'arrow_downward'}</span> {Math.abs(stats?.kpis?.salesChange || 0)}%
                  </span>
                  <span className="text-on-surface-variant/60">vs last month</span>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-tertiary/40 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Customers</p>
                  <span className="material-symbols-outlined text-tertiary p-2 rounded-lg bg-tertiary/10">group</span>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight">{stats?.kpis?.totalCustomers || 0}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className={`${(stats?.kpis?.customersChange || 0) >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'} px-2 py-0.5 rounded flex items-center`}>
                    <span className="material-symbols-outlined text-[14px]">{(stats?.kpis?.customersChange || 0) >= 0 ? 'arrow_upward' : 'arrow_downward'}</span> {Math.abs(stats?.kpis?.customersChange || 0)}%
                  </span>
                  <span className="text-on-surface-variant/60">vs last month</span>
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="glass-panel px-6 py-4 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 animate-fade-slide-up relative overflow-visible z-25" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider shrink-0 w-24 sm:w-auto">Branch Filter:</label>
                  <div className="dropdown-container relative flex-1 sm:flex-none" style={{ zIndex: activeDropdown === 'branch' ? 50 : 10 }}>
                    <button
                      type="button"
                      className="glass-input rounded-xl py-2 pl-4 pr-10 text-sm font-medium cursor-pointer w-full sm:w-[180px] focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface text-left flex items-center justify-between min-h-[38px]"
                      onClick={() => toggleDropdown('branch')}
                    >
                      <span className="truncate">
                        {branchId === '' ? 'All Branches' : branches.find(b => b.id === branchId)?.name || 'All Branches'}
                      </span>
                      <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[18px] transition-transform duration-200 ${activeDropdown === 'branch' ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    
                    {activeDropdown === 'branch' && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-surface rounded-xl border border-primary/10 overflow-y-auto max-h-60 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                        <div 
                          onMouseDown={() => { setBranchId(''); setActiveDropdown(null); }} 
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${branchId === '' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          All Branches
                        </div>
                        {branches.map(b => (
                          <div 
                            key={b.id}
                            onMouseDown={() => { setBranchId(b.id); setActiveDropdown(null); }} 
                            className={`px-4 py-3 text-sm cursor-pointer transition-colors ${branchId === b.id ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                          >
                            {b.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider shrink-0 w-24 sm:w-auto">Date Range:</label>
                  <div className="dropdown-container relative flex-1 sm:flex-none" style={{ zIndex: activeDropdown === 'range' ? 50 : 10 }}>
                    <button
                      type="button"
                      className="glass-input rounded-xl py-2 pl-4 pr-10 text-sm font-medium cursor-pointer w-full sm:w-[150px] focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface text-left flex items-center justify-between min-h-[38px]"
                      onClick={() => toggleDropdown('range')}
                    >
                      <span>
                        {dateRangeType === 'today' ? 'Today' :
                         dateRangeType === '1_week' ? 'Last 7 Days' :
                         dateRangeType === '15_days' ? 'Last 15 Days' :
                         dateRangeType === '30_days' ? 'Last 30 Days' :
                         dateRangeType === '6_months' ? 'Last 6 Months' :
                         dateRangeType === '1_year' ? 'Last 1 Year' : 'Custom'}
                      </span>
                      <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[18px] transition-transform duration-200 ${activeDropdown === 'range' ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    
                    {activeDropdown === 'range' && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-surface rounded-xl border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                        <div 
                          onMouseDown={() => { setDateRangeType('today'); setActiveDropdown(null); }} 
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${dateRangeType === 'today' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          Today
                        </div>
                        <div 
                          onMouseDown={() => { setDateRangeType('1_week'); setActiveDropdown(null); }} 
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${dateRangeType === '1_week' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          Last 7 Days
                        </div>
                        <div 
                          onMouseDown={() => { setDateRangeType('15_days'); setActiveDropdown(null); }} 
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${dateRangeType === '15_days' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          Last 15 Days
                        </div>
                        <div 
                          onMouseDown={() => { setDateRangeType('30_days'); setActiveDropdown(null); }} 
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${dateRangeType === '30_days' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          Last 30 Days
                        </div>
                        <div 
                          onMouseDown={() => { setDateRangeType('6_months'); setActiveDropdown(null); }} 
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${dateRangeType === '6_months' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          Last 6 Months
                        </div>
                        <div 
                          onMouseDown={() => { setDateRangeType('1_year'); setActiveDropdown(null); }} 
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${dateRangeType === '1_year' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          Last 1 Year
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider shrink-0">From</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => { setCustomStartDate(e.target.value); setDateRangeType('custom'); }}
                      className="glass-input rounded-xl py-1.5 px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider shrink-0">To</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => { setCustomEndDate(e.target.value); setDateRangeType('custom'); }}
                      className="glass-input rounded-xl py-1.5 px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setBranchId(''); setDateRangeType('30_days'); }}
                className="glass-button px-4 py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-bright transition-colors text-sm font-bold text-on-surface hover:text-primary shrink-0 w-full xl:w-auto mt-4 xl:mt-0"
                title="Reset Filters"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                Reset
              </button>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.4s' }}>
              {/* Invoice Sales Trend */}
              <div className="glass-panel-elevated p-8 rounded-3xl hover:border-primary/30 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.1)] transition-all duration-300">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-on-surface font-bold mb-1">Invoice Sales</h3>
                  </div>
                </div>
                <div className="h-48 w-full relative pb-6">
                  <svg
                    className="w-full h-full overflow-hidden cursor-crosshair"
                    preserveAspectRatio="none"
                    viewBox="0 0 400 100"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relativeX = ((e.clientX - rect.left) / rect.width) * 400;
                      if (invoiceSalesData.length > 0) {
                        const closestPoint = invoiceSalesData.reduce((prev, curr) =>
                          Math.abs(curr.x - relativeX) < Math.abs(prev.x - relativeX) ? curr : prev
                        );
                        setHoveredInvoicePoint(closestPoint);
                      }
                    }}
                    onMouseLeave={() => setHoveredInvoicePoint(null)}
                  >
                    <defs>
                      <linearGradient id="gradient1" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.3"></stop>
                        <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <path d={`${invoicePath} L400,100 L0,100 Z`} fill="url(#gradient1)"></path>
                    <path className="path-line" d={invoicePath} fill="none" stroke="#7dd3fc" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>

                    {hoveredInvoicePoint && (
                      <>
                        <line
                          x1={hoveredInvoicePoint.x}
                          y1={0}
                          x2={hoveredInvoicePoint.x}
                          y2={100}
                          stroke="#7dd3fc"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.6"
                        />
                        <circle
                          cx={hoveredInvoicePoint.x}
                          cy={hoveredInvoicePoint.y}
                          r="8"
                          fill="#7dd3fc"
                          opacity="0.3"
                        />
                        <circle
                          cx={hoveredInvoicePoint.x}
                          cy={hoveredInvoicePoint.y}
                          r="4"
                          fill="#7dd3fc"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      </>
                    )}
                  </svg>

                  {hoveredInvoicePoint && (
                    <div
                      className="absolute pointer-events-none z-30 transition-all duration-150 ease-out glass-panel p-2.5 rounded-xl shadow-lg border border-primary/20 flex flex-col gap-1 text-xs min-w-[140px]"
                      style={{
                        left: `${(hoveredInvoicePoint.x / 400) * 100}%`,
                        top: `${(hoveredInvoicePoint.y / 100) * 100}%`,
                        transform: 'translate(-50%, calc(-100% - 15px))',
                      }}
                    >
                      <div className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider">{hoveredInvoicePoint.date}</div>
                      <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(125,211,252,0.8)]"></span>
                        Sales: {hoveredInvoicePoint.sales}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 w-full flex justify-between text-[10px] font-bold text-on-surface-variant/60 pt-2 border-t border-outline-variant/30 uppercase tracking-wider px-2">
                    <span>W1</span>
                    <span>W2</span>
                    <span>W3</span>
                    <span>W4</span>
                  </div>
                </div>
              </div>

              {/* Quotation Sales Trend */}
              <div className="glass-panel-elevated p-8 rounded-3xl hover:border-tertiary/30 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.1)] transition-all duration-300">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-on-surface font-bold mb-1">Quotation Value</h3>
                  </div>
                </div>
                <div className="h-48 w-full relative pb-6">
                  <svg
                    className="w-full h-full overflow-hidden cursor-crosshair"
                    preserveAspectRatio="none"
                    viewBox="0 0 400 100"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relativeX = ((e.clientX - rect.left) / rect.width) * 400;
                      if (quotationSalesData.length > 0) {
                        const closestPoint = quotationSalesData.reduce((prev, curr) =>
                          Math.abs(curr.x - relativeX) < Math.abs(prev.x - relativeX) ? curr : prev
                        );
                        setHoveredQuotationPoint(closestPoint);
                      }
                    }}
                    onMouseLeave={() => setHoveredQuotationPoint(null)}
                  >
                    <defs>
                      <linearGradient id="gradient2" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#c8a0f0" stopOpacity="0.3"></stop>
                        <stop offset="100%" stopColor="#c8a0f0" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <path d={`${quotationPath} L400,100 L0,100 Z`} fill="url(#gradient2)"></path>
                    <path className="path-line" d={quotationPath} fill="none" stroke="#c8a0f0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>

                    {hoveredQuotationPoint && (
                      <>
                        <line
                          x1={hoveredQuotationPoint.x}
                          y1={0}
                          x2={hoveredQuotationPoint.x}
                          y2={100}
                          stroke="#c8a0f0"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.6"
                        />
                        <circle
                          cx={hoveredQuotationPoint.x}
                          cy={hoveredQuotationPoint.y}
                          r="8"
                          fill="#c8a0f0"
                          opacity="0.3"
                        />
                        <circle
                          cx={hoveredQuotationPoint.x}
                          cy={hoveredQuotationPoint.y}
                          r="4"
                          fill="#c8a0f0"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      </>
                    )}
                  </svg>

                  {hoveredQuotationPoint && (
                    <div
                      className="absolute pointer-events-none z-30 transition-all duration-150 ease-out glass-panel p-2.5 rounded-xl shadow-lg border border-tertiary/20 flex flex-col gap-1 text-xs min-w-[140px]"
                      style={{
                        left: `${(hoveredQuotationPoint.x / 400) * 100}%`,
                        top: `${(hoveredQuotationPoint.y / 100) * 100}%`,
                        transform: 'translate(-50%, calc(-100% - 15px))',
                      }}
                    >
                      <div className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider">{hoveredQuotationPoint.date}</div>
                      <div className="flex items-center gap-1.5 font-bold text-tertiary text-xs">
                        <span className="size-1.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(200,160,240,0.8)]"></span>
                        Quote: {hoveredQuotationPoint.sales}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 w-full flex justify-between text-[10px] font-bold text-on-surface-variant/60 pt-2 border-t border-outline-variant/30 uppercase tracking-wider px-2">
                    <span>W1</span>
                    <span>W2</span>
                    <span>W3</span>
                    <span>W4</span>
                  </div>
                </div>
              </div>

              {/* Invoice Count Bar (6 weeks) */}
              <div className="glass-panel-elevated p-8 rounded-3xl hover:border-primary/30 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.1)] transition-all duration-300">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-on-surface font-bold mb-1">Invoice Count</h3>
                  </div>
                </div>
                <div className="h-48 w-full flex items-end justify-around pb-6 relative">
                  {stats?.weeklyCounts?.map((week: any, i: number) => {
                    const maxCount = Math.max(...stats.weeklyCounts.map((w: any) => w.invoices), 1);
                    const height = (week.invoices / maxCount) * 90; // max 90%
                    return (
                      <div key={i} className="w-10 bg-primary/30 hover:bg-primary/60 border border-primary/40 rounded-t-xl bar-grow transition-colors relative group" style={{ height: `${Math.max(height, 5)}%`, animationDelay: `${0.1 * i}s` }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs font-bold py-1.5 px-2.5 rounded-lg glass-panel transition-opacity shadow-lg border border-primary/20 text-primary z-10">{week.invoices}</div>
                      </div>
                    );
                  })}
                  <div className="absolute bottom-0 w-full flex justify-around text-[10px] font-bold text-on-surface-variant/60 pt-2 border-t border-outline-variant/30 uppercase tracking-wider">
                    {stats?.weeklyCounts?.map((w: any, i: number) => <span key={i}>{w.week}</span>)}
                  </div>
                </div>
              </div>

              {/* Quotation Count Bar (6 weeks) */}
              <div className="glass-panel-elevated p-8 rounded-3xl hover:border-tertiary/30 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.1)] transition-all duration-300">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-on-surface font-bold mb-1">Quotation Count</h3>
                  </div>
                </div>
                <div className="h-48 w-full flex items-end justify-around pb-6 relative">
                  {stats?.weeklyCounts?.map((week: any, i: number) => {
                    const maxCount = Math.max(...stats.weeklyCounts.map((w: any) => w.quotations), 1);
                    const height = (week.quotations / maxCount) * 90; // max 90%
                    return (
                      <div key={i} className="w-10 bg-tertiary/30 hover:bg-tertiary/60 border border-tertiary/40 rounded-t-xl bar-grow transition-colors relative group" style={{ height: `${Math.max(height, 5)}%`, animationDelay: `${0.1 * i}s` }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs font-bold py-1.5 px-2.5 rounded-lg glass-panel transition-opacity shadow-lg border border-tertiary/20 text-tertiary z-10">{week.quotations}</div>
                      </div>
                    );
                  })}
                  <div className="absolute bottom-0 w-full flex justify-around text-[10px] font-bold text-on-surface-variant/60 pt-2 border-t border-outline-variant/30 uppercase tracking-wider">
                    {stats?.weeklyCounts?.map((w: any, i: number) => <span key={i}>{w.week}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Reminders & Followups */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.5s' }}>
              {/* Invoice Reminders */}
              <div className="xl:col-span-1 glass-panel p-8 rounded-3xl hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                    </div>
                    Invoice Reminders
                  </h3>
                </div>
                <div className="space-y-4 flex-grow flex flex-col">
                  {stats?.invoiceReminders?.length === 0 ? (
                    <div className="text-on-surface-variant text-sm py-8 text-center">No overdue or unpaid invoices.</div>
                  ) : (
                    stats?.invoiceReminders?.map((inv: any) => (
                      <div 
                        key={inv.id} 
                        onClick={() => handleViewPdf(inv.id, inv.invoiceNumber, 'invoice')}
                        className="p-4 rounded-2xl bg-surface-bright/50 border border-outline-variant/30 flex gap-4 hover:bg-surface-bright hover:border-outline-variant/50 transition-all cursor-pointer group hover:-translate-y-0.5"
                      >
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                          <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                        </div>
                        <div className="flex flex-col justify-center flex-grow">
                          <p className="text-sm font-bold text-on-surface mb-0.5">{inv.customer?.customerName || 'Unknown Customer'}</p>
                          <p className="text-xs text-on-surface-variant font-medium flex items-center flex-wrap gap-x-2 gap-y-1">
                            <span className="text-rose-400 font-bold">Due: {formatCurrency(inv.amountDue)}</span>
                            <span>•</span>
                            <span>{inv.customer?.mobileNumber || 'No Mobile'}</span>
                            <span>•</span>
                            <span>#{inv.invoiceNumber}</span>
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-bold bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20">{inv.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quotation Followups */}
              <div className="xl:col-span-1 glass-panel p-8 rounded-3xl hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                    </div>
                    Quotation Followups
                  </h3>
                </div>
                <div className="space-y-4 flex-grow flex flex-col">
                  {stats?.quotationFollowups?.length === 0 ? (
                    <div className="text-on-surface-variant text-sm py-8 text-center">No quotations need follow-up.</div>
                  ) : (
                    stats?.quotationFollowups?.map((quo: any) => (
                      <div 
                        key={quo.id} 
                        onClick={() => handleViewPdf(quo.id, quo.quotationNumber)}
                        className="p-4 rounded-2xl bg-surface-bright/50 border border-outline-variant/30 flex gap-4 hover:bg-surface-bright hover:border-outline-variant/50 transition-all cursor-pointer group hover:-translate-y-0.5"
                      >
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                          <span className="material-symbols-outlined text-[24px]">request_quote</span>
                        </div>
                        <div className="flex flex-col justify-center flex-grow overflow-hidden">
                          <p className="text-sm font-bold text-on-surface mb-0.5 truncate">{quo.customer?.customerName || 'Unknown Customer'}</p>
                          <p className="text-xs text-on-surface-variant font-medium mb-0.5">#{quo.quotationNumber} • {formatCurrency(quo.grandTotal)}</p>
                          {quo.notes && (
                            <p className="text-[11px] text-primary/80 italic truncate mt-1 border-l-2 border-primary/20 pl-2">
                              {quo.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">{quo.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {viewerPdfUrl && (
        <PdfViewerModal
          url={viewerPdfUrl.url}
          title={viewerPdfUrl.title}
          documentId={viewerPdfUrl.id}
          documentType={viewerPdfUrl.type}
          onClose={closePdfViewer}
          renderActions={(documentId, documentType) => {
            if (documentType === 'quotation') {
              const activeQuotation = stats?.quotationFollowups?.find((q: any) => q.id === documentId);
              if (!activeQuotation) return null;
              return (
                <>
                  <Link href={`/invoices/new?copyFromQuotation=${activeQuotation.id}`}>
                    <button onClick={closePdfViewer} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 hover:bg-purple-400/10 hover:text-purple-400 border border-transparent hover:border-purple-400/20 text-on-surface-variant transition-all cursor-pointer tooltip" title="Convert to Invoice">
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    </button>
                  </Link>
                  <button onClick={() => handleSend(activeQuotation.id, 'quotation')} disabled={isSendingId === activeQuotation.id} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 hover:bg-emerald-400/10 hover:text-emerald-400 border border-transparent hover:border-emerald-400/20 text-on-surface-variant transition-all cursor-pointer tooltip disabled:opacity-50" title="Send">
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
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 hover:bg-amber-400/10 hover:text-amber-400 border border-transparent hover:border-amber-400/20 text-on-surface-variant transition-all cursor-pointer tooltip" title="Notes & Reminder">
                    <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
                  </button>
                </>
              );
            } else {
              const activeInvoice = stats?.invoiceReminders?.find((i: any) => i.id === documentId);
              if (!activeInvoice) return null;
              return (
                <>
                  <button onClick={() => { closePdfViewer(); setPaymentModalInvoice({ id: activeInvoice.id, invoiceNumber: activeInvoice.invoiceNumber, amountDue: activeInvoice.amountDue }); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 hover:bg-purple-400/10 hover:text-purple-400 border border-transparent hover:border-purple-400/20 text-on-surface-variant transition-all cursor-pointer tooltip" title="Add Payment">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </button>
                  <button onClick={() => handleSend(activeInvoice.id, 'invoice')} disabled={isSendingId === activeInvoice.id} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 hover:bg-emerald-400/10 hover:text-emerald-400 border border-transparent hover:border-emerald-400/20 text-on-surface-variant transition-all cursor-pointer tooltip disabled:opacity-50" title="Send">
                    {isSendingId === activeInvoice.id ? <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                  </button>
                </>
              );
            }
          }}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={!!paymentModalInvoice} 
        onClose={() => setPaymentModalInvoice(null)} 
        invoice={paymentModalInvoice} 
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />

      {/* Notes & Reminder Modal */}
      {notesModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setNotesModalData(null)}></div>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-fade-slide-up">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-bright/50">
              <h3 className="text-lg font-bold text-on-surface">Notes & Reminder</h3>
              <button onClick={() => setNotesModalData(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Follow Up Date</label>
                <input
                  type="date"
                  className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  value={notesModalData.followUpDate}
                  onChange={(e) => setNotesModalData({ ...notesModalData, followUpDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Notes</label>
                <textarea
                  className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all min-h-[100px]"
                  placeholder="Enter notes about this quotation..."
                  value={notesModalData.notes}
                  onChange={(e) => setNotesModalData({ ...notesModalData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-bright/50 flex justify-end gap-3">
              <button 
                onClick={() => setNotesModalData(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingNotes ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Decoration */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 pb-8 opacity-40 text-center flex items-center justify-center gap-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
        <p className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
          BillTea • Dashboard
        </p>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
      </footer>
    </div>
  </>
);
}
