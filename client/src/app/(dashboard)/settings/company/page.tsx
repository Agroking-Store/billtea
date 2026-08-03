"use client";

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, API_BASE } from '@/lib/auth';
import { useRouter } from 'next/navigation';

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
   Company Settings Page
   ──────────────────────────────────────────────────────────────────────── */

const getImageUrl = (url?: string) => {
  if (!url || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('/uploads')) {
    const baseUrl = API_BASE.replace('/api/v1', '');
    return `${baseUrl}${url}`;
  }
  if (url.startsWith('uploads/')) {
    const baseUrl = API_BASE.replace('/api/v1', '');
    return `${baseUrl}/${url}`;
  }
  return url;
};

export default function CompanySettingsPage() {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [editTagline, setEditTagline] = useState("");
  const [editUniqueIdName, setEditUniqueIdName] = useState("");
  const [editUniqueIdValue, setEditUniqueIdValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/company');
      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
        setEditName(data.company.name || "");

        const ids = data.company.identifiers || [];
        const taglineObj = ids.find((i: any) => i.label === 'TAGLINE' || i.key === 'TAGLINE');
        setEditTagline(taglineObj ? taglineObj.value : "");

        const uniqueIdObj = ids.find((i: any) => (i.label || i.key) && (i.label !== 'TAGLINE' && i.key !== 'TAGLINE'));
        if (uniqueIdObj) {
          setEditUniqueIdName(uniqueIdObj.label || uniqueIdObj.key || "");
          setEditUniqueIdValue(uniqueIdObj.value || "");
        } else {
          setEditUniqueIdName("");
          setEditUniqueIdValue("");
        }
      }
    } catch (err) {
      console.error('Failed to fetch company', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const newIdentifiers = [];
      if (editTagline.trim()) {
        newIdentifiers.push({ label: 'TAGLINE', value: editTagline.trim() });
      }
      if (editUniqueIdName.trim() && editUniqueIdValue.trim()) {
        newIdentifiers.push({ label: editUniqueIdName.trim(), value: editUniqueIdValue.trim() });
      }

      const payload: any = {
        name: editName,
        identifiers: newIdentifiers
      };
      if (editLogo !== null) payload.logo = editLogo;

      const res = await apiFetch('/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsEditing(false);
        setEditLogo(null);
        setToast({ type: 'success', text: 'Company profile updated successfully!' });
        fetchCompany();
      } else {
        const errorData = await res.json().catch(() => null);
        console.error("Backend error:", res.status, errorData);
        if (res.status === 413) {
          setToast({ type: 'error', text: 'Image is too large. Please upload a smaller image.' });
        } else {
          setToast({ type: 'error', text: `Failed to save changes: ${errorData?.message || res.statusText || 'Make sure you have OWNER permissions.'}` });
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      setToast({ type: 'error', text: 'Error saving changes. Please check console for details.' });
    } finally {
      setIsSaving(false);
    }
  };

  const location = company?.branches?.[0] ? `${company.branches[0].city}, ${company.branches[0].state}` : 'Location Not Set';

  // Display variables
  const displayTagline = company?.identifiers?.find((i: any) => i.label === 'TAGLINE' || i.key === 'TAGLINE')?.value || '';
  const displayIdentifiers = company?.identifiers?.filter((i: any) => i.label !== 'TAGLINE' && i.key !== 'TAGLINE') || [];

  const isActive = company?.subscription?.status === 'ACTIVE' || company?.subscription?.status === 'TRIAL';

  return (
    <>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className="flex-1 overflow-y-auto relative bg-background">
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
              <button onClick={() => router.back()} className="hover:bg-surface-container p-1 rounded-full transition-colors mr-1 group flex items-center justify-center" aria-label="Go back">
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              </button>
              <span>Settings</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-primary">Company Profile</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4 tracking-tight">Company Profile</h1>
                <p className="text-on-surface-variant text-lg leading-relaxed">Manage your core business details, global configurations, and view company-wide statistics.</p>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditName(company?.name || "");
                      setEditLogo(null);
                      setEditTagline(company?.identifiers?.find((i: any) => i.label === 'TAGLINE' || i.key === 'TAGLINE')?.value || "");
                      setIsEditing(false);
                    }}
                    className="h-14 px-6 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                    {isSaving ? (
                      <><span className="material-symbols-outlined animate-spin">progress_activity</span><span>Saving...</span></>
                    ) : (
                      <><span className="material-symbols-outlined">save</span><span>Save Changes</span></>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                  <span className="material-symbols-outlined">edit</span><span>Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-slide-up">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-on-surface-variant font-medium tracking-wide">Loading company details...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>

              {/* Identity Card Wrapper */}
              <div className="group relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">

                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-32 h-32 rounded-[2rem] p-2 bg-gradient-to-br from-primary/20 to-surface-container-low border border-primary/20 shadow-inner flex items-center justify-center overflow-hidden shrink-0 relative group/logo">
                      {editLogo || company?.logo ? (
                        <img
                          className="w-full h-full rounded-2xl object-cover"
                          alt={company?.name || "Company Logo"}
                          src={editLogo || getImageUrl(company.logo)}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[48px] text-primary/50">corporate_fare</span>
                      )}
                      {isEditing && (
                        <>
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity text-white rounded-2xl cursor-pointer z-10">
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            <span className="material-symbols-outlined text-3xl">upload</span>
                          </label>
                          {(editLogo || company?.logo) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditLogo("");
                                setCompany(company ? { ...company, logo: "" } : null);
                              }}
                              className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600 transition-colors z-20 hover:scale-110 opacity-0 group-hover/logo:opacity-100 cursor-pointer"
                              title="Remove Logo"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="text-center md:text-left space-y-3 mt-2">
                      <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-3xl font-bold tracking-tight bg-surface-container border border-primary/40 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20 w-full max-w-sm"
                            autoFocus
                          />
                        ) : (
                          <h2 className="text-3xl font-bold text-on-surface tracking-tight">{company?.name || 'Company Name'}</h2>
                        )}
                        {isActive ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">ACTIVE</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-red-500/10 text-red-600 border border-red-500/20">INACTIVE</span>
                        )}
                      </div>

                      <div className="min-h-[24px]">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 w-full max-w-md">
                            <input
                              type="text"
                              maxLength={100}
                              value={editTagline}
                              onChange={(e) => setEditTagline(e.target.value)}
                              placeholder="Company Tagline (e.g. Smart Billing Solutions)"
                              className="text-sm font-medium text-on-surface bg-surface-container border border-primary/40 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-full"
                            />
                            <span className="text-[10px] font-bold text-on-surface-variant ml-1">{editTagline.length}/100 characters</span>
                          </div>
                        ) : (
                          displayTagline && (
                            <p className="text-base text-on-surface-variant font-medium italic">
                              "{displayTagline}"
                            </p>
                          )
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-on-surface-variant font-medium mt-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                          <span>{location}</span>
                        </div>
                        <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-outline-variant/50 mt-2"></div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-secondary">business_center</span>
                          <span>Business Account</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Metrics Row Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { title: 'Branches', count: company?._count?.branches || 0, icon: 'domain', color: 'primary' },
                  { title: 'Customers', count: company?._count?.customers || 0, icon: 'groups', color: 'secondary' },
                  { title: 'Staff Users', count: company?._count?.users || 0, icon: 'badge', color: 'tertiary' },
                  { title: 'Products', count: company?._count?.products || 0, icon: 'inventory_2', color: 'orange-500' }
                ].map((stat, i) => (
                  <div key={i} className="group relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                    <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-inner 
                      ${stat.color === 'primary' ? 'bg-primary/10 text-primary border border-primary/20' : ''}
                      ${stat.color === 'secondary' ? 'bg-secondary/10 text-secondary border border-secondary/20' : ''}
                      ${stat.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : ''}
                      ${stat.color === 'orange-500' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : ''}
                    `}>
                        <span className="material-symbols-outlined text-[28px]">{stat.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{stat.title}</p>
                        <p className="text-3xl font-black text-on-surface">{stat.count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Business Details Configuration Form */}
              <div className="bg-surface border border-outline-variant/30 rounded-[2rem] p-1">
                <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-on-surface tracking-tight">Business Details</h3>
                        <p className="text-sm text-on-surface-variant font-medium">Core identifiers and registration info</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Readonly Basic */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface">Company ID</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          defaultValue={company?.id || ""}
                          className="w-full bg-surface-container border-2 border-transparent rounded-xl pl-5 pr-12 py-4 text-on-surface font-mono opacity-80"
                        />
                        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant/50">lock</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface">Created By</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          defaultValue={company?.createdBy?.fullName || ""}
                          className="w-full bg-surface-container border-2 border-transparent rounded-xl pl-5 pr-12 py-4 text-on-surface opacity-80 font-medium"
                        />
                        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant/50">person</span>
                      </div>
                    </div>

                    {/* Dynamic Identifiers */}
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-on-surface">Unique Id Name</label>
                          <input
                            type="text"
                            value={editUniqueIdName}
                            onChange={(e) => setEditUniqueIdName(e.target.value)}
                            placeholder="e.g. GSTIN, Registration No."
                            className="w-full bg-surface-container border border-primary/40 focus:ring-2 focus:ring-primary/20 rounded-xl px-5 py-4 text-on-surface font-medium outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-on-surface">Unique ID Number</label>
                          <input
                            type="text"
                            value={editUniqueIdValue}
                            onChange={(e) => setEditUniqueIdValue(e.target.value)}
                            placeholder="e.g. 29ABCDE1234F1Z5"
                            className="w-full bg-surface-container border border-primary/40 focus:ring-2 focus:ring-primary/20 rounded-xl px-5 py-4 text-on-surface font-mono uppercase font-medium outline-none transition-all"
                          />
                        </div>
                      </>
                    ) : (
                      displayIdentifiers.map((ident: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <label className="block text-sm font-bold text-on-surface capitalize">{(ident.label || ident.key || '').replace(/_/g, ' ')}</label>
                          <div className="relative group">
                            <input
                              type="text"
                              readOnly
                              defaultValue={ident.value}
                              className="w-full bg-surface-container border-2 border-transparent rounded-xl px-5 py-4 text-on-surface font-mono uppercase opacity-80 transition-all font-medium"
                            />
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
      </div>
    </>
  );
}