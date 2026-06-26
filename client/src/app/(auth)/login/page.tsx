'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveAuthData, API_BASE } from '../../../lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [loginMobileNumber, setLoginMobileNumber] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginOtp, setLoginOtp] = useState<string[]>(Array(6).fill(''));
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [loginTransitioning, setLoginTransitioning] = useState<boolean>(false);
  const [loginMobileError, setLoginMobileError] = useState<string | null>(null);
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null);
  const [loginOtpError, setLoginOtpError] = useState<string | null>(null);
  const [loginResendStatus, setLoginResendStatus] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const getMaskedNumber = () => {
    if (loginMobileNumber.length < 10) return '';
    return `+91 ${loginMobileNumber.substring(0, 2)}*** ***${loginMobileNumber.substring(8)}`;
  };

  const handleLoginMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMobileError(null);
    setLoginEmailError(null);

    if (loginMethod === 'password') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginEmail)) {
        setLoginEmailError('Please enter a valid email address.');
        return;
      }
      setLoginTransitioning(true);
      setTimeout(() => {
        setLoginStep(2);
        setLoginTransitioning(false);
      }, 300);
      return;
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(loginMobileNumber)) {
      setLoginMobileError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      if (loginMobileNumber === '9999999999') {
        setLoginMobileError('This mobile number has been suspended. Please contact support.');
        return;
      }
      
      setLoginTransitioning(true);
      setTimeout(() => {
        setLoginStep(2);
        setLoginTransitioning(false);
      }, 300);
    }, 1000);
  };

  const handleLoginBack = () => {
    setLoginTransitioning(true);
    setLoginMobileError(null);
    setLoginEmailError(null);
    setLoginOtpError(null);
    setLoginResendStatus(null);
    setTimeout(() => {
      setLoginStep(1);
      setLoginOtp(Array(6).fill(''));
      setLoginPassword('');
      setLoginTransitioning(false);
    }, 300);
  };

  const handleLoginOtpChange = (value: string, index: number) => {
    setLoginOtpError(null);
    const cleaned = value.replace(/[^0-9]/g, '');
    const newOtp = [...loginOtp];
    
    if (cleaned.length > 1) {
      const digits = cleaned.substring(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        if (digits[i]) {
          newOtp[i] = digits[i];
        }
      }
      setLoginOtp(newOtp);
      const targetIndex = Math.min(digits.length, 5);
      otpRefs.current[targetIndex]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setLoginOtp(newOtp);

    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleLoginOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !loginOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginOtpError(null);

    if (loginMethod === 'password') {
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
          setLoginOtpError(data.message || 'Login failed. Please try again.');
          return;
        }

        // Store tokens and user data using updated utility
        saveAuthData(data.accessToken, data.refreshToken, data.user);

        setLoginSuccess(true);
        setTimeout(() => {
          router.push('/home');
        }, 2500);
      } catch (error: any) {
        setLoginLoading(false);
        setLoginOtpError('Unable to connect to server. Please check your connection.');
      }
      return;
    }

    // OTP flow (demo mode)
    const enteredOtp = loginOtp.join('');
    if (enteredOtp.length !== 6) {
      setLoginOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      if (enteredOtp !== '123456') {
        setLoginOtpError('Invalid OTP. Please enter "123456" to log in successfully.');
        return;
      }

      setLoginSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2500);
    }, 1200);
  };

  const handleLoginResendOtp = () => {
    setLoginOtpError(null);
    setLoginResendStatus(null);
    setLoginLoading(true);

    setTimeout(() => {
      setLoginLoading(false);
      setLoginResendStatus('A new 6-digit OTP code has been successfully sent.');
      setTimeout(() => {
        setLoginResendStatus(null);
      }, 4000);
    }, 800);
  };

  useEffect(() => {
    if (loginStep === 2 && !loginTransitioning) {
      otpRefs.current[0]?.focus();
    }
  }, [loginStep, loginTransitioning]);

  return (
    <div className="w-full lg:w-7/12 lg:absolute lg:right-0 lg:top-0 lg:bottom-0 flex items-center justify-center p-6 sm:p-12 z-20">
      <div className="w-full max-w-md animate-fade-in">
        {/* Mobile Logo */}
        <div className="flex lg:hidden items-center justify-center space-x-3 text-on-surface mb-10">
          <img className="h-9 w-9 rounded-xl object-contain border border-primary/20" alt="Indux Logo" src="/logo.jpg" />
          <span className="text-2xl font-display font-semibold text-glow">Indux Technology</span>
        </div>

        <div className="glass-panel-elevated rounded-3xl p-8 sm:p-10 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>
          <div className="text-left mb-8">
            <h2 className="font-headline text-3xl font-bold text-on-surface mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-on-surface-variant text-base">Secure access to your Indux portal</p>
          </div>

          {/* Step 1: Mobile or Email Input View */}
          {loginStep === 1 && (
            <div className={`transition-all duration-300 ${loginTransitioning ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'}`}>
              <form onSubmit={handleLoginMobileSubmit} className="space-y-6">
                {loginMethod === 'otp' ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-on-surface" htmlFor="login-mobile">Mobile Number</label>
                    <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                      <span className="text-on-surface-variant text-sm mr-2 select-none">🇮🇳</span>
                      <span className="text-on-surface text-sm font-semibold select-none border-r border-outline-variant/30 pr-3">+91</span>
                      <input
                        id="login-mobile"
                        type="tel"
                        required
                        disabled={loginLoading}
                        value={loginMobileNumber}
                        onChange={(e) => {
                          setLoginMobileError(null);
                          setLoginMobileNumber(e.target.value.replace(/[^0-9]/g, '').substring(0, 10));
                        }}
                        placeholder="Enter 10-digit number"
                        className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 pl-3 text-sm disabled:opacity-50"
                      />
                    </div>
                    {loginMobileError && (
                      <div className="text-error text-sm font-medium flex items-center gap-1.5 mt-2 animate-fade-in">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{loginMobileError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-on-surface" htmlFor="login-email">Email Address</label>
                    <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                      <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">mail</span>
                      <input
                        id="login-email"
                        type="email"
                        required
                        disabled={loginLoading}
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmailError(null);
                          setLoginEmail(e.target.value);
                        }}
                        placeholder="Enter your email"
                        className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm disabled:opacity-50"
                      />
                    </div>
                    {loginEmailError && (
                      <div className="text-error text-sm font-medium flex items-center gap-1.5 mt-2 animate-fade-in">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{loginEmailError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Login Method Toggle Option */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMobileError(null);
                      setLoginEmailError(null);
                      setLoginMethod(loginMethod === 'otp' ? 'password' : 'otp');
                    }}
                    className="text-xs text-primary font-bold hover:text-primary/80 transition-colors cursor-pointer select-none"
                  >
                    {loginMethod === 'otp' ? 'Login with Password' : 'Login with OTP'}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={loginLoading || (loginMethod === 'otp' ? loginMobileNumber.length !== 10 : !loginEmail)}
                  className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-4 font-semibold text-lg flex items-center justify-center space-x-2 mt-4 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{loginLoading ? 'Processing...' : (loginMethod === 'otp' ? 'Send OTP' : 'Enter Password')}</span>
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
            </div>
          )}

          {/* Step 2: Verification View (OTP or Password) */}
          {loginStep === 2 && (
            <div className={`transition-all duration-300 ${loginTransitioning ? 'opacity-0 translate-x-[20px]' : 'opacity-100 translate-x-0'}`}>
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLoginBack}
                  disabled={loginLoading}
                  className="text-on-surface-variant hover:text-primary transition-colors flex items-center text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                  Back
                </button>
                <span className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
                  {loginMethod === 'otp' ? (
                    <>OTP sent to <span className="text-primary font-bold ml-1">{getMaskedNumber()}</span></>
                  ) : (
                    <>Email: <span className="text-primary font-bold ml-1">{loginEmail}</span></>
                  )}
                </span>
              </div>

              {loginMethod === 'otp' && loginResendStatus && (
                <div className="mb-6 p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>{loginResendStatus}</span>
                </div>
              )}

              <form onSubmit={handleLoginOtpSubmit} className="space-y-6">
                <div className="space-y-3">
                  {loginMethod === 'otp' ? (
                    <div className="flex justify-between gap-2">
                      {loginOtp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpRefs.current[idx] = el; }}
                          type="text"
                          maxLength={1}
                          required
                          disabled={loginLoading}
                          value={digit}
                          onChange={(e) => handleLoginOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleLoginOtpKeyDown(e, idx)}
                          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-headline font-bold text-primary bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all shadow-inner disabled:opacity-50"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="login-pass-input">Password</label>
                      <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5 relative">
                        <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">lock</span>
                        <input
                          id="login-pass-input"
                          type={showLoginPassword ? "text" : "password"}
                          required
                          disabled={loginLoading}
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginOtpError(null);
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
                  )}

                  {loginOtpError && (
                    <div className="text-error text-sm font-medium flex items-center gap-1.5 mt-2 animate-fade-in">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span>{loginOtpError}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <button
                    type="submit"
                    disabled={(loginMethod === 'otp' ? loginOtp.some(digit => !digit) : !loginPassword) || loginLoading}
                    className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-4 font-semibold text-lg flex items-center justify-center space-x-2 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-base">verified_user</span>
                    <span>{loginLoading ? 'Verifying...' : 'Verify & Login'}</span>
                  </button>
                  
                  {loginMethod === 'otp' && (
                    <button
                      type="button"
                      onClick={handleLoginResendOtp}
                      disabled={loginLoading}
                      className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium cursor-pointer disabled:opacity-50"
                    >
                      Didn't receive code? Resend
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Success Overlay */}
          <div className={`absolute inset-0 bg-surface/95 backdrop-blur-2xl flex flex-col items-center justify-center success-overlay shimmer-bg rounded-3xl z-20 ${loginSuccess ? 'active' : ''}`}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(125,211,252,0.3)]">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">Access Granted</h3>
            <p className="text-base text-primary font-semibold">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
