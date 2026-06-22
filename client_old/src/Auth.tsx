import React, { useState, useRef, useEffect } from 'react';

interface AuthProps {
  onBackToLanding: () => void;
  onLoginSuccess: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  initialView?: 'login' | 'signup';
}

export default function Auth({ onBackToLanding, onLoginSuccess, isDark, onToggleTheme, initialView = 'login' }: AuthProps) {
  const [view, setView] = useState<'login' | 'signup'>(initialView);

  // --- LOGIN STATES ---
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

  // --- SIGNUP STATES ---
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

  // --- LOGIN HANDLERS ---
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
      // Password login proceeds to step 2 directly
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
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
          }),
        });

        const data = await response.json();
        setLoginLoading(false);

        if (!response.ok) {
          setLoginOtpError(data.message || 'Login failed. Please try again.');
          return;
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setLoginSuccess(true);
        setTimeout(() => {
          onLoginSuccess();
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
        onBackToLanding();
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

  // --- SIGNUP HANDLERS ---
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
        setView('login');
        // Reset signup inputs
        setSignupFullName('');
        setSignupEmail('');
        setSignupMobileNumber('');
        setSignupPassword('');
      }, 2500);
    }, 1200);
  };

  // Focus the first OTP box when transitioning to Step 2
  useEffect(() => {
    if (loginStep === 2 && !loginTransitioning && view === 'login') {
      otpRefs.current[0]?.focus();
    }
  }, [loginStep, loginTransitioning, view]);

  // Update initial view when prop changes
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col antialiased transition-colors duration-300">
      
      {/* Main Container */}
      <main className="flex-grow flex min-h-screen w-full relative overflow-hidden bg-background">
        
        {/* Background Ambient Effects */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,_rgba(3,105,161,0.05)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(125,211,252,0.05)_0%,_transparent_70%)] pointer-events-none z-0 blur-[60px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.03)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(200,160,240,0.03)_0%,_transparent_70%)] pointer-events-none z-0 blur-[50px]"></div>

        {/* ========================================================
            SLIDING BRANDING CARD (Visible only on desktop lg)
            ======================================================== */}
        <div 
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
          className={`hidden lg:flex lg:w-5/12 absolute top-0 bottom-0 z-30 flex-col justify-between p-12 bg-surface-container overflow-hidden select-none transition-all duration-[750ms] ${
            view === 'signup' 
              ? 'left-[58.333333%] border-l border-primary/10' 
              : 'left-0 border-r border-primary/10'
          }`}
        >
          {/* Animated Ambient Gradients inside card */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/90"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent"></div>
          </div>
          
          {/* Brand Logo & Name */}
          <div className="relative z-10 flex items-center space-x-3 text-on-surface pt-8">
            <img 
              className="h-10 w-10 rounded-xl object-contain shadow-lg shadow-primary/10 border border-primary/20" 
              alt="Indux Logo" 
              src="/logo.jpg" 
            />
            <span className="text-3xl font-display font-semibold tracking-tight text-glow">Indux Technology</span>
          </div>

          {/* Dynamic Tagline Paragraph based on active view */}
          <div className="relative z-10 mb-12">
            <h1 className="font-headline text-5xl font-bold text-on-surface mb-6 leading-tight">
              Secure,<br />
              Simple,<br />
              <span className="text-primary text-glow">Smart.</span>
            </h1>
            <div className="relative h-20 overflow-hidden w-full">
              <p 
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
                className={`text-lg text-on-surface-variant max-w-sm leading-relaxed absolute inset-0 transition-all duration-500 ${
                  view === 'login' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'
                }`}
              >
                Access your personalized dashboard with industry-leading security and streamlined billing workflows.
              </p>
              <p 
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
                className={`text-lg text-on-surface-variant max-w-sm leading-relaxed absolute inset-0 transition-all duration-500 ${
                  view === 'signup' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'
                }`}
              >
                Create an account to gain access to your customized billing dashboards, reports, and priority business support.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            TOP RIGHT NAVIGATION ACTIONS
            ======================================================== */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-12 z-40 flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button 
            onClick={onToggleTheme}
            className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center justify-center bg-surface-container-low hover:bg-surface-container h-10 w-10 rounded-full border border-primary/10 cursor-pointer active:scale-95 shadow-sm"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-lg select-none">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Home Button */}
          <button 
            onClick={onBackToLanding}
            className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center justify-center bg-surface-container-low hover:bg-surface-container h-10 w-10 rounded-full border border-primary/10 cursor-pointer active:scale-95 shadow-sm"
            aria-label="Go Home"
          >
            <span className="material-symbols-outlined text-lg select-none">
              home
            </span>
          </button>

          {/* Support Link */}
          <a 
            className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center space-x-2 bg-surface-container-low hover:bg-surface-container px-4 py-2 rounded-full border border-primary/10 h-10 shadow-sm"
            href="mailto:billaroapp@gmail.com"
          >
            <span className="material-symbols-outlined text-sm">help</span>
            <span className="text-sm font-medium">Support</span>
          </a>
        </div>


        {/* ========================================================
            FORM CARD COLUMNS WITH DYNAMIC FADING
            ======================================================== */}
        <div className="w-full flex relative min-h-screen">
          
          {/* SIGNUP FORM VIEW CONTAINER (Renders on Left side lg col-span-7) */}
          <div 
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
            className={`w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 transition-all duration-700 ${
              view === 'signup' 
                ? 'opacity-100 translate-x-0 z-20' 
                : 'opacity-0 translate-x-[-40px] z-10 pointer-events-none'
            }`}
          >
            <div className="w-full max-w-md">
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
                    onClick={() => setView('login')}
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


          {/* SIGN IN FORM VIEW CONTAINER (Renders on Right side lg col-span-7) */}
          <div 
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
            className={`w-full lg:w-7/12 lg:absolute lg:right-0 lg:top-0 lg:bottom-0 flex items-center justify-center p-6 sm:p-12 transition-all duration-700 ${
              view === 'login' 
                ? 'opacity-100 translate-x-0 z-20' 
                : 'opacity-0 translate-x-[40px] z-10 pointer-events-none'
            }`}
          >
            <div className="w-full max-w-md">
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
                        onClick={() => setView('signup')}
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

        </div>
      </main>
    </div>
  );
}
