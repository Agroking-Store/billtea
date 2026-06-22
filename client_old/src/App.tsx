import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import Quotations from './Quotations';
import Invoices from './Invoices';
import Customers from './Customers';
import Products from './Products';

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  content: string;
}

const testimonials: Testimonial[] = [
  {
    initials: "NM",
    name: "Nilesh Makwana",
    role: "Business Owner",
    content: "Billaro has made my billing work very simple and smooth. I can create invoices and quotations quickly, and tracking payments is now very easy. It saves my time and keeps everything properly organised."
  },
  {
    initials: "B",
    name: "Brijeshbhai",
    role: "Business Owner",
    content: "Since I started using Billaro, managing invoices has become much more easy. Everything is clear and straightforward, and I don’t have to worry about missing payments anymore. It really helps me stay organised."
  },
  {
    initials: "NS",
    name: "Nilam Shah",
    role: "Business Owner",
    content: "Billaro is very simple to use and saves a lot of my time. Creating quotations and converting them into invoices takes just a few clicks. Now my billing process feels much more smooth and hassle free."
  }
];

interface SalesDataPoint {
  date: string;
  sales: string;
  x: number;
  y: number;
}

const invoiceSalesData: SalesDataPoint[] = [
  { date: "Oct 01, 2023 10:00 AM", sales: "$25,000", x: 0, y: 60 },
  { date: "Oct 04, 2023 02:30 PM", sales: "$38,000", x: 50, y: 55.2 },
  { date: "Oct 08, 2023 11:15 AM", sales: "$30,000", x: 100, y: 61.5 },
  { date: "Oct 12, 2023 04:45 PM", sales: "$45,000", x: 150, y: 50 },
  { date: "Oct 16, 2023 09:00 AM", sales: "$68,000", x: 200, y: 40.7 },
  { date: "Oct 20, 2023 01:15 PM", sales: "$40,000", x: 250, y: 49.3 },
  { date: "Oct 24, 2023 03:00 PM", sales: "$58,000", x: 300, y: 40 },
  { date: "Oct 27, 2023 12:00 PM", sales: "$85,000", x: 350, y: 23.7 },
  { date: "Oct 31, 2023 05:30 PM", sales: "$78,000", x: 400, y: 30 }
];

