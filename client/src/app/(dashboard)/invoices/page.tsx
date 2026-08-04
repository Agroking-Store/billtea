'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import PdfViewerModal from '@/components/PdfViewerModal';
import { apiFetch } from '@/lib/auth';
import { useBranch } from '@/components/BranchProvider';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  customer: {
    id: string;
    customerName: string;
    companyName: string;
    mobileNumber?: string;
  };
  totals: {
    grandTotal: number;
  };
  amountPaid: number;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface ToastMessage {
  type: 'success' | 'error';
  text: string;
}

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

function Toast({ message, onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progressKey, setProgressKey] = useState(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleClose = (ms: number) => {
    clearTimer();
    startedAtRef.current = Date.now();
    remainingRef.current = ms;
    timerRef.current = setTimeout(() => {
      handleClose();
    }, ms);
  };

  useEffect(() => {
    if (!message) return;

    setLeaving(false);
    setPaused(false);
    setProgressKey((k) => k + 1);
    const enterTimer = setTimeout(() => setVisible(true), 10);

    scheduleClose(duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const handleClose = () => {
    clearTimer();
    setLeaving(true);
    setVisible(false);
    setTimeout(() => {
      onClose();
      setLeaving(false);
    }, 300);
  };

  const handleMouseEnter = () => {
    if (!message) return;
    setPaused(true);
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(remainingRef.current - elapsed, 0);
    clearTimer();
  };

  const handleMouseLeave = () => {
    if (!message) return;
    setPaused(false);
    scheduleClose(remainingRef.current);
  };

  if (!message && !leaving) return null;

  const isSuccess = message?.type === 'success';

  return (
    <div
      className="fixed top-6 right-6 z-[1100] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`pointer-events-auto relative overflow-hidden flex items-center gap-2.5 min-w-[220px] max-w-sm px-4 py-2.5 rounded-lg border shadow-xl backdrop-blur-sm transition-all duration-300 ease-out ${
          isSuccess
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        } ${
          visible
            ? 'opacity-100 translate-x-0 translate-y-0'
            : 'opacity-0 translate-x-4 -translate-y-1'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[18px] shrink-0 ${
            isSuccess ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {isSuccess ? 'check_circle' : 'error'}
        </span>
        <p className="flex-1 text-sm font-semibold leading-snug truncate">{message?.text}</p>
        <button
          onClick={handleClose}
          aria-label="Dismiss notification"
          className="shrink-0 p-0.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5">
          <div
            key={progressKey}
            className={`h-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{
              animation: `toast-countdown ${duration}ms linear forwards`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes toast-countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </div>
  );
}

export default function InvoicesPage() {
  const { selectedBranchId, isLoadingBranches } = useBranch();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [isSendingId, setIsSendingId] = useState<string | null>(null);
  const [viewerPdfUrl, setViewerPdfUrl] = useState<{ url: string, title: string, id: string } | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Toast State
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'CASH',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // ---- Sorting + Pagination state ----
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const toggleDropdown = (name: string) => {
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

  const stats = React.useMemo(() => {
    const total = invoices.length;
    const unpaid = invoices.filter((i) => i.status === 'UNPAID' || i.status === 'OVERDUE').length;
    const paid = invoices.filter((i) => i.status === 'PAID').length;
    const totalBilled = invoices.reduce((sum, i) => sum + (i.totals?.grandTotal || 0), 0);
    const totalOutstanding = invoices.reduce(
      (sum, i) => sum + Math.max((i.totals?.grandTotal || 0) - (i.amountPaid || 0), 0),
      0
    );
    return { total, unpaid, paid, totalBilled, totalOutstanding };
  }, [invoices]);

  const [paymentAttachment, setPaymentAttachment] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.8);
        };
      };
    });
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchInvoices();
    } else {
      setInvoices([]);
      setLoading(false);
    }
  }, [selectedBranchId]);

  // Pick up a toast message handed off from another page
  const checkToast = () => {
    try {
      const stored = sessionStorage.getItem('invoiceToast');
      if (stored) {
        setToast(JSON.parse(stored));
        sessionStorage.removeItem('invoiceToast');
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    checkToast();
    window.addEventListener('focus', checkToast);
    return () => window.removeEventListener('focus', checkToast);
  }, []);

  const fetchInvoices = async () => {
    if (!selectedBranchId) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(`/invoices?branchId=${selectedBranchId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
        throw new Error('Failed to fetch invoices');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice? Note: You can only delete the most recent invoice.')) return;
    try {
      const res = await apiFetch(`/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchInvoices();
        setToast({ type: 'success', text: 'Invoice deleted successfully!' });
      } else {
        const errData = await res.json();
        const msg = errData.message || 'Failed to delete invoice';
        setToast({ type: 'error', text: msg });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: 'Failed to delete invoice' });
    }
  };

  const handleSend = async (invoiceInput: string | Invoice) => {
    // 1. Resolve target invoice object
    let targetInvoice: Invoice | undefined;
    if (typeof invoiceInput === 'string') {
      targetInvoice = invoices.find((i) => i.id === invoiceInput);
    } else {
      targetInvoice = invoiceInput;
    }

    if (!targetInvoice || !targetInvoice.id) {
      alert('Invoice details not found.');
      return;
    }

    const invoice = targetInvoice;

    // 2. Prepare English message template & WhatsApp URL
    const customerName = invoice.customer?.customerName || invoice.customer?.companyName || 'Valued Customer';
    const grandTotalFormatted = invoice.totals?.grandTotal
      ? `₹${invoice.totals.grandTotal.toLocaleString('en-IN')}`
      : '₹0';
    const formattedDate = invoice.invoiceDate
      ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';

    const message = `Hello ${customerName},

Here are the details for your Invoice:

📌 *Invoice No:* ${invoice.invoiceNumber}
📅 *Date:* ${formattedDate}
💰 *Total Amount:* ${grandTotalFormatted}

Please find the attached Invoice PDF document for complete payment and billing details.

Thank you for your business! Please feel free to reach out if you have any questions.

Best regards,
BillTea`;

    // Format customer mobile number if available
    let rawPhone = invoice.customer?.mobileNumber || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const encodedText = encodeURIComponent(message);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    // 3. Open WhatsApp IMMEDIATELY directly on user click event
    window.open(waUrl, '_blank');

    try {
      setIsSendingId(invoice.id);

      // 4. Download PDF file for user in background
      try {
        const pdfRes = await apiFetch(`/invoices/${invoice.id}/pdf?t=${Date.now()}`, { method: 'GET' });
        if (pdfRes.ok) {
          const pdfBlob = await pdfRes.blob();
          const downloadUrl = window.URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to fetch invoice PDF for download', err);
      }
    } catch (err: any) {
      console.error('Send invoice error:', err);
    } finally {
      setIsSendingId(null);
    }
  };

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    try {
      const res = await apiFetch(`/invoices/${id}/pdf?t=${Date.now()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to download PDF. Please try again.' });
    }
  };

  const handleViewPdf = async (id: string, invoiceNumber: string) => {
    try {
      setIsLoadingPdf(true);
      const res = await apiFetch(`/invoices/${id}/pdf?t=${Date.now()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error('Failed to load PDF preview');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setViewerPdfUrl({ url, title: `Invoice-${invoiceNumber}.pdf`, id });
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to load PDF preview. Please try again.' });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const closePdfViewer = () => {
    if (viewerPdfUrl) {
      window.URL.revokeObjectURL(viewerPdfUrl.url);
      setViewerPdfUrl(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'PARTIAL': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PAID': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'OVERDUE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-surface-container text-on-surface-variant border-outline-variant/30';
    }
  };

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    const amountDue = Number((invoice.totals.grandTotal - invoice.amountPaid).toFixed(2));
    setPaymentForm({
      amount: amountDue,
      method: 'CASH',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setPaymentAttachment(null);
    setPaymentError('');
    setPaymentModalOpen(true);
    setOpenActionId(null);
  };

  const handleSubmitPayment = async () => {
    if (!selectedInvoiceForPayment) return;
    if (paymentForm.amount <= 0) {
      setPaymentError('Payment amount must be greater than 0');
      return;
    }
    const amountDue = Number((selectedInvoiceForPayment.totals.grandTotal - selectedInvoiceForPayment.amountPaid).toFixed(2));
    const paymentAmount = Number(paymentForm.amount.toFixed(2));
    if (paymentAmount > amountDue) {
      setPaymentError(`Payment amount cannot exceed the due amount`);
      return;
    }

    try {
      setIsSubmittingPayment(true);
      setPaymentError('');

      const res = await apiFetch(`/invoices/${selectedInvoiceForPayment.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add payment');
      }

      const data = await res.json();

      if (paymentAttachment && data.id) {
        const formData = new FormData();
        formData.append('file', paymentAttachment);

        await apiFetch(`/invoices/${selectedInvoiceForPayment.id}/payments/${data.id}/attachment`, {
          method: 'POST',
          body: formData,
          headers: {}
        });
      }

      setPaymentModalOpen(false);
      await fetchInvoices();
      setToast({ type: 'success', text: 'Payment recorded successfully!' });
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred while adding the payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, { id: string; customerName: string; companyName: string }>();
    invoices.forEach((inv) => {
      const c = inv.customer;
      if (c?.id && !map.has(c.id)) {
        map.set(c.id, { id: c.id, customerName: c.customerName, companyName: c.companyName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.customerName.localeCompare(b.customerName));
  }, [invoices]);

  const hasActiveFilters = Boolean(
    searchQuery || fromDate || toDate || selectedCustomerId !== 'ALL' || selectedStatus !== 'ALL'
  );

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedCustomerId('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = invoice.customer?.customerName?.toLowerCase().includes(query) ||
        invoice.customer?.companyName?.toLowerCase().includes(query);
      const amountMatch = invoice.totals?.grandTotal?.toString().includes(query);
      const invoiceNumberMatch = invoice.invoiceNumber?.toLowerCase().includes(query);
      if (!(nameMatch || amountMatch || invoiceNumberMatch)) return false;
    }

    if (selectedCustomerId !== 'ALL' && invoice.customer?.id !== selectedCustomerId) {
      return false;
    }

    if (selectedStatus !== 'ALL' && invoice.status !== selectedStatus) {
      return false;
    }

    if (fromDate || toDate) {
      const invDate = new Date(invoice.invoiceDate);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (invDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (invDate > to) return false;
      }
    }

    return true;
  });

  const mostRecentInvoiceId = useMemo(() => {
    if (invoices.length === 0) return null;
    return invoices.reduce((latest, inv) =>
      new Date(inv.invoiceDate) > new Date(latest.invoiceDate) ? inv : latest
    ).id;
  }, [invoices]);

  const handleSort = (key: string) => {
    setCurrentPage(1);
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string): string => {
    if (sortConfig?.key !== key) return 'unfold_more';
    return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more';
  };

  const sortValue = (row: Invoice, key: string): string | number => {
    switch (key) {
      case 'invoiceNumber': return row.invoiceNumber || '';
      case 'customer': return row.customer?.customerName || '';
      case 'date': return new Date(row.invoiceDate).getTime() || 0;
      case 'amount': return row.totals?.grandTotal || 0;
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

  const totalCount = sortedInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / entriesPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, fromDate, toDate, selectedCustomerId, selectedStatus]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalCount);

  const paginatedInvoices = useMemo(() => {
    return sortedInvoices.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  }, [sortedInvoices, currentPage, entriesPerPage]);

  const handleEntriesPerPageChange = (n: number) => {
    setEntriesPerPage(n);
    setCurrentPage(1);
  };

  const sortHeaderClass = (key: string) =>
    `px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${sortConfig?.key === key ? 'text-primary' : ''
    }`;

  const sortIconClass = (key: string) =>
    `material-symbols-outlined text-[12px] transition-opacity ${sortConfig?.key === key ? 'opacity-100 text-primary' : 'opacity-50 group-hover:opacity-100'
    }`;

  return (
    <>
      <Toast
        message={toast}
        onClose={() => setToast(null)}
      />

      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 relative overflow-x-hidden selection:bg-primary/30 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx global>{`
        table, thead, tbody, tr, td, th {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          user-select: none !important;
        }
        table ::selection,
        tr::selection, tr *::selection,
        td::selection, td *::selection,
        th::selection, th *::selection,
        button::selection, button *::selection,
        span::selection {
          background: transparent !important;
          color: inherit !important;
        }
        button, th, select, input, a, tr, td, span, [role='button'] {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
          outline: none !important;
        }
        button::-moz-focus-inner {
          border: 0 !important;
        }
        th, th:focus, th:active,
        button:focus, button:active,
        select:focus, select:active {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
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
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                Invoices Management
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
                <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                  Invoices
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Manage and track your invoices. Create new invoices, monitor their status, and record payments.
              </p>
            </div>
            <Link href="/invoices/new">
              <button
                disabled={!selectedBranchId}
                className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                <span className="material-symbols-outlined">add</span>
                <span>Create Invoice</span>
              </button>
            </Link>
          </header>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 relative z-10 animate-fade-slide-up">
              <span className="material-symbols-outlined text-error mt-0.5">error</span>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Invoices</p>
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">receipt_long</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.total}</p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">for this branch</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-tertiary/40 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Unpaid / Overdue</p>
                <span className="material-symbols-outlined text-red-500 p-2 rounded-lg bg-red-500/10">error_outline</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.unpaid}</p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">
                {stats.total > 0 ? `${Math.round((stats.unpaid / stats.total) * 100)}% of total` : 'no data yet'}
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Billed</p>
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">payments</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">
                ₹ {stats.totalBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">across all invoices</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-tertiary/40 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Outstanding</p>
                <span className="material-symbols-outlined text-tertiary p-2 rounded-lg bg-tertiary/10">account_balance_wallet</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">
                ₹ {stats.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">yet to be collected</p>
            </div>
          </div>

          {/* Filters Section */}
          <section
            className="glass-panel rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 animate-fade-slide-up relative z-20 overflow-visible shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6 relative z-10 flex-wrap">
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
            <div className="flex flex-wrap items-end gap-4 lg:gap-5 relative z-10 w-full">
              <div className="dropdown-container flex flex-col gap-1.5 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1 min-w-[160px] relative" style={{ zIndex: activeDropdown === 'customerFilter' ? 50 : 10 }}>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">
                  Customer
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="glass-input rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium cursor-pointer w-full focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface text-left flex items-center justify-between min-h-[42px]"
                    onClick={() => toggleDropdown('customerFilter')}
                  >
                    <span className="truncate">
                      {selectedCustomerId === 'ALL' ? 'All Customers' :
                        uniqueCustomers.find(c => c.id === selectedCustomerId)?.customerName || 'Select Customer'}
                    </span>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[18px] transition-transform duration-200 ${activeDropdown === 'customerFilter' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'customerFilter' && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-surface rounded-xl border border-primary/10 overflow-y-auto max-h-60 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                      <div
                        onMouseDown={() => { setSelectedCustomerId('ALL'); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedCustomerId === 'ALL' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                      >
                        All Customers
                      </div>
                      {uniqueCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onMouseDown={() => { setSelectedCustomerId(customer.id); setActiveDropdown(null); }}
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedCustomerId === customer.id ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                        >
                          {customer.customerName} {customer.companyName ? `(${customer.companyName})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="dropdown-container flex flex-col gap-1.5 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1 min-w-[140px] relative" style={{ zIndex: activeDropdown === 'statusFilter' ? 50 : 10 }}>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">
                  Payment Status
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="glass-input rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium cursor-pointer w-full focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface text-left flex items-center justify-between min-h-[42px]"
                    onClick={() => toggleDropdown('statusFilter')}
                  >
                    <span className="truncate">
                      {selectedStatus === 'ALL' ? 'All Status' :
                        selectedStatus === 'PAID' ? 'Paid' :
                          selectedStatus === 'UNPAID' ? 'Pending' :
                            selectedStatus === 'PARTIAL' ? 'Partial' :
                              selectedStatus === 'OVERDUE' ? 'Overdue' : 'Select Status'}
                    </span>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[18px] transition-transform duration-200 ${activeDropdown === 'statusFilter' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'statusFilter' && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-surface rounded-xl border border-primary/10 overflow-y-auto max-h-60 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                      {[
                        { value: 'ALL', label: 'All Status' },
                        { value: 'PAID', label: 'Paid' },
                        { value: 'UNPAID', label: 'Pending' },
                        { value: 'PARTIAL', label: 'Partial' },
                        { value: 'OVERDUE', label: 'Overdue' }
                      ].map((status) => (
                        <div
                          key={status.value}
                          onMouseDown={() => { setSelectedStatus(status.value); setActiveDropdown(null); }}
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedStatus === status.value ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                        >
                          {status.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">
                  From Date
                </label>
                <input
                  className="glass-input rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface w-full min-h-[42px]"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">
                  To Date
                </label>
                <input
                  className="glass-input rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface w-full min-h-[42px]"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="w-full lg:w-auto flex justify-end">
                <button
                  disabled={!hasActiveFilters}
                  className="glass-button h-[42px] px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-bright transition-all duration-300 text-sm font-bold text-on-surface hover:text-primary shadow-sm w-full lg:w-auto hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleClearFilters}
                  title="Reset Filters"
                >
                  <span className="material-symbols-outlined text-[18px]">undo</span>
                  Reset
                </button>
              </div>
            </div>
          </section>

          {/* Glassmorphic Data Table Container */}
          <div className="glass-panel rounded-3xl overflow-hidden relative z-10 animate-fade-slide-up shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]" style={{ animationDelay: '0.3s' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            {/* Table Controls */}
            <div className="p-4 md:p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-container-lowest">
              <div className="dropdown-container flex items-center justify-between sm:justify-start gap-3 text-sm font-medium text-on-surface-variant w-full sm:w-auto relative" style={{ zIndex: activeDropdown === 'entries' ? 50 : 10 }}>
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <div className="relative">
                    <button
                      type="button"
                      className="glass-input text-sm pl-3 pr-9 py-1.5 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/50 cursor-pointer bg-surface flex items-center justify-between min-w-[70px]"
                      onClick={() => toggleDropdown('entries')}
                    >
                      <span>{entriesPerPage}</span>
                      <span className={`material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] transition-transform duration-200 ${activeDropdown === 'entries' ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {activeDropdown === 'entries' && (
                      <div className="absolute top-full left-0 mt-1 z-[60] bg-surface rounded-lg border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 min-w-[70px]">
                        <div
                          onMouseDown={() => { handleEntriesPerPageChange(10); setActiveDropdown(null); }}
                          className={`px-3 py-2 text-sm cursor-pointer transition-colors ${entriesPerPage === 10 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          10
                        </div>
                        <div
                          onMouseDown={() => { handleEntriesPerPageChange(25); setActiveDropdown(null); }}
                          className={`px-3 py-2 text-sm cursor-pointer transition-colors ${entriesPerPage === 25 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          25
                        </div>
                        <div
                          onMouseDown={() => { handleEntriesPerPageChange(50); setActiveDropdown(null); }}
                          className={`px-3 py-2 text-sm cursor-pointer transition-colors ${entriesPerPage === 50 ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                        >
                          50
                        </div>
                      </div>
                    )}
                  </div>
                  <span>entries</span>
                </div>
              </div>
              <div className="relative w-full sm:w-auto">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                  className="w-full sm:w-80 bg-surface-container border border-outline-variant/30 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Search invoices..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
                <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low/50 border-b border-primary/10">
                  <tr>
                    <th className={sortHeaderClass('invoiceNumber')} scope="col" onClick={() => handleSort('invoiceNumber')}>
                      <div className="flex items-center gap-1">
                        Invoice Number <span className={sortIconClass('invoiceNumber')}>{getSortIcon('invoiceNumber')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('customer')} scope="col" onClick={() => handleSort('customer')}>
                      <div className="flex items-center gap-1">
                        Customer <span className={sortIconClass('customer')}>{getSortIcon('customer')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('date')} scope="col" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1">
                        Date & Status <span className={sortIconClass('date')}>{getSortIcon('date')}</span>
                      </div>
                    </th>
                    <th className={sortHeaderClass('amount')} scope="col" onClick={() => handleSort('amount')}>
                      <div className="flex items-center gap-1">
                        Total Amount <span className={sortIconClass('amount')}>{getSortIcon('amount')}</span>
                      </div>
                    </th>
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
                          <span className="material-symbols-outlined animate-spin">refresh</span> Loading invoices...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-24 text-center">
                        <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6">
                          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-60">receipt_long</span>
                        </div>
                        <h3 className="text-2xl text-on-surface font-bold mb-3">{hasActiveFilters ? 'No matching invoices found' : 'No invoices yet'}</h3>
                        <p className="text-on-surface-variant max-w-md mx-auto text-lg">{hasActiveFilters ? 'Try adjusting your search or filters.' : 'Create your first invoice for this branch.'}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((invoice) => {
                      const isMostRecent = invoice.id === mostRecentInvoiceId;
                      return (
                        <tr key={invoice.id} className="hover:bg-primary/5 transition-colors duration-200">
                          <td className="px-6 py-4 font-semibold text-primary">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {invoice.customer?.customerName?.substring(0, 2).toUpperCase() || 'NA'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-on-surface font-semibold">{invoice.customer?.customerName || 'Unknown'}</span>
                              <span className="text-[11px] text-on-surface-variant/70">{invoice.customer?.companyName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-on-surface-variant mb-1">
                              {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-on-surface">
                            ₹ {invoice.totals?.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="px-6 py-4">
                            {isMostRecent ? (
                              openActionId === invoice.id ? (
                                <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <button onClick={() => handleViewPdf(invoice.id, invoice.invoiceNumber)} className="glass-button-icon p-1 rounded-md transition-all hover:text-blue-400 hover:bg-blue-400/10 tooltip cursor-pointer" title="View">
                                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                                  </button>
                                  <Link href={`/invoices/${invoice.id}/edit`}>
                                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/10 tooltip cursor-pointer" title="Edit">
                                      <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                  </Link>
                                  <button onClick={() => handleOpenPaymentModal(invoice)} className="glass-button-icon p-1 rounded-md transition-all hover:text-purple-400 hover:border-purple-400/30 hover:bg-purple-400/10 tooltip cursor-pointer" title="Add Payment">
                                    <span className="material-symbols-outlined text-[16px]">payments</span>
                                  </button>
                                  <button onClick={() => handleSend(invoice)} disabled={isSendingId === invoice.id} className="glass-button-icon p-1 rounded-md transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 tooltip cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Send">
                                    {isSendingId === invoice.id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">send</span>}
                                  </button>
                                  <button onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)} className="glass-button-icon p-1 rounded-md transition-all hover:text-indigo-400 hover:border-indigo-400/30 hover:bg-indigo-400/10 tooltip cursor-pointer" title="Download PDF">
                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                  </button>
                                  <button onClick={() => handleDelete(invoice.id)} className="glass-button-icon p-1 rounded-md transition-all hover:text-error hover:border-error/30 hover:bg-error/10 tooltip cursor-pointer" title="Delete">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                  <div className="w-px h-4 bg-primary/20 mx-1"></div>
                                  <button
                                    onClick={() => setOpenActionId(null)}
                                    className="glass-button-icon p-1 rounded-md transition-all hover:text-on-surface-variant hover:bg-surface tooltip cursor-pointer" title="Close">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2 animate-in fade-in duration-300">
                                  <button onClick={() => handleViewPdf(invoice.id, invoice.invoiceNumber)} className="glass-button-icon p-1 rounded-md transition-all hover:text-blue-400 hover:bg-blue-400/10 tooltip cursor-pointer" title="View">
                                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                                  </button>
                                  <Link href={`/invoices/${invoice.id}/edit`}>
                                    <button className="glass-button-icon p-1 rounded-md transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/10 tooltip cursor-pointer" title="Edit">
                                      <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                  </Link>
                                  <button onClick={() => handleOpenPaymentModal(invoice)} className="glass-button-icon p-1 rounded-md transition-all hover:text-purple-400 hover:border-purple-400/30 hover:bg-purple-400/10 tooltip cursor-pointer" title="Add Payment">
                                    <span className="material-symbols-outlined text-[16px]">payments</span>
                                  </button>
                                  <button onClick={() => handleSend(invoice)} disabled={isSendingId === invoice.id} className="glass-button-icon p-1 rounded-md transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 tooltip cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Send">
                                    {isSendingId === invoice.id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">send</span>}
                                  </button>
                                  <div className="w-px h-4 bg-primary/20 mx-1"></div>
                                  <button
                                    onClick={() => setOpenActionId(invoice.id)}
                                    className="glass-button-icon p-1 rounded-md transition-all hover:text-primary hover:bg-primary/10 tooltip cursor-pointer" title="More Actions">
                                    <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center justify-end gap-2 animate-in fade-in duration-300">
                                <button onClick={() => handleViewPdf(invoice.id, invoice.invoiceNumber)} className="glass-button-icon p-1 rounded-md transition-all hover:text-blue-400 hover:bg-blue-400/10 tooltip cursor-pointer" title="View">
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                </button>
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                  <button className="glass-button-icon p-1 rounded-md transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/10 tooltip cursor-pointer" title="Edit">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                </Link>
                                <button onClick={() => handleOpenPaymentModal(invoice)} className="glass-button-icon p-1 rounded-md transition-all hover:text-purple-400 hover:border-purple-400/30 hover:bg-purple-400/10 tooltip cursor-pointer" title="Add Payment">
                                  <span className="material-symbols-outlined text-[16px]">payments</span>
                                </button>
                                <button onClick={() => handleSend(invoice)} disabled={isSendingId === invoice.id} className="glass-button-icon p-1 rounded-md transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 tooltip cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Send">
                                  {isSendingId === invoice.id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">send</span>}
                                </button>
                                <button onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)} className="glass-button-icon p-1 rounded-md transition-all hover:text-indigo-400 hover:border-indigo-400/30 hover:bg-indigo-400/10 tooltip cursor-pointer" title="Download PDF">
                                  <span className="material-symbols-outlined text-[16px]">download</span>
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

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-primary/5">
              {isLoadingBranches || loading ? (
                <div className="p-6 text-center text-on-surface-variant">
                  <div className="flex justify-center items-center gap-2">
                    <span className="material-symbols-outlined animate-spin">refresh</span> Loading invoices...
                  </div>
                </div>
              ) : paginatedInvoices.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-60">receipt_long</span>
                  </div>
                  <h3 className="text-xl text-on-surface font-bold mb-2">{hasActiveFilters ? 'No matching invoices found' : 'No invoices yet'}</h3>
                  <p className="text-on-surface-variant text-sm">{hasActiveFilters ? 'Try adjusting your search or filters.' : 'Create your first invoice for this branch.'}</p>
                </div>
              ) : (
                paginatedInvoices.map((invoice) => {
                  const isMostRecent = invoice.id === mostRecentInvoiceId;
                  return (
                    <div key={invoice.id} className="p-5 flex flex-col gap-4 hover:bg-primary/5 transition-colors duration-200">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary text-base">{invoice.invoiceNumber}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {invoice.customer?.customerName?.substring(0, 2).toUpperCase() || 'NA'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-on-surface font-semibold text-sm truncate">{invoice.customer?.customerName || 'Unknown'}</span>
                            <span className="text-[11px] text-on-surface-variant/70 truncate">{invoice.customer?.companyName}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[11px] text-on-surface-variant/70">Total Amount</div>
                          <div className="font-bold text-on-surface text-sm">
                            ₹ {invoice.totals?.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-primary/5">
                        <div className="text-xs text-on-surface-variant">
                          Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>

                        <div className="flex items-center gap-2 self-end flex-wrap">
                          <button onClick={() => handleViewPdf(invoice.id, invoice.invoiceNumber)} className="glass-button-icon p-2 rounded-lg transition-all hover:text-blue-400 hover:bg-blue-400/10 cursor-pointer" title="View">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <Link href={`/invoices/${invoice.id}/edit`}>
                            <button className="glass-button-icon p-2 rounded-lg transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/10 cursor-pointer" title="Edit">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          </Link>
                          <button onClick={() => handleOpenPaymentModal(invoice)} className="glass-button-icon p-2 rounded-lg transition-all hover:text-purple-400 hover:border-purple-400/30 hover:bg-purple-400/10 cursor-pointer" title="Add Payment">
                            <span className="material-symbols-outlined text-[18px]">payments</span>
                          </button>
                          <button onClick={() => handleSend(invoice)} disabled={isSendingId === invoice.id} className="glass-button-icon p-2 rounded-lg transition-all hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Send">
                            {isSendingId === invoice.id ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                          </button>

                          {isMostRecent ? (
                            <>
                              <button onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)} className="glass-button-icon p-2 rounded-lg transition-all hover:text-indigo-400 hover:border-indigo-400/30 hover:bg-indigo-400/10 cursor-pointer" title="Download PDF">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                              </button>
                              <button onClick={() => handleDelete(invoice.id)} className="glass-button-icon p-2 rounded-lg transition-all hover:text-error hover:border-error/30 hover:bg-error/10 cursor-pointer" title="Delete">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)} className="glass-button-icon p-2 rounded-lg transition-all hover:text-indigo-400 hover:border-indigo-400/30 hover:bg-indigo-400/10 cursor-pointer" title="Download PDF">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </button>
                          )}
                        </div>
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
                  {totalCount === 0
                    ? 'Showing 0 entries'
                    : `Showing ${startIndex} to ${endIndex} of ${totalCount} entries`}
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
          </div>

          {/* PDF Viewer Modal */}
          {viewerPdfUrl && (
            <PdfViewerModal
              url={viewerPdfUrl.url}
              title={viewerPdfUrl.title}
              documentId={viewerPdfUrl.id}
              documentType="invoice"
              onClose={closePdfViewer}
              renderActions={(documentId) => {
                const activeInvoice = invoices.find(q => q.id === documentId);
                if (!activeInvoice) return null;
                return (
                  <>
                    <button onClick={() => { closePdfViewer(); handleOpenPaymentModal(activeInvoice as any); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 hover:bg-purple-400/10 hover:text-purple-400 border border-transparent hover:border-purple-400/20 text-on-surface-variant transition-all cursor-pointer tooltip" title="Add Payment">
                      <span className="material-symbols-outlined text-[20px]">payments</span>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 hover:bg-emerald-400/10 hover:text-emerald-400 border border-transparent hover:border-emerald-400/20 text-on-surface-variant transition-all cursor-pointer tooltip" title="Send">
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  </>
                );
              }}
            />
          )}

          {/* Add Payment Modal */}
          {paymentModalOpen && selectedInvoiceForPayment && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-md transition-opacity" onClick={() => setPaymentModalOpen(false)}></div>
              <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95 fade-in duration-200 border border-outline-variant/20">

                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">payments</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">Record Payment</h3>
                      <p className="text-xs text-on-surface-variant">Invoice {selectedInvoiceForPayment.invoiceNumber}</p>
                    </div>
                  </div>
                  <button onClick={() => setPaymentModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-on-surface-variant transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-5">
                  {paymentError && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2">
                      <span className="material-symbols-outlined text-error text-[18px]">error</span>
                      <p className="text-sm text-error font-medium">{paymentError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Amount (₹)</label>
                      <input type="number" step="0.01" max={Number((selectedInvoiceForPayment.totals.grandTotal - selectedInvoiceForPayment.amountPaid).toFixed(2))} value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} className="glass-input px-4 py-2.5 rounded-lg text-sm font-bold text-on-surface w-full" />
                      <p className="text-[10px] text-on-surface-variant mt-1">Max: ₹{(selectedInvoiceForPayment.totals.grandTotal - selectedInvoiceForPayment.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Payment Date</label>
                      <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} className="glass-input px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface w-full" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Payment Method</label>
                      <div className="flex flex-wrap gap-2">
                        {['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'UPI', 'OTHER'].map(method => (
                          <button
                            key={method}
                            onClick={() => setPaymentForm({ ...paymentForm, method })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${paymentForm.method === method
                                ? 'bg-primary/20 text-primary border-primary/50'
                                : 'bg-surface-container border-transparent text-on-surface-variant hover:bg-surface'
                              }`}
                          >
                            {method.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Transaction Note / Reference</label>
                      <input type="text" placeholder="e.g. UPI Ref #12345678" value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} className="glass-input px-4 py-2.5 rounded-lg text-sm text-on-surface w-full" />
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Payment Proof (Optional)</label>
                      {paymentAttachment ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[20px]">
                                {paymentAttachment.type === 'application/pdf' ? 'picture_as_pdf' : 'image'}
                              </span>
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold text-on-surface truncate">{paymentAttachment.name}</p>
                              <p className="text-xs text-on-surface-variant">{(paymentAttachment.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button onClick={() => setPaymentAttachment(null)} className="p-2 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-outline-variant/30 rounded-xl p-4 text-center hover:bg-surface transition-colors relative group cursor-pointer">
                          <span className="material-symbols-outlined text-on-surface-variant text-[24px] mb-1 group-hover:text-primary transition-colors">upload_file</span>
                          <p className="text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">Attach Receipt</p>
                          <input
                            type="file"
                            accept=".pdf,image/jpeg,image/png,image/gif,image/webp,.heic,.heif"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                              const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

                              if (!allowedTypes.includes(file.type) && !isHeic && !file.type.startsWith('image/')) {
                                setPaymentError('Attachment must be a PDF or an Image.');
                                e.target.value = '';
                                return;
                              }

                              if (file.size > 5 * 1024 * 1024) {
                                setPaymentError('Attachment must be less than 5MB.');
                                e.target.value = '';
                                return;
                              }

                              setPaymentError('');
                              if (isHeic || file.type.startsWith('image/')) {
                                try {
                                  const compressed = await compressImage(file);
                                  setPaymentAttachment(compressed);
                                } catch (err) {
                                  setPaymentAttachment(file); // fallback
                                }
                              } else {
                                setPaymentAttachment(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low/30 flex justify-end gap-3">
                  <button onClick={() => setPaymentModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSubmitPayment} disabled={isSubmittingPayment} className="glass-button-primary px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">
                    {isSubmittingPayment ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">check</span>}
                    Save Payment
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Footer Decoration */}
          <footer className="relative z-10 w-full opacity-40 text-center flex items-center justify-center gap-4 mt-8">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
            <p className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              BillTea • Invoices
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
          </footer>
        </div>
      </div>
    </>
  );
}