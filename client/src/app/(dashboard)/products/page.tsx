'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiFetch, API_BASE } from '../../../lib/auth';
import { useBranch } from '../../../components/BranchProvider';

/* ────────────────────────────────────────────────────────────────────────
   Toast
   ──────────────────────────────────────────────────────────────────────── */

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
        className={`pointer-events-auto relative overflow-hidden flex items-start gap-4 min-w-[320px] max-w-md p-5 rounded-2xl border shadow-2xl backdrop-blur-sm transition-all duration-300 ease-out ${
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
          className={`material-symbols-outlined mt-0.5 p-1 rounded-full shrink-0 ${
            isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}
        >
          {isSuccess ? 'check_circle' : 'error'}
        </span>
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{isSuccess ? 'Success' : 'Error'}</h4>
          <p className="text-sm opacity-90 leading-relaxed whitespace-pre-line">{message?.text}</p>
        </div>
        <button
          onClick={handleClose}
          aria-label="Dismiss notification"
          className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
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

/* ────────────────────────────────────────────────────────────────────────
   Products Page
   ──────────────────────────────────────────────────────────────────────── */

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  hsnNumber: string;
  skuNumber: string;
  image: string;
  isActive: boolean;
};

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

type StatusFilter = 'all' | 'active' | 'inactive';
type PresenceFilter = 'all' | 'with' | 'without';

