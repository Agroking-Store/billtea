import React, { useState, useEffect } from 'react';
import { StepProps } from './types';
import { AlertMessage } from '../../../../components/AlertMessage';
import { API_BASE as API_BASE_URL } from '../../../../lib/auth';

export function OtpVerificationStep({ formData, updateData, errors, clearError }: StepProps) {
  const [timer, setTimer] = useState(600); // 10 minutes OTP lifetime
  const [resendCooldown, setResendCooldown] = useState(30); // 30s resend delay
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  // 10-min main expiry countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setResendMsg(null);
    setResendError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phoneNumber: formData.mobileNumber,
        }),
      });

      const data = await res.json();
      setIsResending(false);

      if (!res.ok) {
        setResendError(data.message || 'Failed to resend OTP.');
        return;
      }

      // Reset timers & input
      setTimer(600); // Reset to 10 minutes
      setResendCooldown(30); // Reset 30s cooldown
      clearError('emailOtp');
      setResendMsg('New verification code sent to your email!');
      setTimeout(() => setResendMsg(null), 4000);
    } catch (err) {
      setIsResending(false);
      setResendError('Network error while resending OTP.');
    }
  };

  const isExpired = timer === 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4 text-sm text-on-surface-variant flex flex-col gap-2">
        <div>
          We've sent a 6-digit verification OTP code to <strong>{formData.email}</strong>. Please check your inbox and enter the code below to verify your email.
        </div>
        
        {/* Timer status badge */}
        <div className="flex items-center justify-between pt-2 border-t border-primary/10 text-xs">
          <span className="text-on-surface-variant/80">Code Validity:</span>
          {isExpired ? (
            <span className="flex items-center gap-1 font-semibold text-error bg-error/10 px-2.5 py-1 rounded-full border border-error/20">
              <span className="material-symbols-outlined text-sm">error</span>
              OTP Expired (Please Resend)
            </span>
          ) : (
            <span className="flex items-center gap-1 font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              <span className="material-symbols-outlined text-sm animate-pulse">timer</span>
              Expires in {formatTime(timer)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Email OTP</label>
        <div className={`flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5 transition-all ${isExpired ? 'border-error/50 bg-error/5' : ''}`}>
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

      {/* Resend Status / Messages */}
      {resendMsg && (
        <div className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
          <span>{resendMsg}</span>
        </div>
      )}

      {resendError && (
        <div className="text-xs font-medium text-error bg-error/10 border border-error/20 rounded-xl p-2.5 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{resendError}</span>
        </div>
      )}

      {/* Resend OTP button section */}
      <div className="flex items-center justify-between text-xs pt-2">
        <span className="text-on-surface-variant">Didn't receive the code?</span>
        <button
          type="button"
          disabled={resendCooldown > 0 || isResending}
          onClick={handleResendOtp}
          className="flex items-center gap-1.5 text-primary font-semibold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer transition-all"
        >
          <span className={`material-symbols-outlined text-base ${isResending ? 'animate-spin' : ''}`}>
            refresh
          </span>
          {isResending
            ? 'Resending...'
            : resendCooldown > 0
            ? `Resend OTP in ${resendCooldown}s`
            : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}
