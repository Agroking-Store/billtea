'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib/auth';

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
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-panel rounded-xl p-8 text-center max-w-md">
          <span className="material-symbols-outlined text-error text-4xl mb-4">error</span>
          <p className="text-error font-medium mb-2">Failed to load profile</p>
          <p className="text-on-surface-variant text-sm mb-6">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-6 py-2.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { user, company, branches, allBranches } = profile;

  return (
    <div className="flex-1 overflow-y-auto p-8 z-0 relative overflow-x-hidden selection:bg-primary/30">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(125,211,252,0.05)_0%,_transparent_40%),_radial-gradient(circle_at_80%_80%,_rgba(200,160,240,0.05)_0%,_transparent_40%)] pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-8 pb-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-3">
              <span className="text-on-surface">User </span>
              <span className="bg-gradient-to-br from-primary to-tertiary bg-clip-text text-transparent">Profile</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
              View and manage your personal details, role definitions, and system authorization parameters.
            </p>
          </div>
        </header>

        {/* Save message toast */}
        {saveMessage.text && (
          <div className={`px-4 py-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${
            saveMessage.type === 'success'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-error/10 border-error/30 text-error'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {saveMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {saveMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Header Card */}
          <div className="lg:col-span-4 glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/30 transition-all duration-300 h-full order-1 lg:order-1">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full border-2 border-primary/30 p-1 shadow-[0_0_20px_rgba(125,211,252,0.15)] overflow-hidden bg-surface-container-low">
                  {(editing && editForm.profilePicture ? editForm.profilePicture : user.profilePicture) ? (
                    <img
                      className="w-full h-full rounded-full object-cover"
                      src={(editing && editForm.profilePicture ? editForm.profilePicture : user.profilePicture) as string}
                      alt={user.fullName}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center bg-primary/10">
                      <span className="material-symbols-outlined text-primary text-5xl">person</span>
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-surface-container-highest border border-primary/20 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-on-primary transition-colors">
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
              <h2 className="text-2xl font-bold text-on-surface mb-1">{user.fullName}</h2>
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(125,211,252,0.2)]">
                  {user.role}
                </span>
                {user.role === 'owner' && (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 text-xs font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    Gold Member
                  </span>
                )}
              </div>

            </div>

          {/* Access Records Card */}
          <div className="lg:col-span-4 glass-panel rounded-xl p-6 space-y-4 h-full order-3 lg:order-3">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Access Records</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant mt-1">history</span>
                  <div>
                    <p className="text-xs text-on-surface-variant">Last Login Session</p>
                    <p className="text-sm text-on-surface font-medium">{formatDate(user.lastLoginAt)}</p>
                    <p className="text-[10px] text-on-surface-variant opacity-60">Secure Session Connected</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant mt-1">person_add</span>
                  <div>
                    <p className="text-xs text-on-surface-variant">Created By</p>
                    <p className="text-sm text-on-surface font-medium">
                      {user.createdBy ? user.createdBy.fullName : 'Self-registered'}
                    </p>
                    <p className="text-[10px] text-on-surface-variant opacity-60">
                      Member since {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          {/* Personal Info */}
          <div className="lg:col-span-8 glass-panel rounded-xl p-8 h-full order-2 lg:order-2">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">account_circle</span>
                  Personal Information
                </h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="glass-elevated px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm font-semibold flex items-center gap-2 hover:bg-primary/10 transition-all duration-300 shadow-[0_0_15px_rgba(125,211,252,0.1)] hover:shadow-[0_0_20px_rgba(125,211,252,0.2)] active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit details
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
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
                      className="px-4 py-2 rounded-lg border border-outline-variant/30 text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">save</span>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Full Name</label>
                    <p className="text-on-surface font-medium text-lg">{user.fullName}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Phone Number</label>
                    <p className="text-on-surface font-medium text-lg">{user.phoneNumber}</p>
                  </div>
                  <div className="md:col-span-2 p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Email Address</label>
                    <div className="flex items-center justify-between">
                      <p className="text-on-surface font-medium text-lg">{user.email}</p>
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">VERIFIED</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full bg-transparent text-on-surface font-medium text-lg outline-none border-b border-primary/30 focus:border-primary pb-1 transition-colors"
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      className="w-full bg-transparent text-on-surface font-medium text-lg outline-none border-b border-primary/30 focus:border-primary pb-1 transition-colors"
                      maxLength={10}
                    />
                  </div>
                  <div className="md:col-span-2 p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-transparent text-on-surface font-medium text-lg outline-none border-b border-primary/30 focus:border-primary pb-1 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

          {/* Organization Section */}
          <div className="lg:col-span-8 glass-panel rounded-xl p-8 h-full order-4 lg:order-4">
              <h3 className="text-xl font-bold flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary">corporate_fare</span>
                Organization Details
              </h3>
              <div className="space-y-6">
                {company ? (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Company</label>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">domain</span>
                        </div>
                      )}
                      <div>
                        <p className="text-on-surface font-semibold text-lg">{company.name}</p>
                        <p className="text-on-surface-variant text-xs font-mono">ID: {company.id}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 text-center">
                    <p className="text-on-surface-variant text-sm">No company associated yet.</p>
                  </div>
                )}

                {company && company.identifiers.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Company Identifiers</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {company.identifiers.map((id, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                          <p className="text-xs text-on-surface-variant mb-1">{id.label}</p>
                          <p className="text-on-surface font-medium font-mono text-sm">{id.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user.role === 'staff' && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Assigned Branches</label>
                    <div className="flex flex-wrap gap-3">
                      {allBranches && (
                        <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2 cursor-default">
                          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                          <span className="text-sm font-semibold text-primary">Global Access (All Branches)</span>
                        </div>
                      )}
                      {branches.map((branch) => (
                        <div key={branch._id} className="px-4 py-2 rounded-lg bg-surface-container-highest border border-outline-variant/30 flex items-center gap-2">
                          {branch.isMainBranch && (
                            <span className="material-symbols-outlined text-primary text-sm">home</span>
                          )}
                          <span className="text-sm text-on-surface font-medium">{branch.name}</span>
                          {(branch.city || branch.state) && (
                            <span className="text-xs text-on-surface-variant">
                              — {[branch.city, branch.state].filter(Boolean).join(', ')}
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

        {/* Footer */}
        <div className="mt-16 text-center text-on-surface-variant text-xs opacity-40 uppercase tracking-[0.3em]">
          © 2026 Indux Technology • Secure Environment
        </div>
      </div>


    </div>
  );
}
