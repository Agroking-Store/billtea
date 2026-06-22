import React, { useState, useRef, useEffect } from 'react';

interface LoginProps {
  onBackToLanding: () => void;
  onSwitchToRegister: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Login({ onBackToLanding, onSwitchToRegister, isDark, onToggleTheme }: LoginProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  // New state variables for validation & exception handling
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format mobile number to mask for display: +91 88*** ***52
  const getMaskedNumber = () => {
    if (mobileNumber.length < 10) return '';
    return `+91 ${mobileNumber.substring(0, 2)}*** ***${mobileNumber.substring(8)}`;
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileError(null);

    // Validation: Check if it's a valid 10-digit mobile number
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      setMobileError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    // Simulate API request
    setTimeout(() => {
      setIsLoading(false);
      // Demo validation: block '9999999999' as an invalid/suspended account example
      if (mobileNumber === '9999999999') {
        setMobileError('This mobile number has been suspended. Please contact support.');
        return;
      }
      
      setTransitioning(true);
      setTimeout(() => {
        setStep(2);
        setTransitioning(false);
      }, 300);
    }, 1000);
  };

  const handleBack = () => {
    setTransitioning(true);
    setMobileError(null);
    setOtpError(null);
    setResendStatus(null);
    setTimeout(() => {
      setStep(1);
      setOtp(Array(6).fill(''));
      setTransitioning(false);
    }, 300);
  };

  const handleOtpChange = (value: string, index: number) => {
    setOtpError(null);
    const cleaned = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    
    // If user pasted multiple characters
    if (cleaned.length > 1) {
      const digits = cleaned.substring(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        if (digits[i]) {
          newOtp[i] = digits[i];
        }
      }
      setOtp(newOtp);
      // Focus last filled or last input
      const targetIndex = Math.min(digits.length, 5);
      otpRefs.current[targetIndex]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-focus next input
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    // Simulate OTP verification API
    setTimeout(() => {
      setIsLoading(false);
      // For testing/demo purposes, we accept '123456' as the correct OTP
      if (enteredOtp !== '123456') {
        setOtpError('Invalid OTP. Please enter "123456" to log in successfully.');
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onBackToLanding();
      }, 2500);
    }, 1200);
  };

  const handleResendOtp = () => {
    setOtpError(null);
    setResendStatus(null);
    setIsLoading(true);

    // Simulate OTP resend API request
    setTimeout(() => {
      setIsLoading(false);
      setResendStatus('A new 6-digit OTP code has been successfully sent.');
      // Auto-clear success banner after 4 seconds
      setTimeout(() => {
        setResendStatus(null);
      }, 4000);
    }, 800);
  };

  // Focus the first OTP box when transitioning to Step 2
  useEffect(() => {
    if (step === 2 && !transitioning) {
      otpRefs.current[0]?.focus();
    }
  }, [step, transitioning]);

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col antialiased transition-colors duration-300">
      
      {/* Main Content */}
      <main className="flex-grow flex min-h-screen w-full overflow-hidden bg-background">
        
        {/* Left Side: Visual Immersive Area */}
        <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 bg-surface-container border-r border-primary/10 overflow-hidden select-none">
          {/* Animated Ambient Gradients */}
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

          {/* Tagline */}
          <div className="relative z-10 mb-12">
            <h1 className="font-headline text-5xl font-bold text-on-surface mb-6 leading-tight">
              Secure,<br />
              Simple,<br />
              <span className="text-primary text-glow">Smart.</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-sm leading-relaxed">
              Access your personalized dashboard with industry-leading security and streamlined billing workflows.
            </p>
          </div>
        </div>

        {/* Right Side: Login Card Area */}
        <div className="w-full lg:w-7/12 flex items-center justify-center relative p-6 sm:p-12">
          {/* Header Actions (Theme, Home, Support) */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-12 z-20 flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              onClick={onToggleTheme}
              className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center justify-center bg-surface-container-low hover:bg-surface-container h-10 w-10 rounded-full border border-primary/10 cursor-pointer active:scale-95"
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined text-lg select-none">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Home Button */}
            <button 
              onClick={onBackToLanding}
              className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center justify-center bg-surface-container-low hover:bg-surface-container h-10 w-10 rounded-full border border-primary/10 cursor-pointer active:scale-95"
              aria-label="Go Home"
            >
              <span className="material-symbols-outlined text-lg select-none">
                home
              </span>
            </button>

            {/* Support Link */}
            <a 
              className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center space-x-2 bg-surface-container-low hover:bg-surface-container px-4 py-2 rounded-full border border-primary/10 h-10"
              href="mailto:billaroapp@gmail.com"
            >
              <span className="material-symbols-outlined text-sm">help</span>
              <span className="text-sm font-medium">Support</span>
            </a>
          </div>

          {/* Login Card */}
          <div className="w-full max-w-md relative z-10">
            
            {/* Mobile Logo (Only visible on small screens) */}
            <div className="flex lg:hidden items-center justify-center space-x-3 text-on-surface mb-10">
              <img 
                className="h-9 w-9 rounded-xl object-contain shadow-lg border border-primary/20" 
                alt="Indux Logo" 
                src="/logo.jpg" 
              />
              <span className="text-2xl font-display font-semibold tracking-tight text-glow">Indux Technology</span>
            </div>

            <div className="glass-panel-elevated rounded-3xl p-8 sm:p-10 relative overflow-hidden transition-all duration-300">
              {/* Top Highlight line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>
              
              <div className="text-left mb-8">
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-2 tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-on-surface-variant text-base">
                  Secure access to your Indux portal
                </p>
              </div>

              {/* Step 1: Mobile Input View */}
              {step === 1 && (
                <div className={`transition-all duration-300 ${transitioning ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'}`}>
                  <form onSubmit={handleMobileSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-on-surface" htmlFor="mobile">
                        Mobile Number
                      </label>
                      <div className="flex items-center input-container rounded-2xl overflow-hidden input-glow transition-all duration-300">
                        <div className="flex items-center px-5 py-4 bg-surface-container-low border-r border-outline-variant/30">
                          <span className="text-on-surface-variant text-base mr-2 select-none">🇮🇳</span>
                          <span className="text-on-surface text-base font-semibold select-none">+91</span>
                        </div>
                        <input
                          id="mobile"
                          type="tel"
                          required
                          disabled={isLoading}
                          value={mobileNumber}
                          onChange={(e) => {
                            setMobileError(null);
                            setMobileNumber(e.target.value.replace(/[^0-9]/g, '').substring(0, 10));
                          }}
                          placeholder="Enter 10-digit number"
                          className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none px-5 py-4 font-body tracking-wider text-lg disabled:opacity-50"
                        />
                      </div>
                      
                      {/* Mobile Error Message */}
                      {mobileError && (
                        <div className="text-error text-sm font-medium flex items-center gap-1.5 mt-2 animate-fade-in">
                          <span className="material-symbols-outlined text-base">error</span>
                          <span>{mobileError}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={mobileNumber.length !== 10 || isLoading}
                      className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-4 font-semibold text-lg flex items-center justify-center space-x-2 mt-4 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span>{isLoading ? 'Sending OTP...' : 'Send OTP'}</span>
                      {!isLoading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                    </button>
                  </form>
                  <div className="mt-8 text-center">
                    <button
                      onClick={onSwitchToRegister}
                      disabled={isLoading}
                      className="text-sm text-on-surface-variant hover:text-primary transition-colors duration-300 font-body cursor-pointer disabled:opacity-50"
                    >
                      Don't have an account? <span className="text-primary border-b border-transparent hover:border-primary pb-0.5 transition-all font-semibold">Sign Up</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: OTP Verification View */}
              {step === 2 && (
                <div className={`transition-all duration-300 ${transitioning ? 'opacity-0 translate-x-[20px]' : 'opacity-100 translate-x-0'}`}>
                  <div className="mb-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isLoading}
                      className="text-on-surface-variant hover:text-primary transition-colors flex items-center text-sm font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                      Back
                    </button>
                    <span className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
                      Sent to <span className="text-primary font-bold ml-1">{getMaskedNumber()}</span>
                    </span>
                  </div>

                  {/* Resend Success Message Banner */}
                  {resendStatus && (
                    <div className="mb-6 p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>{resendStatus}</span>
                    </div>
                  )}

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between gap-2">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => { otpRefs.current[idx] = el; }}
                            type="text"
                            maxLength={1}
                            required
                            disabled={isLoading}
                            value={digit}
                            onChange={(e) => handleOtpChange(e.target.value, idx)}
                            onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-headline font-bold text-primary bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all shadow-inner disabled:opacity-50"
                          />
                        ))}
                      </div>

                      {/* OTP Error Message */}
                      {otpError && (
                        <div className="text-error text-sm font-medium flex items-center gap-1.5 mt-2 animate-fade-in">
                          <span className="material-symbols-outlined text-base">error</span>
                          <span>{otpError}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <button
                        type="submit"
                        disabled={otp.some(digit => !digit) || isLoading}
                        className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-4 font-semibold text-lg flex items-center justify-center space-x-2 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <span className="material-symbols-outlined text-base">verified_user</span>
                        <span>{isLoading ? 'Verifying...' : 'Verify & Login'}</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium cursor-pointer disabled:opacity-50"
                      >
                        Didn't receive code? Resend
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Success Overlay */}
              <div 
                className={`absolute inset-0 bg-surface/95 backdrop-blur-2xl flex flex-col items-center justify-center success-overlay shimmer-bg rounded-3xl z-20 ${
                  isSuccess ? 'active' : ''
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(125,211,252,0.3)]">
                  <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">Access Granted</h3>
                <p className="text-base text-primary font-semibold">Redirecting to dashboard...</p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
