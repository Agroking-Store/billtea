import React from 'react';
import { StepProps } from './types';
import { AlertMessage } from '../../../../components/AlertMessage';

export function OtpVerificationStep({ formData, updateData, errors, clearError }: StepProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-6 text-sm text-on-surface-variant">
        We've sent a 6-digit verification OTP code to <strong>{formData.email}</strong>. Please check your inbox and enter the code below to verify your email.
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Email OTP</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">mark_email_read</span>
          <input
            type="text"
            maxLength={6}
            value={formData.emailOtp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              clearError('emailOtp');
              updateData({ emailOtp: val });
            }}
            placeholder="6-digit code"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm tracking-[0.5em] font-mono"
          />
        </div>
        <AlertMessage message={errors.emailOtp} />
      </div>
    </div>
  );
}
