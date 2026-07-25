import React, { useState } from 'react';
import { StepProps } from './types';
import { AlertMessage } from '../../../../components/AlertMessage';

export function BasicDetailsStep({ formData, updateData, errors, clearError }: StepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Email Address</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">mail</span>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => { clearError('email'); updateData({ email: e.target.value }); }}
            placeholder="you@company.com"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
        <AlertMessage message={errors.email} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Mobile Number</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <div className="flex items-center border-r border-outline-variant/30 pr-3 mr-3">
            <span className="text-sm font-medium text-on-surface-variant">+91</span>
          </div>
          <input
            type="text"
            maxLength={10}
            value={formData.mobileNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              clearError('mobileNumber');
              updateData({ mobileNumber: val });
            }}
            placeholder="10-digit number"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
        <AlertMessage message={errors.mobileNumber} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Password</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">lock</span>
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => { clearError('password'); updateData({ password: e.target.value }); }}
            placeholder="Min. 6 characters"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none">
            <span className="material-symbols-outlined text-xl select-none">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        <AlertMessage message={errors.password} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Confirm Password</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">lock</span>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => { clearError('confirmPassword'); updateData({ confirmPassword: e.target.value }); }}
            placeholder="Re-enter password"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="ml-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none">
            <span className="material-symbols-outlined text-xl select-none">
              {showConfirm ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        <AlertMessage message={errors.confirmPassword} />
      </div>
    </div>
  );
}
