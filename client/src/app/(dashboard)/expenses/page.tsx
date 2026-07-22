'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { apiFetch, API_BASE } from '@/lib/auth';
import { useBranch } from '@/components/BranchProvider';

interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { fullName: string } | null;
}

interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory | null;
  paymentMethod: string;
  note: string;
  date: string;
  attachment: string;
  createdBy: { fullName: string } | null;
  createdAt: string;
}

type SortDirection = 'asc' | 'desc';
type SortKey = 'date' | 'amount' | 'paymentMethod' | 'category';
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function ExpensesPage() {
  const { selectedBranchId, isLoadingBranches } = useBranch();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'method' | 'entries' | 'modalMethod' | null>(null);
  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  // Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Category Management Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Attachment Viewer Modal
  const [viewerAttachment, setViewerAttachment] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    paymentMethod: 'Cash',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Combobox State
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ---- Table controls: search, sorting, pagination ----
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Filters ----
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const activeFilterCount = [filterCategory, filterPaymentMethod, filterDateFrom, filterDateTo].filter(
    Boolean
  ).length;

  const clearFilters = () => {
    setFilterCategory('');
    setFilterPaymentMethod('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  useEffect(() => {
  if (selectedBranchId) {
    fetchExpenses();
    fetchCategories();
  } else {
    setExpenses([]);
    setCategories([]);
  }
}, [selectedBranchId]); // dependencies only


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchExpenses = async () => {
  if (!selectedBranchId) {
    setExpenses([]);
    return;
  }
  try {
    const res = await apiFetch(`/expenses?branch=${selectedBranchId}`);
    if (res.ok) {
      const data = await res.json();
      setExpenses(data || []);
    }
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
    setExpenses([]);
  }
};

const fetchCategories = async () => {
  if (!selectedBranchId) {
    setCategories([]);
    return;
  }
  try {
    const res = await apiFetch(`/categories?branch=${selectedBranchId}`);
    if (res.ok) {
      const data = await res.json();
      setCategories(data || []);
    }
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    setCategories([]);
  }
};


  const openNewModal = () => {
    setIsEditMode(false);
    setEditExpenseId(null);
    setFormData({
      amount: '',
      category: '',
      paymentMethod: 'Cash',
      note: '',
      date: new Date().toISOString().split('T')[0],
    });
    setCategorySearch('');
    setAttachmentFile(null);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setIsEditMode(true);
    setEditExpenseId(expense.id);
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category?.name || '',
      paymentMethod: expense.paymentMethod,
      note: expense.note || '',
      date: new Date(expense.date).toISOString().split('T')[0],
    });
    setCategorySearch(expense.category?.name || '');
    setAttachmentFile(null);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.date) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const submitData = new FormData();
      submitData.append('branchId', selectedBranchId!);
      submitData.append('amount', formData.amount);
      submitData.append('category', formData.category);
      submitData.append('paymentMethod', formData.paymentMethod);
      submitData.append('note', formData.note);
      submitData.append('date', formData.date);

      if (attachmentFile) {
        submitData.append('attachment', attachmentFile);
      }

      const url = isEditMode ? `/expenses/${editExpenseId}` : '/expenses';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: submitData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save expense');
      }

      await fetchExpenses();
      await fetchCategories(); // Refresh categories in case a new one was created
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExpenses();
      }
    } catch (err) {
      console.error('Failed to delete expense', err);
    }
  };

  const getAttachmentUrl = (filePath: string) => {
    if (!filePath) return null;
    const baseUrl = API_BASE.replace('/api/v1', '');
    const normalizedPath = filePath.replace(/\\/g, '/');
    const path = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${baseUrl}${path}`;
  };

  const isPdf = (filePath: string) => {
    return filePath.toLowerCase().endsWith('.pdf');
  };

  // --- Category Management ---
  const handleSaveCategory = async (id: string) => {
    try {
      const res = await apiFetch(`/expense-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCategoryName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update category');
      }
      setEditingCategoryId(null);
      await fetchCategories();
      await fetchExpenses(); // Refresh expenses to show updated names
    } catch (err: any) {
      setCategoryError(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await apiFetch(`/expense-categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete category');
      }
      await fetchCategories();
    } catch (err: any) {
      setCategoryError(err.message);
    }
  };

  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  const stats = useMemo(() => {
    const total = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const now = new Date();
    const thisMonthAmount = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      const name = e.category?.name || 'Uncategorized';
      categoryTotals[name] = (categoryTotals[name] || 0) + (e.amount || 0);
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    return { total, totalAmount, thisMonthAmount, topCategory };
  }, [expenses]);

  // ---- Table search + filters ----
  const filteredExpenses = useMemo(() => {
    let result = expenses;

    if (tableSearchQuery) {
      const query = tableSearchQuery.toLowerCase();
      result = result.filter((e) => {
        const categoryMatch = e.category?.name?.toLowerCase().includes(query);
        const noteMatch = e.note?.toLowerCase().includes(query);
        const methodMatch = e.paymentMethod?.toLowerCase().includes(query);
        const amountMatch = e.amount?.toString().includes(query);
        return categoryMatch || noteMatch || methodMatch || amountMatch;
      });
    }

    if (filterCategory) {
      result = result.filter((e) => (e.category?.name || 'Uncategorized') === filterCategory);
    }

    if (filterPaymentMethod) {
      result = result.filter((e) => e.paymentMethod === filterPaymentMethod);
    }

    if (filterDateFrom) {
      const from = new Date(filterDateFrom).getTime();
      result = result.filter((e) => new Date(e.date).getTime() >= from);
    }

    if (filterDateTo) {
      const to = new Date(filterDateTo).getTime() + 86399999; // include the whole "to" day
      result = result.filter((e) => new Date(e.date).getTime() <= to);
    }

    return result;
  }, [expenses, tableSearchQuery, filterCategory, filterPaymentMethod, filterDateFrom, filterDateTo]);

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

  const sortValue = (e: Expense, key: SortKey): string | number => {
    switch (key) {
      case 'date':
        return new Date(e.date).getTime() || 0;
      case 'amount':
        return e.amount || 0;
      case 'paymentMethod':
        return e.paymentMethod || '';
      case 'category':
        return e.category?.name || '';
      default:
        return '';
    }
  };

  const sortedExpenses = useMemo(() => {
    if (!sortConfig) return filteredExpenses;
    return [...filteredExpenses].sort((a, b) => {
      const aVal = sortValue(a, sortConfig.key);
      const bVal = sortValue(b, sortConfig.key);
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredExpenses, sortConfig]);

  // ---- Pagination ----
  const totalCount = sortedExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / entriesPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearchQuery, filterCategory, filterPaymentMethod, filterDateFrom, filterDateTo]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalCount);

  const paginatedExpenses = useMemo(() => {
    return sortedExpenses.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  }, [sortedExpenses, currentPage, entriesPerPage]);

  const handleEntriesPerPageChange = (n: number) => {
    setEntriesPerPage(n);
    setCurrentPage(1);
  };

  const sortHeaderClass = (key: SortKey) =>
    `px-6 py-4 cursor-pointer hover:text-primary transition-colors group select-none ${
      sortConfig?.key === key ? 'text-primary' : ''
    }`;

  const sortIconClass = (key: SortKey) =>
    `material-symbols-outlined text-[12px] transition-opacity ${
      sortConfig?.key === key ? 'opacity-100 text-primary' : 'opacity-50 group-hover:opacity-100'
    }`;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-theme(spacing.16))] bg-background overflow-hidden relative">
      <style dangerouslySetInnerHTML={{__html: `
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
  th, th:focus, th:active {
    outline: none !important;
    box-shadow: none !important;
  }
`}</style>
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 z-0 relative overflow-x-hidden selection:bg-primary/30 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={closeDropdowns}
        />
      )}
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
            <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
            Financial Overview
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
            <span className="text-on-surface">Manage </span>
            <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
              Expenses
            </span>
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Track and manage your branch expenditures.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <button
            onClick={openNewModal}
            disabled={!selectedBranchId}
            className="w-full md:w-auto group relative h-14 px-8 rounded-2xl bg-surface-container-highest border border-primary/20 text-primary font-bold flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_15px_rgba(125,211,252,0.1)] hover:shadow-[0_0_25px_rgba(125,211,252,0.3)] transition-all hover:-translate-y-0.5 hover:border-primary/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 w-full h-full bg-primary/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">add</span>
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Expenses</p>
            <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">receipt_long</span>
          </div>
          <p className="text-3xl font-bold text-on-surface tracking-tight relative z-10">{stats.total}</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-red-500/40 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.15)] hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Spent</p>
            <span className="material-symbols-outlined text-red-500 p-2 rounded-lg bg-red-500/10">payments</span>
          </div>
          <p className="text-3xl font-bold text-red-500 tracking-tight relative z-10 whitespace-nowrap">
            ₹ {stats.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">This Month</p>
            <span className="material-symbols-outlined text-blue-500 p-2 rounded-lg bg-blue-500/10">calendar_month</span>
          </div>
          <p className="text-3xl font-bold text-blue-500 tracking-tight relative z-10 whitespace-nowrap">
            ₹ {stats.thisMonthAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-tertiary/40 hover:shadow-[0_20px_40px_-15px_rgba(200,160,240,0.15)] hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Top Category</p>
            <span className="material-symbols-outlined text-tertiary p-2 rounded-lg bg-tertiary/10">category</span>
          </div>
          <p className="text-2xl font-bold text-tertiary tracking-tight relative z-10 truncate whitespace-nowrap">
            {stats.topCategory ? stats.topCategory[0] : '—'}
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-visible animate-fade-slide-up shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] z-20" style={{ animationDelay: '0.2s' }}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10 text-[20px]">filter_list</span>
              <h2 className="text-xl font-bold text-on-surface">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Category</label>
              <div className={`relative ${activeDropdown === 'category' ? 'z-40' : 'z-30'}`}>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between font-medium cursor-pointer"
                >
                  <span>{filterCategory || 'All categories'}</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
                </button>
                {activeDropdown === 'category' && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto animate-fade-slide-up" style={{ animationDuration: '0.2s' }}>
                    <button
                      type="button"
                      onClick={() => { setFilterCategory(''); setActiveDropdown(null); }}
                      className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                    >
                      All categories
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setFilterCategory(c.name); setActiveDropdown(null); }}
                        className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Payment Method</label>
              <div className={`relative ${activeDropdown === 'method' ? 'z-40' : 'z-30'}`}>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'method' ? null : 'method')}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between font-medium cursor-pointer"
                >
                  <span>{filterPaymentMethod || 'All methods'}</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
                </button>
                {activeDropdown === 'method' && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-fade-slide-up" style={{ animationDuration: '0.2s' }}>
                    <button
                      type="button"
                      onClick={() => { setFilterPaymentMethod(''); setActiveDropdown(null); }}
                      className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                    >
                      All methods
                    </button>
                    {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => { setFilterPaymentMethod(method); setActiveDropdown(null); }}
                        className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 relative z-10">
            <button
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border border-outline-variant/20 hover:border-outline-variant/40 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant disabled:hover:border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[18px]">undo</span>
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {/* Glassmorphic Data Table Container */}
      <div className="glass-panel rounded-3xl overflow-hidden relative z-10 animate-fade-slide-up shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]" style={{ animationDelay: '0.4s' }}>
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        
        <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span>Show</span>
              <div className={`relative ${activeDropdown === 'entries' ? 'z-40' : 'z-30'}`}>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'entries' ? null : 'entries')}
                  className="bg-surface-container border border-outline-variant/30 rounded-xl py-2 px-4 pr-10 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm cursor-pointer hover:bg-surface-container-high transition-all font-semibold flex items-center justify-between min-w-[70px]"
                >
                  <span>{entriesPerPage}</span>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    expand_more
                  </span>
                </button>
                {activeDropdown === 'entries' && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-fade-slide-up" style={{ animationDuration: '0.2s' }}>
                    {[10, 25, 50].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => { handleEntriesPerPageChange(n); setActiveDropdown(null); }}
                        className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span>entries</span>
            </div>
          </div>
          <div className="relative w-full md:w-72 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px] group-focus-within:text-primary transition-colors">search</span>
            <input
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-outline-variant/30 bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              placeholder="Search expenses..."
              type="text"
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
            />
          </div>
        </div>

            {/* High-Fidelity Data Table */}
            <div className="overflow-x-auto w-full">
  <table className="min-w-[700px] text-left border-separate border-spacing-0">
    <thead>
      <tr className="bg-surface-container-low/50 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-primary/10">
        <th
          className={`${sortHeaderClass('date')} px-2 py-2 sm:px-4 sm:py-3 w-[120px] sm:w-1/6`}
          onClick={() => handleSort('date')}
        >
          <div className="flex items-center gap-1">
            Date <span className={sortIconClass('date')}>{getSortIcon('date')}</span>
          </div>
        </th>
        <th
          className={`${sortHeaderClass('amount')} px-2 py-2 sm:px-4 sm:py-3 w-[100px] sm:w-1/6`}
          onClick={() => handleSort('amount')}
        >
          <div className="flex items-center gap-1">
            Amount <span className={sortIconClass('amount')}>{getSortIcon('amount')}</span>
          </div>
        </th>
        <th
          className={`${sortHeaderClass('paymentMethod')} px-2 py-2 sm:px-4 sm:py-3 w-[140px] sm:w-1/6`}
          onClick={() => handleSort('paymentMethod')}
        >
          <div className="flex items-center gap-1">
            Payment Method <span className={sortIconClass('paymentMethod')}>{getSortIcon('paymentMethod')}</span>
          </div>
        </th>
        <th
          className={`${sortHeaderClass('category')} px-2 py-2 sm:px-4 sm:py-3 w-[200px] sm:w-[25%]`}
          onClick={() => handleSort('category')}
        >
          <div className="flex items-center gap-1">
            Category & Note <span className={sortIconClass('category')}>{getSortIcon('category')}</span>
          </div>
        </th>
        <th className="px-2 py-2 sm:px-6 sm:py-4 text-center w-[100px] sm:w-1/6">Attachment</th>
        <th className="px-2 py-2 sm:px-6 sm:py-4 text-right pr-4 sm:pr-8 w-[100px] sm:w-1/6">Actions</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-primary/5 text-xs sm:text-sm break-words">
      {/* keep your loading, empty, and expense rows here unchanged */}
    </tbody>
  </table>
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
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface-container-highest border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-primary text-on-primary shadow-sm">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              BillTea Dashboard • Expenses
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
          </footer>

        </div>
      </div>

      {/* Main Expense Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-fade-slide-up" style={{ animationDuration: '0.3s' }}>
          <div className="absolute inset-0 bg-transparent" onClick={closeModal}></div>
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-visible relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-outline-variant/20 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest rounded-t-3xl shrink-0">
              <h2 className="text-xl font-bold text-on-surface">{isEditMode ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3">
                  <span className="material-symbols-outlined text-error mt-0.5">error</span>
                  <p className="text-sm text-error font-medium">{error}</p>
                </div>
              )}

              <form id="expenseForm" onSubmit={handleSubmit} className="space-y-5 overflow-visible">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount (₹) *</label>
                      <input type="number" step="0.01" name="amount" required value={formData.amount} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-semibold" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date *</label>
                      <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-semibold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 relative" ref={dropdownRef}>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Category *</label>
                      <input
                        type="text"
                        name="category"
                        required
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setFormData({ ...formData, category: e.target.value });
                          setShowCategoryDropdown(true);
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-semibold"
                        placeholder="e.g. Travel, Office"
                        autoComplete="off"
                      />

                      {/* Category Combobox Dropdown */}
                      {showCategoryDropdown && (
                        <div className="absolute top-[100%] left-0 w-full mt-2 bg-surface rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden z-[100] max-h-60 flex flex-col">
                          <div className="overflow-y-auto custom-scrollbar flex-1 bg-surface">
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map(c => (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    setCategorySearch(c.name);
                                    setFormData({ ...formData, category: c.name });
                                    setShowCategoryDropdown(false);
                                  }}
                                  className="px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                                >
                                  {c.name}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-on-surface-variant/70 italic bg-surface-container-lowest/50 border-b border-outline-variant/10">
                                "{categorySearch}" will be created
                              </div>
                            )}
                          </div>
                          <div
                            onClick={() => {
                              setShowCategoryDropdown(false);
                              setIsCategoryModalOpen(true);
                            }}
                            className="px-4 py-3 bg-surface-container-low border-t border-outline-variant/20 text-sm font-bold text-primary hover:bg-surface-container cursor-pointer flex items-center gap-2 transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-[18px]">settings</span>
                            Manage Categories...
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Payment Method *</label>
                      <div className={`relative ${activeDropdown === 'modalMethod' ? 'z-50' : 'z-30'}`}>
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === 'modalMethod' ? null : 'modalMethod')}
                          className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-semibold flex items-center justify-between cursor-pointer text-left h-[42px]"
                        >
                          <span>{formData.paymentMethod}</span>
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
                        </button>
                        {activeDropdown === 'modalMethod' && (
                          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-fade-slide-up" style={{ animationDuration: '0.2s' }}>
                            {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, paymentMethod: method });
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Note (Optional)</label>
                    <textarea name="note" value={formData.note} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm min-h-[80px] resize-none" placeholder="Details about this expense..." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">attach_file</span> Attachment (Img/PDF)
                    </label>
                    {isEditMode && editExpenseId && expenses.find(e => e.id === editExpenseId)?.attachment && (
                      <div className="flex items-center gap-3 mb-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-highest shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">{isPdf(expenses.find(e => e.id === editExpenseId)?.attachment!) ? 'picture_as_pdf' : 'image'}</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[13px] font-bold text-on-surface truncate">Existing attachment</span>
                          <span className="text-[11px] font-medium text-on-surface-variant/70">Upload new to replace</span>
                        </div>
                        <button type="button" onClick={() => setViewerAttachment(expenses.find(e => e.id === editExpenseId)?.attachment!)} className="text-primary hover:underline text-xs font-bold bg-transparent border-none cursor-pointer">View</button>
                      </div>
                    )}
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all file:cursor-pointer cursor-pointer border border-outline-variant/30 rounded-xl bg-surface-container/50" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-end gap-3 rounded-b-3xl shrink-0">
              <button type="button" onClick={closeModal} className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container transition-colors text-sm text-center">
                Cancel
              </button>
              <button type="submit" form="expenseForm" disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:shadow-md hover:shadow-primary/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <><span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> Saving...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">save</span> {isEditMode ? 'Save Changes' : 'Save Expense'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">category</span>
                Manage Expense Categories
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-surface-container-lowest/30">
              {categoryError && (
                <div className="mb-4 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
                  <p className="text-sm text-error font-medium">{categoryError}</p>
                </div>
              )}
<table className="w-full text-left border-separate border-spacing-0 bg-surface border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="px-4 py-3">Category Name</th>
                    <th className="px-4 py-3">Created By</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {categories.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-on-surface-variant">No categories found.</td></tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat.id} className="hover:bg-surface-container-highest/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-on-surface w-1/2">
                          {editingCategoryId === cat.id ? (
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={e => setEditCategoryName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCategory(cat.id); else if (e.key === 'Escape') setEditingCategoryId(null); }}
                            />
                          ) : (
                            cat.name
                          )}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant text-xs">
                          {cat.createdBy?.fullName || 'System'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingCategoryId === cat.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleSaveCategory(cat.id)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Save">
                                <span className="material-symbols-outlined text-[16px]">check</span>
                              </button>
                              <button onClick={() => setEditingCategoryId(null)} className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors" title="Cancel">
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setEditingCategoryId(cat.id); setEditCategoryName(cat.name); setCategoryError(''); }} className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors" title="Delete">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {viewerAttachment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setViewerAttachment(null)}></div>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 flex flex-col h-[85vh] animate-in zoom-in-95 duration-200 border border-outline-variant/10">

            {/* Toolbar */}
            <div className="px-4 py-3 bg-surface-container flex items-center justify-between border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">{isPdf(viewerAttachment) ? 'picture_as_pdf' : 'image'}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-on-surface leading-tight">Attachment Preview</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{viewerAttachment.split('/').pop()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getAttachmentUrl(viewerAttachment)!}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-sm flex items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download File
                </a>
                <button onClick={() => setViewerAttachment(null)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-surface-container-lowest p-6 flex items-center justify-center overflow-auto">
              {isPdf(viewerAttachment) ? (
                <iframe
                  src={getAttachmentUrl(viewerAttachment)!}
                  className="w-full h-full rounded-xl border border-outline-variant/20 shadow-inner bg-white"
                  title="PDF Viewer"
                />
              ) : (
                <img
                  src={getAttachmentUrl(viewerAttachment)!}
                  alt="Attachment"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-outline-variant/10"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}