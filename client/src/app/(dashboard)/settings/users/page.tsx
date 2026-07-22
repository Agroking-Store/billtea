"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { apiFetch, API_BASE } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';

function UserManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    profilePicture: '',
    isActive: true,
    removeProfilePicture: false,
    branches: [] as string[]
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("MANAGER");

  const getImageUrl = (url?: string) => {
    if (!url || url === 'null' || url === 'undefined') return '';
    if (url.startsWith('data:image')) return url;
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

  useEffect(() => {
    fetchData();
    // In a real app we might get the user role from auth context
    // We assume the caller checks or we handle 403 gracefully
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "create" && !loading) {
      handleOpenModal('create');
    }
  }, [searchParams, loading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, branchRes] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/branches')
      ]);

      if (userRes.ok) {
        const uData = await userRes.json();
        setUsers(uData.users || []);
      }
      
      if (branchRes.ok) {
        const bData = await branchRes.json();
        setBranches(bData.branches || []);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: 'create' | 'edit', user?: any) => {
    setFormError("");
    setModalMode(mode);
    setProfilePictureFile(null);
    if (mode === 'edit' && user) {
      setSelectedUserId(user.id);
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        password: '',
        profilePicture: user.profilePicture || '',
        isActive: user.isActive,
        removeProfilePicture: false,
        branches: user.branches?.map((b: any) => b.id) || []
      });
    } else {
      setSelectedUserId(null);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        profilePicture: '',
        isActive: true,
        removeProfilePicture: false,
        branches: []
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBranchToggle = (branchId: string) => {
    setFormData(prev => {
      const exists = prev.branches.includes(branchId);
      if (exists) {
        return { ...prev, branches: prev.branches.filter(id => id !== branchId) };
      } else {
        return { ...prev, branches: [...prev.branches, branchId] };
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string, removeProfilePicture: false }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfilePictureFile(null);
    setFormData(prev => ({ ...prev, profilePicture: '', removeProfilePicture: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('fullName', formData.fullName);
      payload.append('email', formData.email);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('isActive', formData.isActive.toString());
      
      formData.branches.forEach(branchId => {
        payload.append('branches', branchId);
      });
      
      if (modalMode === 'create') {
        if (!formData.password) throw new Error("Password is required for new users.");
        payload.append('password', formData.password);
        payload.append('role', 'MANAGER');
      } else {
        if (formData.password) payload.append('password', formData.password);
        if (formData.removeProfilePicture) payload.append('removeProfilePicture', 'true');
      }
      
      if (profilePictureFile) {
        payload.append('profilePicture', profilePictureFile);
      }

      const url = modalMode === 'create' ? '/users/create' : `/users/${selectedUserId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await apiFetch(url, {
        method,
        body: payload
      });
      
      const data = await res.json();
      if (!res.ok) {
        let msg = data.message || "Operation failed.";
        if (Array.isArray(msg)) msg = msg.join(', ');
        if (res.status === 403) msg = "You must be the OWNER to manage staff.";
        throw new Error(msg);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUserId) return;
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      const res = await apiFetch(`/users/${selectedUserId}`, { method: 'DELETE' });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Only owners can delete users.");
        throw new Error("Failed to delete.");
      }
      setIsModalOpen(false);
      fetchData();
    } catch(err: any) {
      alert(err.message);
    }
  };

  const formatLastLogin = (dateString: string) => {
    if (!dateString) return "Never logged in";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
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
      `}} />

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]" />
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
            <span className="text-primary">Staff Management</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4 tracking-tight">Staff Management</h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">Add team members, assign them to branches, and track their productivity metrics across the organization.</p>
            </div>
            <button onClick={() => handleOpenModal('create')} className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
              <span className="material-symbols-outlined">person_add</span>
              <span>Add New Staff</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-slide-up">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-on-surface-variant font-medium tracking-wide">Loading staff details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
            {users.length === 0 ? (
               <div className="col-span-full py-24 text-center border-2 border-dashed border-outline-variant/30 rounded-[2rem] bg-surface-container/10 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-60">groups</span>
                  </div>
                  <h3 className="text-2xl text-on-surface font-bold mb-3">No staff found</h3>
                  <p className="text-on-surface-variant max-w-md mx-auto text-lg">You haven't added any team members yet.</p>
               </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="group relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8 flex flex-col">
                    {/* User Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-surface-container-low border border-primary/20 shadow-inner flex items-center justify-center overflow-hidden shrink-0">
                          {user.profilePicture ? (
                            <img src={getImageUrl(user.profilePicture)} alt={user.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-black text-primary uppercase">{user.fullName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="pt-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-bold text-on-surface tracking-tight">{user.fullName}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm ${user.role === 'OWNER' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 text-sm text-on-surface-variant font-medium">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">mail</span> {user.email}</span>
                            <span className="hidden sm:block w-1 h-1 rounded-full bg-outline-variant/50 self-center"></span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">call</span> {user.phoneNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Branches Assigned */}
                    <div className="mb-6">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Assigned Branches</p>
                      <div className="flex flex-wrap gap-2">
                        {user.branches?.length > 0 ? (
                          user.branches.map((b: any) => (
                            <div key={b.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface">
                              <span className="material-symbols-outlined text-[16px] text-primary">domain</span>
                              {b.name}
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-on-surface-variant italic">No branches assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 flex-1">
                      {[
                        { label: 'Quotations', count: user._count?.quotationsCreated || 0, icon: 'description', color: 'primary' },
                        { label: 'Invoices', count: user._count?.invoicesCreated || 0, icon: 'receipt_long', color: 'secondary' },
                        { label: 'Customers', count: user._count?.customersCreated || 0, icon: 'groups', color: 'tertiary' },
                        { label: 'Products', count: user._count?.productsCreated || 0, icon: 'inventory_2', color: 'orange-500' },
                        { label: 'Expenses', count: user._count?.expensesCreated || 0, icon: 'payments', color: 'red-500' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-surface-container/40 rounded-2xl p-3 border border-outline-variant/20 flex flex-col gap-1 hover:bg-surface-container/80 transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mb-1
                            ${stat.color === 'primary' ? 'bg-primary/10 text-primary' : ''}
                            ${stat.color === 'secondary' ? 'bg-secondary/10 text-secondary' : ''}
                            ${stat.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : ''}
                            ${stat.color === 'orange-500' ? 'bg-orange-500/10 text-orange-500' : ''}
                            ${stat.color === 'red-500' ? 'bg-red-500/10 text-red-500' : ''}
                          `}>
                            <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                          </div>
                          <p className="text-xl font-bold text-on-surface">{stat.count}</p>
                          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-5 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary/70">history</span>
                        Last Login: {formatLastLogin(user.lastLoginAt)}
                      </div>
                      <button onClick={() => handleOpenModal('edit', user)} className="h-10 w-full sm:w-auto px-5 rounded-xl bg-surface-container hover:bg-primary border border-outline-variant/30 text-on-surface hover:text-on-primary font-bold flex items-center justify-center gap-2 transition-all duration-300">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-fade-slide-up" style={{ animationDuration: '0.4s' }}>
          <div className="bg-surface w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[2rem] relative shadow-2xl shadow-primary/10 border border-outline-variant/20 overflow-hidden">
            
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">{modalMode === 'create' ? 'person_add' : 'manage_accounts'}</span>
                </div>
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-on-surface tracking-tight">{modalMode === 'create' ? 'Add New Staff' : 'Manage Staff Profile'}</h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-medium">{modalMode === 'create' ? 'Create a manager account and assign branches.' : 'Update credentials, status, or branch assignments.'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto bg-surface">
              {formError && (
                <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-4">
                  <span className="material-symbols-outlined mt-0.5 bg-red-500/20 p-1 rounded-full">error</span>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Error</h4>
                    <p className="text-sm opacity-90 leading-relaxed">{formError}</p>
                  </div>
                </div>
              )}

              <form id="staff-form" onSubmit={handleSubmit} className="space-y-10">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">account_circle</span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface uppercase tracking-widest">Personal Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest p-4 sm:p-6 rounded-3xl border border-outline-variant/20">
                    <div className="md:col-span-2 flex items-center gap-6 mb-2">
                      <div className="w-24 h-24 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center overflow-hidden relative group/photo">
                        {formData.profilePicture ? (
                          <img src={getImageUrl(formData.profilePicture)} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">person</span>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          <span className="material-symbols-outlined text-2xl">upload</span>
                        </label>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">Profile Photo (Optional)</p>
                        <div className="flex gap-3 mt-2">
                          <label className="text-xs font-bold bg-primary text-on-primary px-3 py-1.5 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            Upload New
                          </label>
                          {formData.profilePicture && (
                            <button type="button" onClick={handleRemoveImage} className="text-xs font-bold bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-on-surface mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} className="w-full bg-surface-container border-2 border-transparent rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all font-medium" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Email <span className="text-red-500">*</span></label>
                      <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full bg-surface-container border-2 border-transparent rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all font-medium" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Phone Number <span className="text-red-500">*</span></label>
                      <input type="text" name="phoneNumber" required value={formData.phoneNumber} onChange={handleInputChange} className="w-full bg-surface-container border-2 border-transparent rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all font-medium" placeholder="9876543210" />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-on-surface mb-2">
                        {modalMode === 'create' ? 'Password *' : 'Reset Password (Leave blank to keep current)'}
                      </label>
                      <input type="text" name="password" required={modalMode === 'create'} minLength={6} value={formData.password} onChange={handleInputChange} className="w-full bg-surface-container border-2 border-transparent rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all font-medium" placeholder={modalMode === 'create' ? "Set initial password" : "New password"} />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">domain</span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface uppercase tracking-widest">Branch Access</h3>
                  </div>
                  
                  <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-3xl border border-outline-variant/20">
                    <p className="text-sm font-medium text-on-surface-variant mb-4">Select the branches this manager should have access to.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {branches.map(b => (
                        <label key={b.id} onClick={(e) => { e.preventDefault(); handleBranchToggle(b.id); }} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${formData.branches.includes(b.id) ? 'bg-primary/5 border-primary/40' : 'bg-surface-container border-transparent hover:bg-surface-container-high'}`}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${formData.branches.includes(b.id) ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant/50'}`}>
                            {formData.branches.includes(b.id) && <span className="material-symbols-outlined text-[14px]">check</span>}
                          </div>
                          <span className="font-bold text-on-surface text-sm">{b.name}</span>
                        </label>
                      ))}
                      {branches.length === 0 && (
                         <div className="col-span-full p-4 text-center text-on-surface-variant text-sm">No branches available. Create a branch first.</div>
                      )}
                    </div>
                  </div>
                </section>
              </form>
            </div>

            <div className="px-6 py-4 sm:px-8 sm:py-6 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {modalMode === 'edit' && (
                  <button type="button" onClick={handleDelete} className="w-full sm:w-auto px-6 py-4 rounded-xl text-base font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">delete</span> Delete
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-on-surface hover:bg-surface-container-high transition-colors">
                  Cancel
                </button>
                <button type="submit" form="staff-form" disabled={isSubmitting} className="w-full sm:w-auto bg-primary text-on-primary px-10 py-4 rounded-xl text-base font-bold transition-all shadow-lg shadow-primary/30 hover:-translate-y-1 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group">
                  <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                  {isSubmitting ? (
                    <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Saving...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[20px]">save</span> Save Profile</>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-on-surface-variant flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span></div>}>
      <UserManagementContent />
    </Suspense>
  );
}
