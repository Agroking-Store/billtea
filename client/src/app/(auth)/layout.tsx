'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../components/ThemeProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  const isSignup = pathname === '/signup';

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col antialiased transition-colors duration-300">
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
            isSignup
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
                  !isSignup ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'
                }`}
              >
                Access your personalized dashboard with industry-leading security and streamlined billing workflows.
              </p>
              <p 
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
                className={`text-lg text-on-surface-variant max-w-sm leading-relaxed absolute inset-0 transition-all duration-500 ${
                  isSignup ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'
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
            onClick={toggleTheme}
            className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center justify-center bg-surface-container-low hover:bg-surface-container h-10 w-10 rounded-full border border-primary/10 cursor-pointer active:scale-95 shadow-sm"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-lg select-none">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Home Button */}
          <button 
            onClick={() => router.push('/')}
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

        {/* Children Rendered Here (Forms) */}
        {children}
        
      </main>
    </div>
  );
}
