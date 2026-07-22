'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/auth';

interface BranchInfo {
  _id: string;
  name: string;
  isMainBranch: boolean;
  city?: string;
  state?: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  logo: string;
  identifiers: { label: string; value: string }[];
}

interface ProfileData {
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    profilePicture: string;
    role: 'owner' | 'manager' | 'staff';
    isActive: boolean;
    lastLoginAt: string | null;
    createdBy: { fullName: string; email: string } | null;
    createdAt: string;
  };
  company: CompanyInfo | null;
  branches: BranchInfo[];
  allBranches: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phoneNumber: '', profilePicture: '' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });



  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/profile');
      const data = await res.json();
      if (data.success) {
        setProfile(data);
        setEditForm({
          fullName: data.user.fullName,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber,
          profilePicture: data.user.profilePicture || '',
        });
      } else {
        setError(data.message || 'Failed to load profile.');
      }
    } catch (err) {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage({ type: '', text: '' });
    try {
      const res = await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        if (res.status === 413) throw new Error('Payload too large.');
        throw new Error('Invalid response from server.');
      }

      if (data.success) {
        // Update localStorage with the new user data so sidebar reflects changes
        localStorage.setItem('user', JSON.stringify(data.user));
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditing(false);
        await fetchProfile();
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Update failed.' });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to connect to server.' });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: add max size validation (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Image must be less than 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setSaving(true);
      setSaveMessage({ type: '', text: '' });
      try {
        const res = await apiFetch('/profile', {
          method: 'PUT',
          body: JSON.stringify({ profilePicture: base64String }),
        });
        let data;
        try {
          data = await res.json();
        } catch (e) {
          if (res.status === 413) throw new Error('Image size is too large for the server to process.');
          throw new Error('Invalid response from server.');
        }

        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setSaveMessage({ type: 'success', text: 'Profile picture updated!' });
          await fetchProfile();
        } else {
          setSaveMessage({ type: 'error', text: data.message || 'Update failed.' });
        }
      } catch (err: any) {
        setSaveMessage({ type: 'error', text: err.message || 'Failed to connect to server.' });
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };


  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-on-surface-variant font-medium tracking-wide">Loading profile...</p>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex flex-col items-center gap-4 text-center max-w-md">
          <span className="material-symbols-outlined bg-red-500/20 p-4 rounded-full text-4xl">error</span>
          <div>
            <h4 className="font-bold text-xl mb-2">Failed to load profile</h4>
            <p className="text-sm opacity-90 leading-relaxed mb-6">{error}</p>
            <button
              onClick={fetchProfile}
              className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all cursor-pointer shadow-lg shadow-red-500/20"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user, company, branches, allBranches } = profile;

  return (
    <div className="flex-1 overflow-y-auto relative bg-background selection:bg-primary/30">
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
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-12">
        {/* Header */}
        <div className="mb-10 animate-fade-slide-up">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4 font-medium tracking-wide uppercase">
            <button onClick={() => router.back()} className="hover:bg-surface-container p-1 rounded-full transition-colors mr-1 group flex items-center justify-center cursor-pointer" aria-label="Go back">
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            </button>
            <span>Settings</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary">User Profile</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4 tracking-tight">Profile</h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                View and manage your personal details, role definitions, and system authorization parameters.
              </p>
            </div>
          </div>
        </div>

        {/* Save message toast */}
        {saveMessage.text && (
          <div className={`mb-10 p-5 rounded-2xl border flex items-start gap-4 animate-fade-slide-up ${saveMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
            : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
            <span className={`material-symbols-outlined mt-0.5 p-1 rounded-full ${saveMessage.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {saveMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <div>
              <h4 className="font-bold text-lg mb-1">{saveMessage.type === 'success' ? 'Success' : 'Error'}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{saveMessage.text}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Profile Header Card */}
          <div className="lg:col-span-4 group relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-surface-container p-1 shadow-lg overflow-hidden bg-surface-container-low">
                  {(editing && editForm.profilePicture ? editForm.profilePicture : user.profilePicture) ? (
                    <img
                      className="w-full h-full rounded-full object-cover"
                      src={(editing && editForm.profilePicture ? editForm.profilePicture : user.profilePicture)}
                      alt={user.fullName}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center bg-primary/10">
                      <span className="material-symbols-outlined text-primary text-5xl">person</span>
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-primary border-2 border-surface text-on-primary flex items-center justify-center cursor-pointer hover:scale-110 shadow-lg transition-transform">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureUpload}
                    disabled={saving}
                  />
                </label>
              </div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">{user.fullName}</h2>
              <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20">
                  {user.role}
                </span>
                {user.role === 'owner' && (
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                    Gold Member
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Access Records Card */}
          <div className="lg:col-span-4 group relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full order-3 lg:order-3">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8 space-y-6 flex flex-col">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                Access Records
              </h3>
              <div className="space-y-6 flex-1">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">history</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1">Last Login Session</p>
                    <p className="text-sm text-on-surface font-semibold">{formatDate(user.lastLoginAt)}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Secure Session Connected</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1">Created By</p>
                    <p className="text-sm text-on-surface font-semibold">
                      {user.createdBy ? user.createdBy.fullName : 'Self-registered'}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Member since {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="lg:col-span-8 group relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full order-2 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3 text-on-surface">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">account_circle</span>
                  </div>
                  Personal Information
                </h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full sm:w-auto h-12 px-6 rounded-xl bg-surface-container hover:bg-primary border border-outline-variant/30 text-on-surface hover:text-on-primary font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit details
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditForm({
                          fullName: user.fullName,
                          email: user.email,
                          phoneNumber: user.phoneNumber,
                          profilePicture: user.profilePicture || '',
                        });
                        setSaveMessage({ type: '', text: '' });
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full sm:w-auto bg-primary text-on-primary px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-primary/40 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">save</span>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Full Name</label>
                    <p className="text-on-surface font-semibold text-lg">{user.fullName}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Phone Number</label>
                    <p className="text-on-surface font-semibold text-lg">{user.phoneNumber}</p>
                  </div>
                  <div className="md:col-span-2 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Email Address</label>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-on-surface font-semibold text-lg">{user.email}</p>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold tracking-widest uppercase">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full bg-surface-container border-2 border-transparent rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      className="w-full bg-surface-container border-2 border-transparent rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      maxLength={10}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-on-surface mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-surface-container border-2 border-transparent rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Organization Section */}
          <div className="lg:col-span-8 group relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full order-4 lg:order-4">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
              <h3 className="text-xl font-bold flex items-center gap-3 text-on-surface mb-8">
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                </div>
                Organization Details
              </h3>
              
              <div className="space-y-8">
                {company ? (
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Company</label>
                    <div className="flex items-center gap-5 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-14 h-14 rounded-xl object-cover border border-outline-variant/30" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/30">
                          <span className="material-symbols-outlined text-on-surface-variant text-2xl">domain</span>
                        </div>
                      )}
                      <div>
                        <p className="text-on-surface font-bold text-xl">{company.name}</p>
                        <p className="text-on-surface-variant text-xs font-mono mt-0.5">ID: {company.id}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/50 text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50 mb-3">domain_disabled</span>
                    <p className="text-on-surface-variant font-medium">No company associated yet.</p>
                  </div>
                )}

                {company && company.identifiers.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Company Identifiers</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {company.identifiers.map((id, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                          <p className="text-sm font-semibold text-on-surface-variant">{id.label}</p>
                          <p className="text-on-surface font-bold font-mono bg-surface-container px-3 py-1 rounded-lg">{id.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user.role === 'staff' && (
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Assigned Branches</label>
                    <div className="flex flex-wrap gap-3">
                      {allBranches && (
                        <div className="px-5 py-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2.5 cursor-default">
                          <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                          <span className="text-sm font-bold text-primary">Global Access (All Branches)</span>
                        </div>
                      )}
                      {branches.map((branch) => (
                        <div key={branch._id} className="px-5 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-2.5">
                          {branch.isMainBranch && (
                            <span className="material-symbols-outlined text-primary text-[18px]">home</span>
                          )}
                          <span className="text-sm text-on-surface font-bold">{branch.name}</span>
                          {(branch.city || branch.state) && (
                            <span className="text-xs text-on-surface-variant font-medium border-l border-outline-variant/30 pl-2 ml-1">
                              {[branch.city, branch.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-on-surface-variant text-xs opacity-40 uppercase tracking-[0.3em] font-bold">
          © 2026 Indux Technology • Secure Environment
        </div>
      </div>
    </div>
  );
}
