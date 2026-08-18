'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveAuthData, API_BASE } from '../../../lib/auth';
import { useTheme } from "@/components/ThemeProvider";
import Image from "next/image";
export default function LoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  // Login States
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Forgot Password States
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(0);

  // Countdown timer for OTP Resend
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();
      setLoginLoading(false);

      if (!response.ok || !data.success) {
        setLoginError(data.message || 'Login failed. Please check your credentials.');
        return;
      }

      saveAuthData(data.accessToken, data.refreshToken, data.user);

      setLoginSuccess(true);
      setTimeout(() => {
        router.push('/home');
      }, 2500);
    } catch (error: any) {
      setLoginLoading(false);
      setLoginError('Unable to connect to server. Please check your connection.');
    }
  };

  // Step 1: Request OTP
  const handleSendForgotPasswordOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();
      setForgotLoading(false);

      if (!response.ok || !data.success) {
        setForgotError(data.message || 'Failed to send OTP. Please check your email.');
        return;
      }

      setForgotSuccessMsg('OTP sent to your email address.');
      setForgotStep(2);
      setResendTimer(60);
    } catch (error: any) {
      setForgotLoading(false);
      setForgotError('Unable to connect to server. Please try again.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit OTP code.');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });

      const data = await response.json();
      setForgotLoading(false);

      if (!response.ok || !data.success) {
        setForgotError(data.message || 'Invalid OTP code.');
        return;
      }

      setForgotSuccessMsg('OTP verified successfully.');
      setForgotStep(3);
    } catch (error: any) {
      setForgotLoading(false);
      setForgotError('Unable to connect to server. Please try again.');
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          newPassword,
        }),
      });

      const data = await response.json();
      setForgotLoading(false);

      if (!response.ok || !data.success) {
        setForgotError(data.message || 'Failed to reset password.');
        return;
      }

      setForgotStep(4);
    } catch (error: any) {
      setForgotLoading(false);
      setForgotError('Unable to connect to server. Please try again.');
    }
  };

  const switchToLogin = () => {
    setIsForgotPasswordMode(false);
    setForgotStep(1);
    setForgotError(null);
    setForgotSuccessMsg(null);
    setLoginError(null);
    if (forgotEmail) {
      setLoginEmail(forgotEmail);
    }
  };

  return (
    <div className="w-full lg:w-7/12 lg:absolute lg:right-0 lg:top-0 lg:bottom-0 flex items-center justify-center p-6 sm:p-12 z-20">
      <div className="w-full max-w-md animate-fade-in">
        {/* Mobile Logo */}
        <div className="flex items-center justify-center space-x-3 text-on-surface mb-10">

  <span className="text-2xl font-display font-semibold text-glow">
    BillTea
  </span>
</div>

        <div className="glass-panel-elevated rounded-3xl p-8 sm:p-10 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>

          {!isForgotPasswordMode ? (
            /* --- NORMAL LOGIN FORM --- */
            <>
              <div className="text-left mb-8">
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-2 tracking-tight">Welcome Back</h2>
                <p className="text-on-surface-variant text-base">Secure access to your BillTea portal</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-on-surface" htmlFor="login-email">
                    Email Address
                  </label>
                  <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">mail</span>
                    <input
                      id="login-email"
                      type="email"
                      required
                      disabled={loginLoading}
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginError(null);
                        setLoginEmail(e.target.value);
                      }}
                      placeholder="Enter your email"
                      className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-on-surface" htmlFor="login-password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(true);
                        setForgotStep(1);
                        setForgotEmail(loginEmail);
                        setForgotError(null);
                      }}
                      className="text-xs font-semibold text-primary hover:underline transition-all cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5 relative">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">lock</span>
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      disabled={loginLoading}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginError(null);
                        setLoginPassword(e.target.value);
                      }}
                      placeholder="Enter your password"
                      className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 pr-10 text-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer select-none"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showLoginPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="text-error text-sm font-medium flex items-center gap-1.5 mt-2 animate-fade-in">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading || !loginEmail || !loginPassword}
                  className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-4 font-semibold text-lg flex items-center justify-center space-x-2 mt-6 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{loginLoading ? 'Signing in...' : 'Sign In'}</span>
                  {!loginLoading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => router.push('/signup')}
                  disabled={loginLoading}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors duration-300 font-body cursor-pointer disabled:opacity-50"
                >
                  Don't have an account? <span className="text-primary border-b border-transparent hover:border-primary pb-0.5 transition-all font-semibold">Sign Up</span>
                </button>
              </div>

              {/* Success Overlay */}
              <div className={`absolute inset-0 bg-surface/95 backdrop-blur-2xl flex flex-col items-center justify-center success-overlay shimmer-bg rounded-3xl z-20 ${loginSuccess ? 'active' : ''}`}>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(125,211,252,0.3)]">
                  <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">Access Granted</h3>
                <p className="text-base text-primary font-semibold">Redirecting to dashboard...</p>
              </div>
            </>
          ) : (
            /* --- FORGOT PASSWORD MULTI-STEP FLOW --- */
            <div className="animate-fade-in">
              {/* Top Navigation / Progress indicator */}
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="flex items-center text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg mr-1">arrow_back</span>
                  Back to Sign In
                </button>
                <div className="flex items-center space-x-1.5 text-xs text-on-surface-variant">
                  <span className={`w-2 h-2 rounded-full ${forgotStep >= 1 ? 'bg-primary' : 'bg-surface-container-high'}`}></span>
                  <span className={`w-2 h-2 rounded-full ${forgotStep >= 2 ? 'bg-primary' : 'bg-surface-container-high'}`}></span>
                  <span className={`w-2 h-2 rounded-full ${forgotStep >= 3 ? 'bg-primary' : 'bg-surface-container-high'}`}></span>
                </div>
              </div>

              {forgotStep === 1 && (
                /* STEP 1: Enter Email */
                <>
                  <div className="text-left mb-6">
                    <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Reset Password</h2>
                    <p className="text-on-surface-variant text-sm">Enter your email address to receive a 6-digit verification code</p>
                  </div>

                  <form onSubmit={handleSendForgotPasswordOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface" htmlFor="forgot-email">
                        Registered Email Address
                      </label>
                      <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                        <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">mail</span>
                        <input
                          id="forgot-email"
                          type="email"
                          required
                          disabled={forgotLoading}
                          value={forgotEmail}
                          onChange={(e) => {
                            setForgotError(null);
                            setForgotEmail(e.target.value);
                          }}
                          placeholder="Enter your email"
                          className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {forgotError && (
                      <div className="text-error text-sm font-medium flex items-center gap-1.5 animate-fade-in">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{forgotError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotEmail}
                      className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-3.5 font-semibold text-base flex items-center justify-center space-x-2 mt-4 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span>{forgotLoading ? 'Sending OTP...' : 'Send Verification Code'}</span>
                      {!forgotLoading && <span className="material-symbols-outlined text-lg">send</span>}
                    </button>
                  </form>
                </>
              )}

              {forgotStep === 2 && (
                /* STEP 2: Verify OTP */
                <>
                  <div className="text-left mb-6">
                    <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Verify Email OTP</h2>
                    <p className="text-on-surface-variant text-sm">
                      Enter the 6-digit code sent to <span className="text-primary font-semibold">{forgotEmail}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyForgotPasswordOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface" htmlFor="forgot-otp">
                        Verification Code (OTP)
                      </label>
                      <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                        <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">pin</span>
                        <input
                          id="forgot-otp"
                          type="text"
                          maxLength={6}
                          required
                          disabled={forgotLoading}
                          value={forgotOtp}
                          onChange={(e) => {
                            setForgotError(null);
                            setForgotOtp(e.target.value.replace(/\D/g, ''));
                          }}
                          placeholder="6-digit code"
                          className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm tracking-widest text-center font-bold text-lg disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {forgotError && (
                      <div className="text-error text-sm font-medium flex items-center gap-1.5 animate-fade-in">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{forgotError}</span>
                      </div>
                    )}

                    {forgotSuccessMsg && (
                      <div className="text-primary text-xs font-medium flex items-center gap-1.5 animate-fade-in">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>{forgotSuccessMsg}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep(1);
                          setForgotError(null);
                        }}
                        className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      >
                        Change Email
                      </button>

                      <button
                        type="button"
                        disabled={resendTimer > 0 || forgotLoading}
                        onClick={() => handleSendForgotPasswordOtp()}
                        className="text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:underline transition-all cursor-pointer"
                      >
                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading || forgotOtp.length !== 6}
                      className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-3.5 font-semibold text-base flex items-center justify-center space-x-2 mt-4 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span>{forgotLoading ? 'Verifying...' : 'Verify Code'}</span>
                      {!forgotLoading && <span className="material-symbols-outlined text-lg">verified</span>}
                    </button>
                  </form>
                </>
              )}

              {forgotStep === 3 && (
                /* STEP 3: Set New Password */
                <>
                  <div className="text-left mb-6">
                    <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Set New Password</h2>
                    <p className="text-on-surface-variant text-sm">Create a new secure password for your account</p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface" htmlFor="new-password">
                        New Password
                      </label>
                      <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5 relative">
                        <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">lock_reset</span>
                        <input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          disabled={forgotLoading}
                          value={newPassword}
                          onChange={(e) => {
                            setForgotError(null);
                            setNewPassword(e.target.value);
                          }}
                          placeholder="Min 6 characters"
                          className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 pr-10 text-sm disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer select-none"
                        >
                          <span className="material-symbols-outlined text-xl">
                            {showNewPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface" htmlFor="confirm-password">
                        Confirm New Password
                      </label>
                      <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5 relative">
                        <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">check_circle</span>
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          disabled={forgotLoading}
                          value={confirmPassword}
                          onChange={(e) => {
                            setForgotError(null);
                            setConfirmPassword(e.target.value);
                          }}
                          placeholder="Re-enter new password"
                          className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 pr-10 text-sm disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer select-none"
                        >
                          <span className="material-symbols-outlined text-xl">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {forgotError && (
                      <div className="text-error text-sm font-medium flex items-center gap-1.5 animate-fade-in">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{forgotError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={forgotLoading || !newPassword || !confirmPassword}
                      className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-3.5 font-semibold text-base flex items-center justify-center space-x-2 mt-4 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span>{forgotLoading ? 'Updating Password...' : 'Reset Password'}</span>
                      {!forgotLoading && <span className="material-symbols-outlined text-lg">key</span>}
                    </button>
                  </form>
                </>
              )}

              {forgotStep === 4 && (
                /* STEP 4: Success View */
                <div className="text-center py-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">Password Reset Complete!</h3>
                  <p className="text-on-surface-variant text-sm mb-6">
                    Your password has been successfully updated. You can now log in with your new credentials.
                  </p>
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-3.5 font-semibold text-base flex items-center justify-center space-x-2 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98"
                  >
                    <span>Sign In Now</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
