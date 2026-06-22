'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  const [signupFullName, setSignupFullName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupMobileNumber, setSignupMobileNumber] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [signupErrors, setSignupErrors] = useState<{
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    password?: string;
  }>({});
  const [signupLoading, setSignupLoading] = useState<boolean>(false);
  const [signupSuccess, setSignupSuccess] = useState<boolean>(false);

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof signupErrors = {};

    if (signupFullName.trim().length < 3) {
      newErrors.fullName = 'Full Name must be at least 3 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(signupMobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    if (signupPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setSignupErrors(newErrors);
      return;
    }

    setSignupErrors({});
    setSignupLoading(true);

    setTimeout(() => {
      setSignupLoading(false);
      if (signupEmail === 'taken@example.com') {
        setSignupErrors({ email: 'This email is already registered.' });
        return;
      }

      setSignupSuccess(true);
      setTimeout(() => {
        setSignupSuccess(false);
        router.push('/login');
      }, 2500);
    }, 1200);
  };

  return (
    <div className="w-full lg:w-7/12 lg:absolute lg:left-0 lg:top-0 lg:bottom-0 flex items-center justify-center p-6 sm:p-12 z-20">
      <div className="w-full max-w-md animate-fade-in">
        {/* Mobile Logo */}
        <div className="flex lg:hidden items-center justify-center space-x-3 text-on-surface mb-8">
          <img className="h-9 w-9 rounded-xl object-contain border border-primary/20" alt="Indux" src="/logo.jpg" />
          <span className="text-2xl font-display font-semibold text-glow">Indux Technology</span>
        </div>

        <div className="glass-panel-elevated rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>
          <div className="text-left mb-6">
            <h2 className="font-headline text-3xl font-bold text-on-surface mb-2 tracking-tight">Create Account</h2>
            <p className="text-on-surface-variant text-base">Join the Indux portal to manage your business</p>
          </div>

          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="signup-name">Full Name</label>
              <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
                <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">person</span>
                <input
                  id="signup-name"
                  type="text"
                  required
                  disabled={signupLoading}
                  value={signupFullName}
                  onChange={(e) => {
                    setSignupErrors(prev => ({ ...prev, fullName: undefined }));
                    setSignupFullName(e.target.value);
                  }}
                  placeholder="Jane Doe"
                  className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm disabled:opacity-50"
                />
              </div>
              {signupErrors.fullName && (
                <p className="text-error text-xs font-medium flex items-center gap-1 mt-1 ml-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {signupErrors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="signup-email">Email Address</label>
              <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
                <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">mail</span>
                <input
                  id="signup-email"
                  type="email"
                  required
                  disabled={signupLoading}
                  value={signupEmail}
                  onChange={(e) => {
                    setSignupErrors(prev => ({ ...prev, email: undefined }));
                    setSignupEmail(e.target.value);
                  }}
                  placeholder="jane@company.com"
                  className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm disabled:opacity-50"
                />
              </div>
              {signupErrors.email && (
                <p className="text-error text-xs font-medium flex items-center gap-1 mt-1 ml-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {signupErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="signup-mobile">Mobile Number</label>
              <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
                <span className="text-on-surface-variant text-sm mr-2 select-none">🇮🇳</span>
                <span className="text-on-surface text-sm font-semibold select-none border-r border-outline-variant/30 pr-3">+91</span>
                <input
                  id="signup-mobile"
                  type="tel"
                  required
                  disabled={signupLoading}
                  value={signupMobileNumber}
                  onChange={(e) => {
                    setSignupErrors(prev => ({ ...prev, mobileNumber: undefined }));
                    setSignupMobileNumber(e.target.value.replace(/[^0-9]/g, '').substring(0, 10));
                  }}
                  placeholder="Enter 10-digit number"
                  className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 pl-3 text-sm disabled:opacity-50"
                />
              </div>
              {signupErrors.mobileNumber && (
                <p className="text-error text-xs font-medium flex items-center gap-1 mt-1 ml-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {signupErrors.mobileNumber}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="signup-pass">Password</label>
              <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5 relative">
                <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">lock</span>
                <input
                  id="signup-pass"
                  type={showSignupPassword ? "text" : "password"}
                  required
                  disabled={signupLoading}
                  value={signupPassword}
                  onChange={(e) => {
                    setSignupErrors(prev => ({ ...prev, password: undefined }));
                    setSignupPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 pr-10 text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-4 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showSignupPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {signupErrors.password && (
                <p className="text-error text-xs font-medium flex items-center gap-1 mt-1 ml-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {signupErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={signupLoading}
              className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-3.5 font-semibold text-base flex items-center justify-center space-x-2 mt-6 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>{signupLoading ? 'Creating Account...' : 'Sign Up'}</span>
              {!signupLoading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/login')}
              disabled={signupLoading}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors duration-300 font-body cursor-pointer disabled:opacity-50"
            >
              Already have an account? <span className="text-primary border-b border-transparent hover:border-primary pb-0.5 transition-all font-semibold">Login</span>
            </button>
          </div>

          {/* Success Overlay */}
          <div className={`absolute inset-0 bg-surface/95 backdrop-blur-2xl flex flex-col items-center justify-center success-overlay shimmer-bg rounded-3xl z-20 ${signupSuccess ? 'active' : ''}`}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(125,211,252,0.3)]">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">Account Created</h3>
            <p className="text-base text-primary font-semibold">Redirecting to login...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
