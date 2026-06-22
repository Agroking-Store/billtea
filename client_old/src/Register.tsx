import React, { useState } from 'react';

interface RegisterProps {
  onBackToLanding: () => void;
  onSwitchToLogin: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Register({ onBackToLanding, onSwitchToLogin, isDark, onToggleTheme }: RegisterProps) {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Validation state
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    // Name Validation
    if (fullName.trim().length < 3) {
      newErrors.fullName = 'Full Name must be at least 3 characters.';
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Mobile Validation (exactly 10 digits, no starting constraints)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    // Password Validation
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    // Simulate API request for registration
    setTimeout(() => {
      setIsLoading(false);
      // Demo validation check
      if (email === 'taken@example.com') {
        setErrors({ email: 'This email is already registered.' });
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSwitchToLogin();
      }, 2500);
    }, 1200);
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col antialiased transition-colors duration-300">
      
      {/* Main Content */}
      <main className="flex-grow flex min-h-screen w-full overflow-hidden bg-background">
        
        {/* Left Side: Registration Card Area */}
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

          {/* Register Card */}
          <div className="w-full max-w-md relative z-10 pt-8 pb-8">
            
            {/* Mobile Logo (Only visible on small screens) */}
            <div className="flex lg:hidden items-center justify-center space-x-3 text-on-surface mb-8">
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
              
              <div className="text-left mb-6">
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-2 tracking-tight">
                  Create Account
                </h2>
                <p className="text-on-surface-variant text-base">
                  Join the Indux portal to manage your business
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="fullName">
                    Full Name
                  </label>
                  <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">person</span>
                    <input
                      id="fullName"
                      type="text"
                      required
                      disabled={isLoading}
                      value={fullName}
                      onChange={(e) => {
                        setErrors(prev => ({ ...prev, fullName: undefined }));
                        setFullName(e.target.value);
                      }}
                      placeholder="Jane Doe"
                      className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 font-body text-sm disabled:opacity-50"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-error text-xs font-medium flex items-center gap-1 mt-1 ml-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">mail</span>
                    <input
                      id="email"
                      type="email"
                      required
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => {
                        setErrors(prev => ({ ...prev, email: undefined }));
                        setEmail(e.target.value);
                      }}
                      placeholder="jane@company.com"
                      className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 font-body text-sm disabled:opacity-50"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-error text-xs font-medium flex items-center gap-1 mt-1 ml-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="mobile">
                    Mobile Number
                  </label>
                  <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                    <span className="text-on-surface-variant text-sm mr-2 select-none">🇮🇳</span>
                    <span className="text-on-surface text-sm font-semibold select-none border-r border-outline-variant/30 pr-3">+91</span>
                    <input
                      id="mobile"
                      type="tel"
                      required
                      disabled={isLoading}
                      value={mobileNumber}
                      onChange={(e) => {
                        setErrors(prev => ({ ...prev, mobileNumber: undefined }));
                        setMobileNumber(e.target.value.replace(/[^0-9]/g, '').substring(0, 10));
                      }}
                      placeholder="Enter 10-digit number"
                      className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 pl-3 font-body text-sm disabled:opacity-50"
                    />
                  </div>
                  {errors.mobileNumber && (
                    <p className="text-error text-xs font-medium flex items-center gap-1 mt-1 ml-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {errors.mobileNumber}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1" htmlFor="password">
                    Password
                  </label>
                  <div className="flex items-center input-container rounded-full overflow-hidden input-glow transition-all duration-300 px-4 py-1.5">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">lock</span>
                    <input
                      id="password"
                      type="password"
                      required
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => {
                        setErrors(prev => ({ ...prev, password: undefined }));
                        setPassword(e.target.value);
                      }}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 font-body text-sm disabled:opacity-50"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-error text-xs font-medium flex items-center gap-1 mt-1 ml-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full glass-panel-elevated btn-login-glow hover:bg-surface-container/60 text-on-surface rounded-full py-3.5 font-semibold text-base flex items-center justify-center space-x-2 mt-6 cursor-pointer border border-primary/30 transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
                  {!isLoading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={onSwitchToLogin}
                  disabled={isLoading}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors duration-300 font-body cursor-pointer disabled:opacity-50"
                >
                  Already have an account? <span className="text-primary border-b border-transparent hover:border-primary pb-0.5 transition-all font-semibold">Login</span>
                </button>
              </div>

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
                <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">Account Created</h3>
                <p className="text-base text-primary font-semibold">Redirecting to login...</p>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Visual Immersive Area */}
        <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 bg-surface-container border-l border-primary/10 overflow-hidden select-none">
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
              Create an account to gain access to your customized billing dashboards, reports, and priority business support.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
