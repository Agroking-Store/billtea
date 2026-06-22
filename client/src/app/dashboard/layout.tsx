'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../components/ThemeProvider';
import Link from 'next/link';
import { isLoggedIn } from '../../lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState({ fullName: 'Sarang Wagh', email: 'admin@indux.com' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        // use default
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex overflow-hidden antialiased transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 border-outline-variant/30 glass-panel flex flex-col h-screen z-20 transition-all duration-500 overflow-hidden ${
        sidebarOpen 
          ? 'w-56 border-r' 
          : 'w-0 border-none pointer-events-none'
      }`}>
        <div className="p-5 flex items-center gap-3 min-w-[224px] relative border-b border-outline-variant/10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
          <div className="size-10 shrink-0 rounded-full bg-cover bg-center border border-primary/20 shadow-[0_0_15px_rgba(125,211,252,0.1)] z-10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCI8ty8MAnAr1bn8UEJoIwEheG777PYbA1Uc8oXcBgYBgYh8ZCs78ymYZiczpAXUSefGXKLoUQlsDVrEudkAoSQKxOVyepnw8hqL4i9izowU--3kjANbkFVO_wJzWvAzb-jcOfvwJ2XwYUDvoSzGPvk5DiPumzqb5JpU7ClXKnbXOGC78MH_VzzGmwinxA-2vLQkUOO_MmXS1o334qBdhugPz0Q0jcH9Oz0nsbyGgoJg2ByrCDuMQG2Cxpq8DoEaBexXjky5sYbfFs')" }}></div>
          <div className="z-10 flex-1 flex flex-col min-w-0">
            <h1 className="text-on-surface font-semibold text-lg tracking-wide leading-tight truncate">Indux Tech</h1>
            
            <div className="relative mt-0.5 group w-auto inline-flex items-center">
              <select className="appearance-none bg-transparent text-primary text-[10px] uppercase tracking-wider font-semibold cursor-pointer focus:outline-none pr-5 hover:text-primary-fixed transition-colors relative z-10 w-full">
                <option className="bg-surface-container normal-case tracking-normal text-sm" value="main">Main Branch (HQ)</option>
                <option className="bg-surface-container normal-case tracking-normal text-sm" value="north">North Branch</option>
                <option className="bg-surface-container normal-case tracking-normal text-sm" value="south">South Branch</option>
              </select>
              <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-primary text-[14px] pointer-events-none group-hover:text-primary-fixed transition-colors">expand_more</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto min-w-[224px] custom-scrollbar">
          <Link href="/dashboard" className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${pathname === '/dashboard' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">grid_view</span>
            Dashboard
          </Link>
          <Link href="/dashboard/quotations" className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${pathname === '/dashboard/quotations' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">request_quote</span>
            Quotations
          </Link>
          <Link href="/dashboard/invoices" className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${pathname === '/dashboard/invoices' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">receipt_long</span>
            Invoices
          </Link>
          <Link href="/dashboard/customers" className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${pathname === '/dashboard/customers' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">group</span>
            Customers
          </Link>
          <Link href="/dashboard/products" className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${pathname === '/dashboard/products' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">inventory_2</span>
            Products
          </Link>
          <Link href="/dashboard/reports" className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${pathname === '/dashboard/reports' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">bar_chart</span>
            Reports
          </Link>
          <a className="nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest hover:text-on-surface transition-all duration-300 hover:translate-x-1 cursor-pointer" href="#">
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">trending_up</span>
            Profit Report
          </a>
          <a className="nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest hover:text-on-surface transition-all duration-300 hover:translate-x-1 cursor-pointer" href="#">
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">account_balance_wallet</span>
            Expenses
          </a>
          <div className="pt-2">
            <a className="nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest hover:text-on-surface transition-all duration-300 hover:translate-x-1 cursor-pointer" href="#">
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">settings</span>
              Settings
            </a>
          </div>
        </nav>
        <div className="p-4 border-t border-outline-variant/30 min-w-[224px]">
          <div 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg glass-button cursor-pointer active:scale-98 transition-all hover:bg-error/10 hover:text-error hover:border-error/30 group"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:-translate-x-0.5">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navigation */}
        <header className="h-20 flex-shrink-0 border-b border-outline-variant/30 glass-panel flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 group cursor-pointer active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-on-surface">menu</span>
            </button>
            <h2 className="text-2xl font-semibold text-on-surface tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
              {pathname === '/dashboard' ? 'Dashboard' : pathname.replace('/dashboard/', '').charAt(0).toUpperCase() + pathname.replace('/dashboard/', '').slice(1)}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full glass-button flex items-center justify-center group cursor-pointer" 
              title="Toggle Theme"
            >
              <span className="material-symbols-outlined select-none text-xl">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <div className="p-1.5 glass-panel rounded-xl pl-2 pr-4 border border-outline-variant/30 hover:border-primary/45 transition-colors cursor-pointer flex items-center gap-3">
              <div className="size-11 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 overflow-hidden shadow-[0_0_10px_rgba(125,211,252,0.1)]">
                <span className="material-symbols-outlined text-primary text-[28px] select-none">account_circle</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-on-surface leading-tight">{user.fullName}</span>
                <span className="text-[10px] text-on-surface-variant/80 tracking-wide uppercase leading-none mt-0.5">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