const quotationSalesData: SalesDataPoint[] = [
  { date: "Oct 01, 2023 11:00 AM", sales: "$20,000", x: 0, y: 70 },
  { date: "Oct 04, 2023 03:45 PM", sales: "$22,000", x: 50, y: 65.5 },
  { date: "Oct 08, 2023 10:30 AM", sales: "$38,000", x: 100, y: 51.3 },
  { date: "Oct 12, 2023 01:00 PM", sales: "$45,000", x: 150, y: 39.5 },
  { date: "Oct 16, 2023 02:15 PM", sales: "$48,000", x: 200, y: 40 },
  { date: "Oct 20, 2023 09:30 AM", sales: "$42,000", x: 250, y: 42.5 },
  { date: "Oct 24, 2023 04:00 PM", sales: "$55,000", x: 300, y: 35 },
  { date: "Oct 27, 2023 11:45 AM", sales: "$65,000", x: 350, y: 27.5 },
  { date: "Oct 31, 2023 06:00 PM", sales: "$62,000", x: 400, y: 30 }
];

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [hoveredInvoicePoint, setHoveredInvoicePoint] = useState<SalesDataPoint | null>(null);
  const [hoveredQuotationPoint, setHoveredQuotationPoint] = useState<SalesDataPoint | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup' | 'dashboard'>(() => {
    // Check if token exists on load to keep user logged in for testing
    return localStorage.getItem('token') ? 'dashboard' : 'landing';
  });
  const [dashboardView, setDashboardView] = useState<'home' | 'quotations' | 'invoices' | 'customers' | 'products'>('home');



  // Initialize theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Testimonial auto-slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('landing');
  };

  if (currentView === 'login' || currentView === 'signup') {
    return (
      <Auth
        onBackToLanding={() => setCurrentView('landing')}
        onLoginSuccess={() => setCurrentView('dashboard')}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        initialView={currentView}
      />
    );
  }

  if (currentView === 'dashboard') {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { fullName: 'Sarang Wagh', email: 'admin@indux.com' };

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
            <a 
              className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${dashboardView === 'home' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}
              onClick={() => setDashboardView('home')}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">grid_view</span>
              Dashboard
            </a>
            <a 
              className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${dashboardView === 'quotations' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}
              onClick={() => setDashboardView('quotations')}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">request_quote</span>
              Quotations
            </a>
            <a 
              className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${dashboardView === 'invoices' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}
              onClick={() => setDashboardView('invoices')}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">receipt_long</span>
              Invoices
            </a>
            <a 
              className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${dashboardView === 'customers' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}
              onClick={() => setDashboardView('customers')}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">group</span>
              Customers
            </a>
            <a 
              className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${dashboardView === 'products' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(125,211,252,0.1)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container-highest hover:text-on-surface hover:translate-x-1'}`}
              onClick={() => setDashboardView('products')}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">inventory_2</span>
              Products
            </a>
            <a className="nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest hover:text-on-surface transition-all duration-300 hover:translate-x-1 cursor-pointer" href="#">
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">bar_chart</span>
              Reports
            </a>
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
                Dashboard
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsDark(!isDark)} 
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

          {/* Scrollable Dashboard Content */}
          {dashboardView === 'home' ? (
            <div className="flex-1 overflow-y-auto p-8 z-0 relative">
              {/* Background Ambient Effects */}
              <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(125,211,252,0.03)_0%,_transparent_70%)] pointer-events-none z-0 blur-[60px]"></div>
              <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,_rgba(200,160,240,0.02)_0%,_transparent_70%)] pointer-events-none z-0 blur-[50px]"></div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Invoices</p>
                  <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">receipt_long</span>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight">1,245</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%
                  </span>
                  <span className="text-on-surface-variant/60">vs last month</span>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Quotations</p>
                  <span className="material-symbols-outlined text-tertiary p-2 rounded-lg bg-tertiary/10">request_quote</span>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight">842</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 5%
                  </span>
                  <span className="text-on-surface-variant/60">vs last month</span>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Sales</p>
                  <span className="material-symbols-outlined text-primary p-2 rounded-lg bg-primary/10">payments</span>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight">$452.8K</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 18%
                  </span>
                  <span className="text-on-surface-variant/60">vs last month</span>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider">Total Customers</p>
                  <span className="material-symbols-outlined text-tertiary p-2 rounded-lg bg-tertiary/10">group</span>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight">1,092</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 3%
                  </span>
                  <span className="text-on-surface-variant/60">vs last month</span>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="glass-panel rounded-2xl p-6 mb-8 flex flex-wrap items-end gap-6 relative z-10">
              <div className="flex-1 min-w-[200px] space-y-2">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Date Range</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-sm">calendar_today</span>
                    <input className="w-full glass-input rounded-lg py-2 pl-10 pr-3 text-sm text-on-surface" type="date" defaultValue="2023-10-01" />
                  </div>
                  <span className="text-on-surface font-medium">to</span>
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-sm">calendar_today</span>
                    <input className="w-full glass-input rounded-lg py-2 pl-10 pr-3 text-sm text-on-surface" type="date" defaultValue="2023-10-31" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Quick Filter</label>
                <div className="relative">
                  <select className="glass-input rounded-lg py-2 pl-3 pr-10 text-sm appearance-none cursor-pointer w-48">
                    <option>Last 30 Days</option>
                    <option>Last 6 Months</option>
                    <option>Year to Date</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-primary">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Branch</label>
                <div className="relative">
                  <select className="glass-input rounded-lg py-2 pl-3 pr-10 text-sm appearance-none cursor-pointer w-48">
                    <option>All Branches</option>
                    <option>Main Branch</option>
                    <option>North Sector</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-primary">expand_more</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="glass-button p-2 rounded-lg flex items-center justify-center cursor-pointer" title="Reset Filters">
                  <span className="material-symbols-outlined">restart_alt</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 relative z-10">
              {/* Invoice Sales Trend */}
              <div className="glass-panel-elevated rounded-2xl p-6">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-on-surface font-medium mb-1">Invoice Sales</h3>
                    <p className="text-2xl font-bold text-primary tracking-tight">$235K</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-on-surface-variant mb-1 block">This Month</span>
                    <span className="text-sm text-emerald-400 font-medium">+15%</span>
                  </div>
                </div>
                <div className="h-48 w-full relative">
                  <svg 
                    className="w-full h-full overflow-visible cursor-crosshair" 
                    preserveAspectRatio="none" 
                    viewBox="0 0 400 100"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relativeX = ((e.clientX - rect.left) / rect.width) * 400;
                      const closestPoint = invoiceSalesData.reduce((prev, curr) => 
                        Math.abs(curr.x - relativeX) < Math.abs(prev.x - relativeX) ? curr : prev
                      );
                      setHoveredInvoicePoint(closestPoint);
                    }}
                    onMouseLeave={() => setHoveredInvoicePoint(null)}
                  >
                    <defs>
                      <linearGradient id="gradient1" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.3"></stop>
                        <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <path d="M0,100 L0,60 C50,40 100,80 150,50 C200,20 250,70 300,40 C350,10 400,30 400,30 L400,100 Z" fill="url(#gradient1)"></path>
                    <path className="path-line" d="M0,60 C50,40 100,80 150,50 C200,20 250,70 300,40 C350,10 400,30 400,30" fill="none" stroke="#7dd3fc" strokeLinecap="round" strokeWidth="2"></path>
                    
                    {hoveredInvoicePoint && (
                      <>
                        <line 
                          x1={hoveredInvoicePoint.x} 
                          y1={0} 
                          x2={hoveredInvoicePoint.x} 
                          y2={100} 
                          stroke="#7dd3fc" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                          opacity="0.6"
                        />
                        <circle 
                          cx={hoveredInvoicePoint.x} 
                          cy={hoveredInvoicePoint.y} 
                          r="8" 
                          fill="#7dd3fc" 
                          opacity="0.3"
                        />
                        <circle 
                          cx={hoveredInvoicePoint.x} 
                          cy={hoveredInvoicePoint.y} 
                          r="4" 
                          fill="#7dd3fc" 
                          stroke="#ffffff" 
                          strokeWidth="1.5"
                        />
                      </>
                    )}
                  </svg>
                  
                  {hoveredInvoicePoint && (
                    <div 
                      className="absolute pointer-events-none z-30 transition-all duration-150 ease-out glass-panel p-2.5 rounded-xl shadow-lg border border-primary/20 flex flex-col gap-1 text-xs min-w-[140px]"
                      style={{
                        left: `${(hoveredInvoicePoint.x / 400) * 100}%`,
                        top: `${(hoveredInvoicePoint.y / 100) * 100}%`,
                        transform: 'translate(-50%, calc(-100% - 15px))',
                      }}
                    >
                      <div className="text-on-surface-variant font-medium text-[9px] uppercase tracking-wider">{hoveredInvoicePoint.date}</div>
                      <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(125,211,252,0.8)]"></span>
                        Invoice Sales: {hoveredInvoicePoint.sales}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 w-full flex justify-between text-xs text-on-surface-variant/60 pt-2 border-t border-outline-variant/30">
                    <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                  </div>
                </div>
              </div>

              {/* Quotation Sales Trend */}
              <div className="glass-panel-elevated rounded-2xl p-6">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-on-surface font-medium mb-1">Quotation Sales</h3>
                    <p className="text-2xl font-bold text-tertiary tracking-tight">$217K</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-on-surface-variant mb-1 block">This Month</span>
                    <span className="text-sm text-emerald-400 font-medium">+8%</span>
                  </div>
                </div>
                <div className="h-48 w-full relative">
                  <svg 
                    className="w-full h-full overflow-visible cursor-crosshair" 
                    preserveAspectRatio="none" 
                    viewBox="0 0 400 100"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relativeX = ((e.clientX - rect.left) / rect.width) * 400;
                      const closestPoint = quotationSalesData.reduce((prev, curr) => 
                        Math.abs(curr.x - relativeX) < Math.abs(prev.x - relativeX) ? curr : prev
                      );
                      setHoveredQuotationPoint(closestPoint);
                    }}
                    onMouseLeave={() => setHoveredQuotationPoint(null)}
                  >
                    <defs>
                      <linearGradient id="gradient2" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#c8a0f0" stopOpacity="0.3"></stop>
                        <stop offset="100%" stopColor="#c8a0f0" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <path d="M0,100 L0,70 C80,70 120,30 200,40 C280,50 320,20 400,30 L400,100 Z" fill="url(#gradient2)"></path>
                    <path className="path-line" d="M0,70 C80,70 120,30 200,40 C280,50 320,20 400,30" fill="none" stroke="#c8a0f0" strokeLinecap="round" strokeWidth="2"></path>
                    
                    {hoveredQuotationPoint && (
                      <>
                        <line 
                          x1={hoveredQuotationPoint.x} 
                          y1={0} 
                          x2={hoveredQuotationPoint.x} 
                          y2={100} 
                          stroke="#c8a0f0" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                          opacity="0.6"
                        />
                        <circle 
                          cx={hoveredQuotationPoint.x} 
                          cy={hoveredQuotationPoint.y} 
                          r="8" 
                          fill="#c8a0f0" 
                          opacity="0.3"
                        />
                        <circle 
                          cx={hoveredQuotationPoint.x} 
                          cy={hoveredQuotationPoint.y} 
                          r="4" 
                          fill="#c8a0f0" 
                          stroke="#ffffff" 
                          strokeWidth="1.5"
                        />
                      </>
                    )}
                  </svg>
                  
                  {hoveredQuotationPoint && (
                    <div 
                      className="absolute pointer-events-none z-30 transition-all duration-150 ease-out glass-panel p-2.5 rounded-xl shadow-lg border border-tertiary/20 flex flex-col gap-1 text-xs min-w-[140px]"
                      style={{
                        left: `${(hoveredQuotationPoint.x / 400) * 100}%`,
                        top: `${(hoveredQuotationPoint.y / 100) * 100}%`,
                        transform: 'translate(-50%, calc(-100% - 15px))',
                      }}
                    >
                      <div className="text-on-surface-variant font-medium text-[9px] uppercase tracking-wider">{hoveredQuotationPoint.date}</div>
                      <div className="flex items-center gap-1.5 font-bold text-tertiary text-xs">
                        <span className="size-1.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(200,160,240,0.8)]"></span>
                        Quote Sales: {hoveredQuotationPoint.sales}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 w-full flex justify-between text-xs text-on-surface-variant/60 pt-2 border-t border-outline-variant/30">
                    <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                  </div>
                </div>
              </div>

              {/* Invoice Count Bar */}
              <div className="glass-panel-elevated rounded-2xl p-6">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-on-surface font-medium mb-1">Invoice Count</h3>
                    <p className="text-2xl font-bold text-on-surface tracking-tight">1,245</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-emerald-400 font-medium">+12%</span>
                  </div>
                </div>
                <div className="h-48 w-full flex items-end justify-around pb-6 relative">
                  <div className="w-12 bg-primary/20 hover:bg-primary/40 border border-primary/30 rounded-t-sm h-[60%] bar-grow transition-colors relative group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs py-1 px-2 rounded glass-panel transition-opacity">180</div>
                  </div>
                  <div className="w-12 bg-primary/20 hover:bg-primary/40 border border-primary/30 rounded-t-sm h-[40%] bar-grow transition-colors relative group" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs py-1 px-2 rounded glass-panel transition-opacity">120</div>
                  </div>
                  <div className="w-12 bg-primary/20 hover:bg-primary/40 border border-primary/30 rounded-t-sm h-[75%] bar-grow transition-colors relative group" style={{ animationDelay: '0.2s' }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs py-1 px-2 rounded glass-panel transition-opacity">225</div>
                  </div>
                  <div className="w-12 bg-primary/50 hover:bg-primary/70 border border-primary rounded-t-sm h-[90%] bar-grow transition-colors shadow-[0_0_15px_rgba(125,211,252,0.3)] relative group" style={{ animationDelay: '0.3s' }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs py-1 px-2 rounded glass-panel transition-opacity">270</div>
                  </div>
                  <div className="absolute bottom-0 w-full flex justify-around text-xs text-on-surface-variant/60 pt-2 border-t border-outline-variant/30">
                    <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                  </div>
                </div>
              </div>

              {/* Quotation Count Bar */}
              <div className="glass-panel-elevated rounded-2xl p-6">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-on-surface font-medium mb-1">Quotation Count</h3>
                    <p className="text-2xl font-bold text-on-surface tracking-tight">842</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-emerald-400 font-medium">+5%</span>
                  </div>
                </div>
                <div className="h-48 w-full flex items-end justify-around pb-6 relative">
                  <div className="w-12 bg-tertiary/20 hover:bg-tertiary/40 border border-tertiary/30 rounded-t-sm h-[80%] bar-grow transition-colors relative group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs py-1 px-2 rounded glass-panel transition-opacity">160</div>
                  </div>
                  <div className="w-12 bg-tertiary/20 hover:bg-tertiary/40 border border-tertiary/30 rounded-t-sm h-[30%] bar-grow transition-colors relative group" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs py-1 px-2 rounded glass-panel transition-opacity">60</div>
                  </div>
                  <div className="w-12 bg-tertiary/20 hover:bg-tertiary/40 border border-tertiary/30 rounded-t-sm h-[50%] bar-grow transition-colors relative group" style={{ animationDelay: '0.2s' }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs py-1 px-2 rounded glass-panel transition-opacity">100</div>
                  </div>
                  <div className="w-12 bg-tertiary/50 hover:bg-tertiary/70 border border-tertiary rounded-t-sm h-[85%] bar-grow transition-colors shadow-[0_0_15px_rgba(200,160,240,0.3)] relative group" style={{ animationDelay: '0.3s' }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface text-xs py-1 px-2 rounded glass-panel transition-opacity">170</div>
                  </div>
                  <div className="absolute bottom-0 w-full flex justify-around text-xs text-on-surface-variant/60 pt-2 border-t border-outline-variant/30">
                    <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Reminders & Table */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
              {/* Reminders */}
              <div className="xl:col-span-1 glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-on-surface">Reminders</h3>
                  <button className="text-primary hover:text-primary-fixed transition-colors text-sm font-medium cursor-pointer">View All</button>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-surface-bright/50 border border-outline-variant/30 flex gap-3 hover:bg-surface-bright transition-colors cursor-pointer group">
                    <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 group-hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">Follow up with TechCorp</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Overdue Invoice #INV-2041</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-bright/50 border border-outline-variant/30 flex gap-3 hover:bg-surface-bright transition-colors cursor-pointer group">
                    <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">Review Q3 Report</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Due today at 5:00 PM</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-bright/50 border border-outline-variant/30 flex gap-3 hover:bg-surface-bright transition-colors cursor-pointer group">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:shadow-[0_0_10px_rgba(125,211,252,0.2)]">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">Send Quotation to Alpha Inc.</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Draft saved, needs approval</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payments Table */}
              <div className="xl:col-span-1 glass-panel rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-on-surface">Recent Activity</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-bright border border-outline-variant/30 text-on-surface hover:border-primary/50 transition-colors cursor-pointer">Filter</button>
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs uppercase tracking-wider">
                        <th className="pb-3 font-medium px-2">Client</th>
                        <th className="pb-3 font-medium px-2">ID</th>
                        <th className="pb-3 font-medium px-2">Date</th>
                        <th className="pb-3 font-medium px-2">Amount</th>
                        <th className="pb-3 font-medium px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-outline-variant/10 hover:bg-surface-bright/30 transition-colors">
                        <td className="py-4 px-2 text-on-surface font-medium flex items-center gap-2">
                          <div className="size-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs border border-indigo-500/30">T</div>
                          TechCorp Ltd.
                        </td>
                        <td className="py-4 px-2 text-on-surface-variant">INV-2041</td>
                        <td className="py-4 px-2 text-on-surface-variant">Oct 24, 2023</td>
                        <td className="py-4 px-2 text-on-surface font-medium">$4,500.00</td>
                        <td className="py-4 px-2 text-right">
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            <span className="size-1.5 rounded-full bg-emerald-400"></span> Paid
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-outline-variant/10 hover:bg-surface-bright/30 transition-colors">
                        <td className="py-4 px-2 text-on-surface font-medium flex items-center gap-2">
                          <div className="size-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs border border-amber-500/30">O</div>
                          Omega Systems
                        </td>
                        <td className="py-4 px-2 text-on-surface-variant">QUO-1892</td>
                        <td className="py-4 px-2 text-on-surface-variant">Oct 22, 2023</td>
                        <td className="py-4 px-2 text-on-surface font-medium">$12,850.00</td>
                        <td className="py-4 px-2 text-right">
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                            <span className="size-1.5 rounded-full bg-amber-400"></span> Pending
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-bright/30 transition-colors">
                        <td className="py-4 px-2 text-on-surface font-medium flex items-center gap-2">
                          <div className="size-6 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs border border-rose-500/30">A</div>
                          Alpha Inc.
                        </td>
                        <td className="py-4 px-2 text-on-surface-variant">INV-2038</td>
                        <td className="py-4 px-2 text-on-surface-variant">Oct 15, 2023</td>
                        <td className="py-4 px-2 text-on-surface font-medium">$2,100.00</td>
                        <td className="py-4 px-2 text-right">
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                            <span className="size-1.5 rounded-full bg-rose-400"></span> Overdue
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          ) : dashboardView === 'quotations' ? (
            <Quotations />
          ) : dashboardView === 'invoices' ? (
            <Invoices />
          ) : dashboardView === 'customers' ? (
            <Customers />
          ) : dashboardView === 'products' ? (
            <Products />
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col antialiased selection:bg-primary/30 selection:text-primary transition-colors duration-300">
      
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-primary/10 shadow-[0_0_30px_rgba(125,211,252,0.05)] transition-all">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img 
              className="h-8 w-8 rounded-lg object-contain transition-opacity duration-300" 
              alt="Indux Technology Logo" 
              src="/logo.jpg" 
            />
            <span className="text-xl font-headline font-bold tracking-tight text-on-surface text-glow">
              Indux Technology
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-on-surface hover:text-primary transition-all duration-300 px-3 py-1.5 rounded-lg active:scale-95 text-primary font-semibold border-b-2 border-primary pb-1">Features</a>
            <a href="#pricing" className="text-on-surface-variant hover:text-primary transition-all duration-300 px-3 py-1.5 rounded-lg active:scale-95">Pricing</a>
            <a href="#availability" className="text-on-surface-variant hover:text-primary transition-all duration-300 px-3 py-1.5 rounded-lg active:scale-95">Availability</a>
            <a href="#testimonials" className="text-on-surface-variant hover:text-primary transition-all duration-300 px-3 py-1.5 rounded-lg active:scale-95">Reviews</a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-primary/5 active:scale-95"
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined select-none">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button 
              onClick={() => setCurrentView('login')}
              className="hidden md:block text-on-surface-variant hover:text-primary transition-colors font-semibold active:scale-95 cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => setCurrentView('signup')}
              className="hidden md:block bg-primary hover:bg-primary/90 text-on-primary px-5 py-2 rounded-lg font-semibold transition-all duration-300 active:scale-95 shadow-md shadow-primary/20 cursor-pointer"
            >
              Get Started
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-primary p-2 active:scale-95"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined select-none">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface-container border-b border-primary/10 px-8 py-6 flex flex-col gap-4 animate-fade-in-down">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-surface hover:text-primary">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-surface hover:text-primary">Pricing</a>
            <a href="#availability" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-surface hover:text-primary">Availability</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-surface hover:text-primary">Reviews</a>
            <hr className="border-primary/10 my-2" />
            <button 
              onClick={() => { setMobileMenuOpen(false); setCurrentView('login'); }}
              className="text-center text-on-surface font-semibold py-2 rounded-lg hover:bg-primary/5 cursor-pointer w-full"
            >
              Login
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setCurrentView('signup'); }}
              className="text-center bg-primary text-on-primary font-semibold py-3 rounded-lg shadow-md cursor-pointer w-full"
            >
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24">
        
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10"></div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New: WhatsApp Integration Available
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-headline font-bold leading-tight text-on-surface">
                Smart Billing.<br/>
                <span className="text-primary text-glow">Simple Tracking.</span><br/>
                Secure Data.
              </h1>
              
              <p className="text-xl text-on-surface-variant max-w-xl font-body leading-relaxed">
                Indux Technology helps Indian business owners manage instant quotations, easy invoicing, payment tracking, and expense management all in one secure place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 active:scale-95">
                  Get App Now
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
                <button className="glass-panel hover:bg-surface-container text-on-surface px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95">
                  <span className="material-symbols-outlined text-primary">play_circle</span>
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[600px] glass-elevated rounded-3xl overflow-hidden group">
              <img 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt="Indux Dashboard Interface" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKsx2Ph1RS-RkHTV1hXXpgVcmuCQHJUfruandWvM0KjAiLG_0fcBNOe5Bvqc6j2_oITAU_8dvpS0RygWdslm8lu3UtekdqVoXNKtlWBFsNQhnWV71iE9ZCSWuF3RJhFADpeQewh7D7qxWqbY0RlWA_eynyGGGmCIluJk8Hm67F5S2e4xGIehsftsMJtBqlLumR_oTnSrWhi8vmMCNrRQ95uFHhHG_oTb0wXQH5v-UcfBTE2r2yJ0l276yY6RmWeYBFsY1O_-sILlk" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto relative" id="features">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Amazing Features</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Built for non-technical users, powerful enough for daily business operations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Bento Grid Item 1: Large */}
            <div className="md:col-span-2 glass-panel rounded-2xl p-8 flex flex-col justify-end relative overflow-hidden group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl select-none">request_quote</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-on-surface">Create Quotes Instantly</h3>
              <p className="text-on-surface-variant max-w-md">Prepare professional quotations in just a few clicks - no complexity, no delays.</p>
            </div>
            
            {/* Bento Grid Item 2 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-end relative group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 text-secondary">
                <span className="material-symbols-outlined text-3xl select-none">receipt_long</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Convert Quote to Invoice</h3>
              <p className="text-on-surface-variant text-sm">Turn approved quotes into invoices instantly - no rework needed.</p>
            </div>

            {/* Bento Grid Item 3 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-end relative group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 text-primary">
                <span className="material-symbols-outlined text-3xl select-none">payments</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Track Payments Easily</h3>
              <p className="text-on-surface-variant text-sm">Manage full and partial payments clearly in one simple dashboard.</p>
            </div>

            {/* Bento Grid Item 4 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-end relative group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 text-secondary">
                <span className="material-symbols-outlined text-3xl select-none">notifications_active</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Follow-Up Reminders</h3>
              <p className="text-on-surface-variant text-sm">Never miss a quotation follow-up with automatic reminders.</p>
            </div>

            {/* Bento Grid Item 5 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-end relative group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 text-tertiary">
                <span className="material-symbols-outlined text-3xl select-none">account_balance_wallet</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Manage Business Expenses</h3>
              <p className="text-on-surface-variant text-sm">Record and track all your business expenses effortlessly.</p>
            </div>
          </div>
        </section>

        {/* Availability Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto relative" id="availability">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Available Everywhere You Are</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Access your business data from any device, anytime, anywhere.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* iOS */}
            <div className="glass-elevated rounded-3xl p-8 flex flex-col items-center text-center group hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 fill-current text-primary" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.1 3.81 1.58a5.98 5.98 0 0 1 4.7 3c-2.95 1.79-2.48 5.72 1.09 7.17-.67 1.69-1.92 3.82-3 5m-3.41-14.7c1.38-1.68 1.4-3.53 1.4-3.53s-1.8.03-3.14 1.6c-1.29 1.49-1.35 3.32-1.35 3.32s1.7.07 3.09-1.39z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">iOS App</h3>
              <p className="text-on-surface-variant text-sm mb-6">Optimized for iPhone and iPad for a seamless mobile experience.</p>
              <button className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300">
                Coming Soon
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            
            {/* Android */}
            <div className="glass-elevated rounded-3xl p-8 flex flex-col items-center text-center group hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl select-none">android</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Android App</h3>
              <p className="text-on-surface-variant text-sm mb-6">Powerful billing tools right in your pocket for all Android devices.</p>
              <button className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300">
                Coming Soon
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Web */}
            <div className="glass-elevated rounded-3xl p-8 flex flex-col items-center text-center group hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl select-none">language</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Web Dashboard</h3>
              <p className="text-on-surface-variant text-sm mb-6">Full-featured desktop experience for complex business management.</p>
              <button className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300">
                Launch Web App
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
          </div>
        </section>

        {/* Testimonial Slider Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden" id="testimonials">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">App Reviews</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Hear what our customers have to say about their experience with Billaro.</p>
          </div>
          
          <div className="relative max-w-4xl mx-auto pb-12 testimonial-slider-container">
            <div 
              className="flex transition-transform duration-700 ease-in-out" 
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {testimonials.map((t, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4 md:px-12 testimonial-slide">
                  <div className={`testimonial-card transition-all duration-700 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center bg-surface-bright border border-outline-variant/30 h-full ${index === currentSlide ? 'shadow-[0_8px_30px_rgb(3,105,161,0.15)] border-primary/30 scale-100' : 'opacity-40 scale-90'}`}>
                    <div className="flex gap-1 mb-6 text-primary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined fill-current select-none">star</span>
                      ))}
                    </div>
                    <p className="text-lg md:text-xl text-on-surface-variant italic mb-8 font-body leading-relaxed flex-grow">
                      "{t.content}"
                    </p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        {t.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-lg">{t.name}</h4>
                        <p className="text-sm text-primary font-medium tracking-wide">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-3 z-10">
              {testimonials.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`} 
                  className={`testimonial-dot transition-all duration-500 h-2 rounded-full cursor-pointer focus:outline-none ${index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'}`}
                ></button>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto" id="pricing">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Unbelievable Pricing</h2>
            <p className="text-on-surface-variant">Different plans for different user needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free Plan */}
            <div className="glass-panel rounded-3xl p-8 flex flex-col hover:scale-[1.02] transition-transform duration-300">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-on-surface mb-2">Free</h3>
                <div className="text-4xl font-headline font-bold text-primary">₹0</div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow text-on-surface-variant">
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Quotations</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Invoices</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Reports</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Upload images</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Desktop + Mobile App</li>
              </ul>
              <button onClick={() => setCurrentView('signup')} className="w-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface py-3 rounded-lg font-semibold transition-colors active:scale-95 cursor-pointer">
                Register for Free
              </button>
            </div>

            {/* Monthly Plan (Highlighted) */}
            <div className="glass-elevated rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 border-primary/45 shadow-xl shadow-primary/10 hover:scale-[1.03] transition-all duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-on-surface mb-2">Monthly</h3>
                <div className="text-4xl font-headline font-bold text-primary">
                  ₹3500<span className="text-lg text-on-surface-variant font-normal">/mo</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow text-on-surface-variant">
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> All Free Features</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Multiple branch support</li>
                <li className="flex items-center gap-3 text-on-surface font-semibold"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Send Utility WhatsApp msg</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Priority Customer Support</li>
              </ul>
              <button className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3 rounded-lg font-semibold transition-all shadow-md active:scale-95">
                Select &amp; Pay
              </button>
            </div>

            {/* Yearly Plan */}
            <div className="glass-panel rounded-3xl p-8 flex flex-col hover:scale-[1.02] transition-transform duration-300">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-on-surface mb-2">Yearly</h3>
                <div className="text-4xl font-headline font-bold text-primary">
                  ₹35000<span className="text-lg text-on-surface-variant font-normal">/yr</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow text-on-surface-variant">
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> All Monthly Features</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Save roughly 2 months</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Enterprise level support</li>
              </ul>
              <button className="w-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface py-3 rounded-lg font-semibold transition-colors active:scale-95">
                Select &amp; Pay
              </button>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto" id="contact">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Contact Us</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Get in touch with us for any questions or support.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="glass-panel rounded-3xl p-8 shadow-xl shadow-primary/5">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="name">Name</label>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
                    id="name" 
                    name="name" 
                    placeholder="Your Name" 
                    type="text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="email">Email</label>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
                    id="email" 
                    name="email" 
                    placeholder="your.email@example.com" 
                    type="email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="message">Message</label>
                  <textarea 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-none" 
                    id="message" 
                    name="message" 
                    placeholder="How can we help you?" 
                    rows={4}
                    required
                  ></textarea>
                </div>
                <button 
                  className="w-full bg-primary hover:bg-primary/90 text-on-primary py-4 rounded-xl font-semibold transition-all duration-300 shadow-md active:scale-95" 
                  type="submit"
                >
                  Send Message
                </button>
              </form>

              {formSubmitted && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl text-center font-medium animate-fade-in">
                  Thank you! Your message has been sent successfully.
                </div>
              )}
            </div>

            {/* Contact Info Panel */}
            <div className="flex flex-col gap-8 justify-center lg:pl-8">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined select-none">call</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface mb-1">Phone</h4>
                  <p className="text-on-surface-variant font-medium">+91 88661 41352 | +91 78188 61352</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined select-none">mail</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface mb-1">Email</h4>
                  <a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="mailto:billaroapp@gmail.com">
                    billaroapp@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined select-none">location_on</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface mb-1">Location</h4>
                  <p className="text-on-surface-variant leading-relaxed font-medium">
                    Visat Road, 626, Emporis by Poddar Realty Group B/s, Decathlon Rd, near Tapovan Circle, Motera, Ahmedabad, Gujarat 380005.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-surface-container-lowest border-t border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-lg font-headline font-semibold text-on-surface text-glow">Indux Technology</span>
            <span className="font-body text-sm text-on-surface-variant">© 2024 Indux Technology. All rights reserved.</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
            <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">API Documentation</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
