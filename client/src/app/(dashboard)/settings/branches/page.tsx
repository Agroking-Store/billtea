"use client";

import React, { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../../lib/auth";

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

/* ────────────────────────────────────────────────────────────────────────
   Branch Settings Page
   ──────────────────────────────────────────────────────────────────────── */

function BranchSettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialFormState = {
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    taxes: [{ label: "", value: 0 }] as { label: string, value: number }[],
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    signatureValue: "",
    isActive: true,
    isMainBranch: false,
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchBranches = async () => {
    setLoading(true);
    setPageError("");
    try {
      const res = await apiFetch("/branches?all=true");
      const data = await res.json();
      
      if (!res.ok) {
         let errorMsg = data.message || "Failed to fetch branches.";
         if (Array.isArray(data.message)) errorMsg = data.message.join(", ");
         setPageError(errorMsg);
         return;
      }

      if (data.success) {
        setBranches(data.branches || []);
      } else {
        setPageError(data.message || "Failed to fetch branches.");
      }
    } catch (err: any) {
      setPageError("A network error occurred while fetching branches. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "create" && !loading) {
      openCreateModal();
    }
  }, [searchParams, loading]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedBranchId(null);
    setFormData(initialFormState);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (branch: any) => {
    setModalMode('edit');
    setSelectedBranchId(branch.id);
    setFormData({
      name: branch.name || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      phone: branch.phone || "",
      email: branch.email || "",
      taxes: (Array.isArray(branch.taxes) && branch.taxes.length > 0) ? branch.taxes : [{ label: "", value: 0 }],
      bankName: branch.bankName || "",
      accountNumber: branch.accountNumber || "",
      ifscCode: branch.ifscCode || "",
      upiId: branch.upiId || "",
      signatureValue: branch.signatureValue || "",
      isActive: branch.isActive !== false,
      isMainBranch: branch.isMainBranch || false,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTaxChange = (index: number, field: 'label' | 'value', val: string | number) => {
    const newTaxes = [...formData.taxes];
    newTaxes[index] = { ...newTaxes[index], [field]: field === 'value' ? Number(val) : val };
    setFormData(prev => ({ ...prev, taxes: newTaxes }));
  };

  const addTaxField = () => {
    if (formData.taxes.length < 5) {
      setFormData(prev => ({ ...prev, taxes: [...prev.taxes, { label: "", value: 0 }] }));
    }
  };

  const removeTaxField = (index: number) => {
    const newTaxes = [...formData.taxes];
    newTaxes.splice(index, 1);
    if (newTaxes.length === 0) {
       newTaxes.push({ label: "", value: 0 });
    }
    setFormData(prev => ({ ...prev, taxes: newTaxes }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const url = modalMode === 'create' ? '/branches' : `/branches/${selectedBranchId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        let errorMsg = data.message || "An error occurred.";
        if (Array.isArray(data.message)) {
          errorMsg = data.message.join(", ");
        }
        if (res.status === 403 && errorMsg.includes('Forbidden')) {
           errorMsg = "You do not have permission to perform this action. Only the OWNER can modify branches.";
        }
        throw new Error(errorMsg);
      }

      setToast({ type: 'success', text: modalMode === 'create' ? 'Branch created successfully!' : 'Branch updated successfully!' });
      setIsModalOpen(false);
      
      // Emit global update event so branch providers refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('branch-updated'));
      }
      
      fetchBranches();
    } catch (err: any) {
      const msg = err.message || "Failed to save branch. Ensure you have the required permissions.";
      setFormError(msg);
      setToast({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return;
    
    setPageError("");
    try {
      const res = await apiFetch(`/branches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        let errorMsg = data.message || "Failed to deactivate branch.";
        if (Array.isArray(data.message)) errorMsg = data.message.join(", ");
        if (res.status === 403 && errorMsg.includes('Forbidden')) {
           errorMsg = "You do not have permission to perform this action. Only the OWNER can modify branches.";
        }
        setPageError(errorMsg);
        setToast({ type: 'error', text: errorMsg });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Optimistically remove/update deactivated branch from local list
      setBranches(prev => prev.filter(b => b.id !== id && b._id !== id));
      
      setToast({ type: 'success', text: `${name} was deactivated successfully!` });
      setIsModalOpen(false);

      // Trigger global event so Header / BranchProvider dropdowns refresh immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('branch-updated'));
      }

      fetchBranches();
    } catch (err: any) {
      const msg = "A network error occurred while deactivating branch.";
      setPageError(msg);
      setToast({ type: 'error', text: msg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className="flex-1 overflow-y-auto relative bg-background">
        <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          opacity: 0;
          animation: fadeSlideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .glass-card {
          background: linear-gradient(145deg, rgba(var(--surface-container-rgb), 0.4) 0%, rgba(var(--surface-container-rgb), 0.1) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(var(--outline-variant-rgb), 0.2);
        }
      `}} />

        {/* Decorative Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {/* Header Section */}
          <div className="mb-10 animate-fade-slide-up">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4 font-medium tracking-wide uppercase">
              <button onClick={() => router.back()} className="hover:bg-surface-container p-1 rounded-full transition-colors mr-1 group flex items-center justify-center cursor-pointer" aria-label="Go back">
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              </button>
              <span>Settings</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-primary">Branch Management</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4 tracking-tight">Branches</h1>
                <p className="text-on-surface-variant text-lg leading-relaxed">Manage all your business locations. Add new branches, update details, or deactivate locations that are no longer operational.</p>
              </div>
              <button onClick={openCreateModal} className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                <span className="material-symbols-outlined">add</span>
                <span>Add New Branch</span>
              </button>
            </div>
          </div>

          {/* Global Error Banner */}
          {pageError && (
            <div className="mb-10 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-4 animate-fade-slide-up">
              <span className="material-symbols-outlined mt-0.5 bg-red-500/20 p-1 rounded-full">error</span>
              <div>
                <h4 className="font-bold text-lg mb-1">Operation Failed</h4>
                <p className="text-sm opacity-90 leading-relaxed">{pageError}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-slide-up">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-on-surface-variant font-medium tracking-wide">Loading your branches...</p>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
              {branches.length === 0 ? (
                 <div className="col-span-full py-24 text-center border-2 border-dashed border-outline-variant/30 rounded-[2rem] bg-surface-container/10 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-60">storefront</span>
                    </div>
                    <h3 className="text-2xl text-on-surface font-bold mb-3">No branches found</h3>
                    <p className="text-on-surface-variant max-w-md mx-auto text-lg">You haven't created any branches yet.</p>
                 </div>
              ) : (
                branches.map((branch) => (
                  <div key={branch.id || branch._id} className="group relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8 flex flex-col">
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-bold text-on-surface tracking-tight">{branch.name}</h2>
                            {branch.isMainBranch && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-primary text-on-primary shadow-sm shadow-primary/30">MAIN</span>
                            )}
                            {branch.isActive ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">ACTIVE</span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-red-500/10 text-red-600 border border-red-500/20">INACTIVE</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                            <span className="font-medium">{branch.city || 'N/A'}, {branch.state || 'N/A'}</span>
                          </div>
                        </div>
                        
                        {!branch.isMainBranch && branch.isActive && (
                          <button onClick={() => handleDeactivate(branch.id || branch._id, branch.name)} className="w-12 h-12 rounded-2xl bg-surface-container hover:bg-red-500 text-on-surface-variant hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer" title="Deactivate Branch">
                            <span className="material-symbols-outlined text-[20px]">block</span>
                          </button>
                        )}
                      </div>

                      {/* Stats Section */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-surface-container/40 rounded-2xl p-4 border border-outline-variant/20 flex items-center gap-4 group/stat hover:bg-surface-container/80 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover/stat:scale-110 transition-transform">
                             <span className="material-symbols-outlined text-[20px]">groups</span>
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Customers</p>
                            <p className="text-xl font-bold text-on-surface">{branch._count?.customers || 0}</p>
                          </div>
                        </div>
                        <div className="bg-surface-container/40 rounded-2xl p-4 border border-outline-variant/20 flex items-center gap-4 group/stat hover:bg-surface-container/80 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover/stat:scale-110 transition-transform">
                             <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Invoices</p>
                            <p className="text-xl font-bold text-on-surface">{branch._count?.invoices || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Info List */}
                      <div className="space-y-4 flex-1">
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 text-primary opacity-70">
                            <span className="material-symbols-outlined text-[20px]">call</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{branch.phone || 'N/A'}</p>
                            <p className="text-xs text-on-surface-variant">Phone Number</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 text-primary opacity-70">
                            <span className="material-symbols-outlined text-[20px]">email</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-on-surface truncate">{branch.email || 'N/A'}</p>
                            <p className="text-xs text-on-surface-variant">Email Address</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 text-primary opacity-70">
                            <span className="material-symbols-outlined text-[20px]">home_work</span>
                          </div>
                          <div className="pr-4">
                            <p className="text-sm font-semibold text-on-surface leading-snug">{branch.address || 'N/A'} {branch.pincode ? `- ${branch.pincode}` : ''}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">Full Address</p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="mt-8 pt-6 border-t border-outline-variant/20 flex justify-end">
                        <button onClick={() => openEditModal(branch)} className="h-12 px-6 rounded-xl bg-surface-container hover:bg-primary border border-outline-variant/30 text-on-surface hover:text-on-primary font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          Edit Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Overlay & Container */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-panel w-full max-w-3xl rounded-3xl border border-primary/20 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 relative overflow-hidden">
              {/* Modal Ambient Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="p-6 sm:px-8 sm:pt-8 sm:pb-6 border-b border-primary/10 flex justify-between items-center relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface tracking-tight">{modalMode === 'create' ? 'Create New Branch' : 'Edit Branch'}</h2>
                  <p className="text-sm text-on-surface-variant/80 mt-1">{modalMode === 'create' ? 'Add a new operational location to your company.' : 'Update the details for this location.'}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error transition-all group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">close</span>
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 sm:px-8 overflow-y-auto custom-scrollbar relative z-10">
                
                {/* Form Error Banner */}
                {formError && (
                  <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-4">
                    <span className="material-symbols-outlined mt-0.5 bg-red-500/20 p-1 rounded-full">error</span>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Validation Error</h4>
                      <p className="text-sm opacity-90 leading-relaxed">{formError}</p>
                    </div>
                  </div>
                )}

                <form id="branch-form" onSubmit={handleSubmit} className="space-y-10">
                  
                  {/* Branch Identity */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                      </div>
                      <h3 className="text-base font-bold text-on-surface uppercase tracking-widest">Basic Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest p-4 sm:p-6 rounded-3xl border border-outline-variant/20">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Branch Name *</label>
                        <input 
                          type="text" name="name" required minLength={2}
                          value={formData.name} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. Surat Main Branch"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Phone</label>
                        <input 
                          type="text" name="phone"
                          value={formData.phone} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Email</label>
                        <input 
                          type="email" name="email"
                          value={formData.email} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="branch@company.com"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Location */}
                  <section>
                     <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                      </div>
                      <h3 className="text-base font-bold text-on-surface uppercase tracking-widest">Location & Tax</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest p-4 sm:p-6 rounded-3xl border border-outline-variant/20">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Address Line</label>
                        <input 
                          type="text" name="address"
                          value={formData.address} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="Shop 101, Building Name, Street..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">City</label>
                        <input 
                          type="text" name="city"
                          value={formData.city} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. Surat"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">State</label>
                        <input 
                          type="text" name="state"
                          value={formData.state} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. Gujarat"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Pincode</label>
                        <input 
                          type="text" name="pincode"
                          value={formData.pincode} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. 395007"
                        />
                      </div>
                      <div className="md:col-span-2 mt-4 pt-4 border-t border-outline-variant/20">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-bold text-on-surface">Tax Settings (Max 5)</label>
                          {formData.taxes.length < 5 && (
                            <button 
                              type="button" 
                              onClick={addTaxField}
                              className="text-primary text-sm font-bold flex items-center gap-1 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">add</span> Add Tax
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {formData.taxes.map((tax, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                              <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">Tax Label</label>
                                <input 
                                  type="text" 
                                  value={tax.label} 
                                  onChange={(e) => handleTaxChange(index, 'label', e.target.value)}
                                  className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                                  placeholder="e.g. CGST @ 9%"
                                />
                              </div>
                              <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">Tax Value (%)</label>
                                <div className="relative">
                                  <input 
                                    type="number" min={0} max={100} step="0.01"
                                    value={tax.value} 
                                    onChange={(e) => handleTaxChange(index, 'value', e.target.value)}
                                    className="glass-input w-full px-4 py-3 pr-10 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                                    placeholder="0.00"
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-60">
                                    <span className="font-bold text-sm">%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="pb-1">
                                <button 
                                  type="button" 
                                  onClick={() => removeTaxField(index)}
                                  className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                  aria-label="Remove Tax"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Bank Details (Optional) */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px]">account_balance</span>
                        </div>
                        <h3 className="text-base font-bold text-on-surface uppercase tracking-widest">Bank Details</h3>
                      </div>
                      <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-full">OPTIONAL</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest p-4 sm:p-6 rounded-3xl border border-outline-variant/20">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Bank Name</label>
                        <input 
                          type="text" name="bankName"
                          value={formData.bankName} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. HDFC Bank"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Account Number</label>
                        <input 
                          type="text" name="accountNumber"
                          value={formData.accountNumber} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. 50100200..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">IFSC Code</label>
                        <input 
                          type="text" name="ifscCode"
                          value={formData.ifscCode} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. HDFC0001234"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">UPI ID</label>
                        <input 
                          type="text" name="upiId"
                          value={formData.upiId} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. business@upi"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Signature (Optional) */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px]">draw</span>
                        </div>
                        <h3 className="text-base font-bold text-on-surface uppercase tracking-widest">Signature</h3>
                      </div>
                      <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-full">OPTIONAL</span>
                    </div>
                    <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-3xl border border-outline-variant/20">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Signature Text</label>
                        <input 
                          type="text" name="signatureValue"
                          value={formData.signatureValue} onChange={handleInputChange}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all bg-surface-container/50 hover:bg-surface-container"
                          placeholder="e.g. For Business Name, Authorized Signatory"
                        />
                        <p className="text-sm text-on-surface-variant mt-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          This text will be printed at the bottom of generated invoices/quotations.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Status Settings */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">toggle_on</span>
                      </div>
                      <h3 className="text-base font-bold text-on-surface uppercase tracking-widest">Configuration</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex items-center justify-between cursor-pointer p-6 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container transition-colors group">
                        <div className="pr-4">
                          <p className="font-bold text-on-surface mb-1 text-lg">Main Branch</p>
                          <p className="text-sm text-on-surface-variant">Set as the primary operating branch.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" className="sr-only peer" name="isMainBranch" checked={formData.isMainBranch} onChange={handleInputChange} />
                          <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer p-6 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container transition-colors group">
                        <div className="pr-4">
                          <p className="font-bold text-on-surface mb-1 text-lg">Active Status</p>
                          <p className="text-sm text-on-surface-variant">Enable branch operations.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" className="sr-only peer" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                          <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                        </div>
                      </label>
                    </div>
                  </section>

                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 sm:px-8 border-t border-primary/10 flex justify-between items-center gap-4 bg-surface-container/30 relative z-10">
                <div>
                  {modalMode === 'edit' && !formData.isMainBranch && (
                    <button
                      type="button"
                      onClick={() => selectedBranchId && handleDeactivate(selectedBranchId, formData.name)}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-error hover:bg-error/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Deactivate
                    </button>
                  )}
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl glass-button text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    form="branch-form"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_0_15px_rgba(125,211,252,0.4)] hover:shadow-[0_0_25px_rgba(125,211,252,0.6)] hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Saving...</>
                    ) : (
                      <><span className="material-symbols-outlined text-[18px]">check_circle</span> Save Branch</>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default function BranchSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-on-surface-variant flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span></div>}>
      <BranchSettingsContent />
    </Suspense>
  );
}