export default function ProductsPage() {
  const { selectedBranchId, isLoadingBranches } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<'status' | 'hsn' | 'entries' | null>(null);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  const toggleDropdown = (name: 'status' | 'hsn' | 'entries') => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    hsnNumber: '',
    skuNumber: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fetchProducts = async () => {
    try {
      const res = await apiFetch(`/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ---- Table controls: search, sorting, pagination ----
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Filters ----
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hsnFilter, setHsnFilter] = useState<PresenceFilter>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (hsnFilter !== 'all') count++;
    if (minPrice !== '') count++;
    if (maxPrice !== '') count++;
    return count;
  }, [statusFilter, hsnFilter, minPrice, maxPrice]);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setHsnFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  const stats = React.useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const inactive = total - active;
    const avgPrice = total > 0 ? products.reduce((sum, p) => sum + (p.price || 0), 0) / total : 0;
    return { total, active, inactive, avgPrice };
  }, [products]);

  useEffect(() => {
    if (!selectedBranchId) return;

    async function loadProducts() {
      setLoading(true);
      try {
        const res = await apiFetch(`/products?branchId=${selectedBranchId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [selectedBranchId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleOpenCreateModal = () => {
    setEditProductId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      hsnNumber: '',
      skuNumber: '',
    });
    setImageFile(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditProductId(product.id);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      hsnNumber: product.hsnNumber || '',
      skuNumber: product.skuNumber || '',
    });
    setImageFile(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;

    setSaving(true);
    setError(null);

    try {
      const endpoint = editProductId ? `/products/${editProductId}` : '/products';
      const method = editProductId ? 'PUT' : 'POST';

      const payload = new FormData();
      if (!editProductId) {
        payload.append('branchId', selectedBranchId);
      } else {
        payload.append('branchId', selectedBranchId);
      }

      payload.append('name', formData.name);
      if (formData.description) payload.append('description', formData.description);
      payload.append('price', formData.price);
      if (formData.hsnNumber) payload.append('hsnNumber', formData.hsnNumber);
      if (formData.skuNumber) payload.append('skuNumber', formData.skuNumber);

      if (imageFile) {
        payload.append('image', imageFile);
      }

      const res = await apiFetch(endpoint, {
        method,
        body: payload
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (editProductId) {
          setProducts(products.map(p => p.id === editProductId ? data.product : p));
        } else {
          setProducts([data.product, ...products]);
        }
        setToast({ type: 'success', text: editProductId ? 'Product updated successfully!' : 'Product added successfully!' });
        setIsModalOpen(false);
      } else {
        const msg = data.message || 'Failed to save product';
        setError(msg);
        setToast({ type: 'error', text: msg });
      }
    } catch (err) {
      const msg = 'An error occurred while saving.';
      setError(msg);
      setToast({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      const res = await apiFetch(`/products/${productToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(products.filter(p => p.id !== productToDelete));
        setToast({ type: 'success', text: 'Product deleted successfully!' });
        setProductToDelete(null);
      } else {
        setToast({ type: 'error', text: data.message || 'Failed to delete product' });
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: 'Error deleting product' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to format image URL correctly by pointing directly to the backend
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    const baseUrl = API_BASE.replace('/api/v1', '');
    const normalizedPath = imagePath.replace(/\\/g, '/');
    const path = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${baseUrl}${path}`;
  };

  // ---- Search ----
  const searchedProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(query);
      const skuMatch = p.skuNumber?.toLowerCase().includes(query);
      const hsnMatch = p.hsnNumber?.toLowerCase().includes(query);
      const priceMatch = p.price?.toString().includes(query);
      return nameMatch || skuMatch || hsnMatch || priceMatch;
    });
  }, [products, searchQuery]);

  // ---- Filters ----
  const filteredProducts = useMemo(() => {
    const min = minPrice !== '' ? parseFloat(minPrice) : null;
    const max = maxPrice !== '' ? parseFloat(maxPrice) : null;

    return searchedProducts.filter((p) => {
      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'inactive' && p.isActive) return false;

      if (hsnFilter === 'with' && !p.hsnNumber) return false;
      if (hsnFilter === 'without' && p.hsnNumber) return false;

      const price = p.price || 0;
      if (min !== null && !Number.isNaN(min) && price < min) return false;
      if (max !== null && !Number.isNaN(max) && price > max) return false;

      return true;
    });
  }, [searchedProducts, statusFilter, hsnFilter, minPrice, maxPrice]);

  // ---- Sorting ----
  const handleSort = useCallback((key: string) => {
    setCurrentPage(1);
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const sortValue = (row: Product, key: string): string | number => {
    switch (key) {
      case 'name': return row.name || '';
      case 'sku': return row.skuNumber || '';
      case 'hsn': return row.hsnNumber || '';
      case 'price': return row.price || 0;
      case 'status': return row.isActive ? 1 : 0;
      default: return '';
    }
  };

  const sortedProducts = useMemo(() => {
    if (!sortConfig) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      const aVal = sortValue(a, sortConfig.key);
      const bVal = sortValue(b, sortConfig.key);
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProducts, sortConfig]);

  // ---- Pagination ----
  const totalCount = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / entriesPerPage));

  // Clamp currentPage safely without looping
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]); // only run when totalPages changes

  // Reset page when filters/search change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter, hsnFilter, minPrice, maxPrice]);

  // Use safePage for calculations
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = totalCount === 0 ? 0 : (safePage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(safePage * entriesPerPage, totalCount);

  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice((safePage - 1) * entriesPerPage, safePage * entriesPerPage);
  }, [sortedProducts, safePage, entriesPerPage]);


  const handleEntriesPerPageChange = (n: number) => {
    setEntriesPerPage(n);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const renderSortableHeader = (label: string, key: string, align: 'left' | 'right' | 'center' = 'left') => {
    const isActive = sortConfig?.key === key;
    const icon = !isActive ? 'unfold_more' : sortConfig!.direction === 'asc' ? 'expand_less' : 'expand_more';
    const ariaSort = isActive ? (sortConfig!.direction === 'asc' ? 'ascending' : 'descending') : 'none';

    let justify = 'justify-start';
    if (align === 'right') justify = 'justify-end';
    if (align === 'center') justify = 'justify-center';

    return (
      <th
        className={`px-6 py-4 font-semibold tracking-wider cursor-pointer hover:text-primary transition-colors group select-none ${isActive ? 'text-primary' : ''} ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
        scope="col"
        role="columnheader"
        aria-sort={ariaSort as React.AriaAttributes['aria-sort']}
        onClick={() => handleSort(key)}
      >
        <div className={`flex items-center gap-1 ${justify}`}>
          {label}
          <span className={`material-symbols-outlined text-[12px] transition-opacity ${isActive ? 'opacity-100 text-primary' : 'opacity-50 group-hover:opacity-100'}`}>
            {icon}
          </span>
        </div>
      </th>
    );
  };

  const filterInputClass =
    'w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium';
  const filterSelectClass =
    'w-full h-12 pl-4 pr-10 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer font-medium';

  return (
    <>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 relative overflow-x-hidden selection:bg-primary/30 [&::-webkit-scrollbar]:hidden w-full max-w-full min-w-0"
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
        <style jsx global>{`
  * {
    -webkit-tap-highlight-color: transparent !important;
  }
  button, th, select, input, a, tr, td, span, div, [role='button'] {
    -webkit-tap-highlight-color: transparent !important;
    -webkit-touch-callout: none !important;
    outline: none !important;
  }
  th::selection, th *::selection,
  button::selection, button *::selection,
  span::selection {
    background: transparent !important;
  }
  button::-moz-focus-inner {
    border: 0 !important;
  }
  button,
  button:focus,
  button:focus-visible,
  button:active,
  th,
  th:focus,
  th:focus-visible,
  th:active,
  select,
  select:focus,
  select:focus-visible,
  select:active,
  a,
  a:focus,
  a:focus-visible,
  a:active,
  tr,
  tr:focus,
  tr:active,
  td,
  td:focus,
  td:active,
  span,
  span:focus,
  span:active,
  [role='button'],
  [role='button']:focus,
  [role='button']:focus-visible,
  [role='button']:active {
    outline: none !important;
    box-shadow: none !important;
    -webkit-appearance: none;
    appearance: none;
  }
`}</style>

        {/* Premium Background */}
        <div className="fixed inset-0 bg-surface pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-tertiary/10 blur-[120px]"></div>
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-12 pb-16 w-full max-w-full min-w-0">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(125,211,252,0.15)]">
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                Products Management
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
                <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                  Products
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Manage inventory items and services for your branch. Add new products, update prices, and track statuses.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              disabled={!selectedBranchId}
              className="w-full md:w-auto group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center justify-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
              <span className="material-symbols-outlined">add</span>
              <span>New Product</span>
            </button>
          </header>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Products</p>
                <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">inventory_2</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.total}</p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">for this branch</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Active</p>
                <span className="material-symbols-outlined text-emerald-500 p-2 rounded-lg bg-emerald-500/10">task_alt</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.active}</p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">
                {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% of catalog` : 'no data yet'}
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-error/40 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Inactive</p>
                <span className="material-symbols-outlined text-error p-2 rounded-lg bg-error/10">block</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.inactive}</p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">not currently sellable</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-secondary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Average Price</p>
                <span className="material-symbols-outlined text-secondary p-2 rounded-lg bg-secondary/10">payments</span>
              </div>
              <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">
                ₹ {stats.avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant/60 relative z-10">across all products</p>
            </div>
          </div>

          {/* Filters Section */}
          <section
            className="glass-panel rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 animate-fade-slide-up relative z-20 overflow-visible shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]"
            style={{ animationDelay: '0.25s' }}
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
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Active
                </span>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-end gap-4 lg:gap-5 relative z-10 w-full">
              <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1 min-w-[140px] relative">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Min Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-medium">₹</span>
                  <input
                    className="glass-input rounded-xl py-2.5 pl-8 pr-4 text-sm font-medium w-full focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface min-h-[42px] border border-outline-variant/30"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1 min-w-[140px] relative">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Max Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-medium">₹</span>
                  <input
                    className="glass-input rounded-xl py-2.5 pl-8 pr-4 text-sm font-medium w-full focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface min-h-[42px] border border-outline-variant/30"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="dropdown-container flex flex-col gap-1.5 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1 min-w-[140px] relative" style={{ zIndex: activeDropdown === 'status' ? 50 : 10 }}>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Status</label>
                <div className="relative">
                  <button
                    type="button"
                    className="glass-input rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium cursor-pointer w-full focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface text-left flex items-center justify-between min-h-[42px]"
                    onClick={() => toggleDropdown('status')}
                  >
                    <span className="truncate">
                      {statusFilter === 'all' && 'All Status'}
                      {statusFilter === 'active' && 'Active'}
                      {statusFilter === 'inactive' && 'Inactive'}
                    </span>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[18px] transition-transform duration-200 ${activeDropdown === 'status' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'status' && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-surface rounded-xl border border-primary/10 overflow-y-auto max-h-60 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                      <div
                        onMouseDown={() => { setStatusFilter('all'); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${statusFilter === 'all' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                      >
                        All Status
                      </div>
                      <div
                        onMouseDown={() => { setStatusFilter('active'); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${statusFilter === 'active' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                      >
                        Active
                      </div>
                      <div
                        onMouseDown={() => { setStatusFilter('inactive'); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${statusFilter === 'inactive' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                      >
                        Inactive
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="dropdown-container flex flex-col gap-1.5 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1 min-w-[140px] relative" style={{ zIndex: activeDropdown === 'hsn' ? 50 : 10 }}>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">HSN Code</label>
                <div className="relative">
                  <button
                    type="button"
                    className="glass-input rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium cursor-pointer w-full focus:ring-2 focus:ring-primary/20 transition-all bg-surface/50 hover:bg-surface text-left flex items-center justify-between min-h-[42px]"
                    onClick={() => toggleDropdown('hsn')}
                  >
                    <span className="truncate">
                      {hsnFilter === 'all' && 'All Products'}
                      {hsnFilter === 'with' && 'With HSN Code'}
                      {hsnFilter === 'without' && 'Without HSN Code'}
                    </span>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[18px] transition-transform duration-200 ${activeDropdown === 'hsn' ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {activeDropdown === 'hsn' && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-surface rounded-xl border border-primary/10 overflow-y-auto max-h-60 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                      <div
                        onMouseDown={() => { setHsnFilter('all'); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${hsnFilter === 'all' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                      >
                        All Products
                      </div>
                      <div
                        onMouseDown={() => { setHsnFilter('with'); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${hsnFilter === 'with' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                      >
                        With HSN Code
                      </div>
                      <div
                        onMouseDown={() => { setHsnFilter('without'); setActiveDropdown(null); }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${hsnFilter === 'without' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-primary/5'}`}
                      >
                        Without HSN Code
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-auto flex justify-end">
                <button
                  disabled={activeFilterCount === 0}
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
          <div className="glass-panel rounded-3xl overflow-hidden relative z-10 animate-fade-slide-up shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] w-full max-w-full min-w-0" style={{ animationDelay: '0.3s' }}>
            {/* Glow Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            {/* Table Controls */}
            <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
              <div className="dropdown-container flex items-center gap-3 text-sm font-medium text-on-surface-variant relative" style={{ zIndex: activeDropdown === 'entries' ? 50 : 10 }}>
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
              <div className="relative w-full sm:w-auto">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                  className="w-full sm:w-80 bg-surface-container border border-outline-variant/30 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Search products..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* High-Fidelity Data Table */}
            <div className="overflow-x-auto w-full max-w-full">
              <table className="min-w-[800px] w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
                <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low/50 border-b border-primary/10">
                  <tr>
                    {renderSortableHeader('Product Details', 'name')}
                    {renderSortableHeader('SKU', 'sku')}
                    {renderSortableHeader('HSN Code', 'hsn')}
                    {renderSortableHeader('Price', 'price')}
                    {renderSortableHeader('Status', 'status')}
                    <th className="px-6 py-4 font-semibold tracking-wider text-right pr-8" scope="col">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {isLoadingBranches || loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                        <div className="flex justify-center items-center gap-2">
                          <span className="material-symbols-outlined animate-spin">refresh</span> Loading products...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-60">inventory_2</span>
                        </div>
                        <h3 className="text-xl text-on-surface font-bold mb-2">{searchQuery || activeFilterCount > 0 ? 'No matching products found' : 'No products yet'}</h3>
                        <p className="text-on-surface-variant max-w-sm mx-auto text-sm">{searchQuery || activeFilterCount > 0 ? 'Try adjusting your search or filters.' : 'Create your first product for this branch.'}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-primary/5 transition-colors duration-200 group">
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-10 h-10 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface-variant/40 shadow-sm overflow-hidden shrink-0 group-hover:border-primary/30 transition-all">
                              {product.image ? (
                                <img src={getImageUrl(product.image)!} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">{product.name}</div>
                              <div className="text-xs text-on-surface-variant/70 truncate mt-0.5" title={product.description}>
                                {product.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle truncate font-medium">
                          {product.skuNumber || <span className="text-on-surface-variant/40 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 align-middle font-medium">
                          {product.hsnNumber || <span className="text-on-surface-variant/40 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <span className="font-bold text-on-surface">₹ {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {product.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-red-500/10 text-red-500 border-red-500/20">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle text-right pr-8">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenEditModal(product)} className="glass-button-icon p-1.5 rounded-lg transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/10 cursor-pointer" title="Edit">
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => setProductToDelete(product.id)} className="glass-button-icon p-1.5 rounded-lg transition-all hover:text-error hover:border-error/30 hover:bg-error/10 cursor-pointer" title="Delete">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>


            {/* Pagination */}
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                <span className="text-sm text-on-surface-variant">
                  {totalCount === 0 ? 'Showing 0 entries' : `Showing ${startIndex} to ${endIndex} of ${totalCount} entries`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-primary text-on-primary shadow-[0_0_10px_rgba(125,211,252,0.3)]">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface hover:text-on-surface border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              BillTea • Products
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
          </footer>
        </div>

        {/* Delete Confirmation Modal */}
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-fade-slide-up" style={{ animationDuration: '0.3s' }}>
            <div className="bg-surface w-full max-w-md rounded-[2rem] p-8 shadow-2xl shadow-error/10 border border-outline-variant/20 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/50 to-transparent"></div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0 border border-error/20">
                  <span className="material-symbols-outlined text-error text-[24px]">warning</span>
                </div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Delete Product?</h3>
                  <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                    Are you sure you want to delete this product? This will permanently remove the item from your branch inventory. This action cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      onClick={() => setProductToDelete(null)}
                      disabled={isDeleting}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteProduct}
                      disabled={isDeleting}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <><span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> Deleting...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[16px]">delete</span> Delete Product</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-panel w-full max-w-2xl rounded-3xl border border-primary/20 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 relative overflow-hidden">
              {/* Modal Ambient Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="p-6 sm:px-8 sm:pt-8 sm:pb-6 border-b border-primary/10 flex justify-between items-center relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface tracking-tight">{editProductId ? 'Edit Product' : 'New Product'}</h2>
                  <p className="text-sm text-on-surface-variant/80 mt-1">{editProductId ? 'Update inventory item details.' : 'Add a new item to your branch inventory.'}</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error transition-all group cursor-pointer">
                  <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">close</span>
                </button>
              </div>

              <div className="p-6 sm:px-8 overflow-y-auto custom-scrollbar relative z-10">
                {error && (
                  <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                    <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                    <p>{error}</p>
                  </div>
                )}

                <form id="productForm" onSubmit={handleSaveProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">inventory_2</span> Product Name *
                      </label>
                      <input required name="name" value={formData.name} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="e.g. Premium Widget" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">payments</span> Selling Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-medium">₹</span>
                        <input required type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleInputChange} className="glass-input w-full pl-8 pr-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">image</span> Default Product Image
                      </label>
                      {editProductId && products.find(p => p.id === editProductId)?.image && (
                        <div className="flex items-center gap-3 mb-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container shadow-sm">
                          <img src={getImageUrl(products.find(p => p.id === editProductId)?.image || '')!} alt="Current" className="w-10 h-10 rounded-lg object-cover ring-1 ring-outline-variant/30" />
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-on-surface">Current Image Uploaded</span>
                            <span className="text-[11px] font-medium text-on-surface-variant/70">Uploading a new image will replace this one.</span>
                          </div>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleFileChange} className="glass-input w-full text-sm text-on-surface-variant file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all file:cursor-pointer cursor-pointer border border-outline-variant/30 bg-surface-container/50 hover:bg-surface-container p-2" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">qr_code_2</span> SKU Number
                      </label>
                      <input name="skuNumber" value={formData.skuNumber} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="e.g. WDGT-001" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">account_balance</span> HSN / SAC Code
                      </label>
                      <input name="hsnNumber" value={formData.hsnNumber} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="e.g. 84439990" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">notes</span> Description
                    </label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none custom-scrollbar border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container" placeholder="Detailed product description..."></textarea>
                  </div>
                </form>
              </div>

              <div className="p-6 sm:px-8 border-t border-primary/10 flex justify-end gap-4 bg-surface-container/30 relative z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl glass-button text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" form="productForm" disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_0_15px_rgba(125,211,252,0.4)] hover:shadow-[0_0_25px_rgba(125,211,252,0.6)] hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                  {saving ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Saving...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">check_circle</span> Save Product</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}