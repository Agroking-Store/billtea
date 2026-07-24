'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../components/ThemeProvider';
import { BranchProvider, useBranch } from '../../components/BranchProvider';
import { SubscriptionProvider, useSubscription } from '../../components/SubscriptionProvider';
import Link from 'next/link';
import { isLoggedIn, logout } from '../../lib/auth';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { branches, selectedBranchId, setSelectedBranchId, isLoadingBranches } = useBranch();
  const { isExpired, daysRemaining, isLoading: isLoadingSub } = useSubscription();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string }>({
    fullName: 'Sarang Wagh',
    email: 'admin@indux.com',
    role: 'owner',
  });
  const [mounted, setMounted] = useState(false);

  // Navigation items with role-based access
  const allNavItems = [
    { href: '/home', icon: 'grid_view', label: 'Dashboard', roles: ['owner', 'manager', 'staff'] },
    { href: '/quotations', icon: 'request_quote', label: 'Quotations', roles: ['owner', 'manager', 'staff'] },
    { href: '/invoices', icon: 'receipt_long', label: 'Invoices', roles: ['owner', 'manager', 'staff'] },
    { href: '/customers', icon: 'group', label: 'Customers', roles: ['owner', 'manager', 'staff'] },
    { href: '/products', icon: 'inventory_2', label: 'Products', roles: ['owner', 'manager', 'staff'] },
    { href: '/reports', icon: 'bar_chart', label: 'Reports', roles: ['owner', 'manager', 'staff'] },
    { href: '/profit', icon: 'trending_up', label: 'Profit Report', roles: ['owner', 'manager'] },
    { href: '/expenses', icon: 'account_balance_wallet', label: 'Expenses', roles: ['owner', 'manager', 'staff'] },
  ];

  const userRole = (user.role || 'staff').toLowerCase();
  const filteredNavItems = allNavItems.filter(item => item.roles.includes(userRole));
  const showSettings = userRole === 'owner' || userRole === 'manager';

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
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
    logout();
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex overflow-hidden antialiased transition-colors duration-300 relative">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative flex-shrink-0 border-outline-variant/30 glass-panel bg-surface/95 md:bg-surface/50 backdrop-blur-xl md:backdrop-blur-none flex flex-col h-screen z-50 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden border-r shadow-2xl md:shadow-none
        ${sidebarOpen ? 'translate-x-0 w-[260px] md:w-56' : '-translate-x-full md:translate-x-0 md:w-[72px]'}
      `}>
        <div className="flex items-center gap-3 relative border-b border-outline-variant/10 p-4 h-20 shrink-0 overflow-hidden whitespace-nowrap bg-surface-container-lowest/50">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
          <div className="size-10 shrink-0 rounded-full bg-cover bg-center border border-primary/20 shadow-[0_0_15px_rgba(125,211,252,0.15)] z-10 relative">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10"></div>
            <div className="size-full rounded-full bg-cover bg-center" style={{ backgroundImage: "url('/images/logo.png')" }}></div>
          </div>
          <div className={`z-10 flex-1 flex flex-col min-w-0 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <h1 className="text-on-surface font-black text-lg tracking-wide leading-tight truncate font-display">Indux Tech</h1>
            <div className="relative mt-0.5 group w-auto inline-flex items-center">
              {isLoadingBranches ? (
                <div className="text-primary text-[10px] uppercase tracking-wider font-bold">Loading...</div>
              ) : (
                <>
                  <select
                    value={selectedBranchId || ''}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="appearance-none bg-transparent text-primary text-[10px] uppercase tracking-wider font-bold cursor-pointer focus:outline-none pr-5 hover:text-primary-fixed transition-colors relative z-10 w-full"
                  >
                    {branches.map(branch => (
                      <option key={branch.id} className="bg-surface-container normal-case tracking-normal text-sm font-medium" value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-primary text-[14px] pointer-events-none group-hover:text-primary-fixed transition-colors">expand_more</span>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-surface/50 to-transparent pointer-events-none z-10"></div>
          {filteredNavItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              title={!sidebarOpen ? item.label : undefined} 
              onClick={() => {
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 overflow-hidden whitespace-nowrap relative ${pathname === item.href ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(125,211,252,0.15)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container hover:text-on-surface hover:translate-x-1'}`}
            >
              {pathname === item.href && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full shadow-[0_0_10px_rgba(125,211,252,0.8)]"></div>
              )}
              <span className="material-symbols-outlined shrink-0 text-[20px] transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
              <span className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
            </Link>
          ))}
          {showSettings && (
            <div className="pt-4 mt-2 border-t border-outline-variant/20 relative">
              <Link 
                href="/settings" 
                title={!sidebarOpen ? 'Settings' : undefined} 
                onClick={() => {
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 overflow-hidden whitespace-nowrap relative ${pathname === '/settings' ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(125,211,252,0.15)]' : 'text-on-surface-variant border border-transparent hover:bg-surface-container hover:text-on-surface hover:translate-x-1'}`}
              >
                {pathname === '/settings' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full shadow-[0_0_10px_rgba(125,211,252,0.8)]"></div>
                )}
                <span className="material-symbols-outlined shrink-0 text-[20px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">settings</span>
                <span className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Settings</span>
              </Link>
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-outline-variant/20 shrink-0 overflow-hidden whitespace-nowrap bg-surface-container-lowest/50 relative z-10">
          <div
            onClick={handleLogout}
            title={!sidebarOpen ? 'Sign Out' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface hover:bg-error/10 text-on-surface-variant hover:text-error border border-outline-variant/30 hover:border-error/30 cursor-pointer active:scale-95 transition-all duration-300 shadow-sm group"
          >
            <span className="material-symbols-outlined shrink-0 text-[20px] transition-transform duration-300 group-hover:-translate-x-0.5">logout</span>
            <span className={`text-sm font-semibold transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-0">
        
        {/* Top Navigation */}
        <header className="h-16 md:h-20 flex-shrink-0 border-b border-outline-variant/20 glass-panel bg-surface/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-20 relative shadow-sm">
          {/* Subtle header glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-tertiary/5 pointer-events-none"></div>

          <div className="flex items-center gap-3 md:gap-4 relative z-10">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 md:p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary active:scale-95 transition-all flex items-center justify-center border border-transparent hover:border-outline-variant/30 shadow-sm md:shadow-none"
            >
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">menu_open</span>
            </button>
            <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tight font-display drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] truncate max-w-[150px] sm:max-w-none">
              {pathname === '/home' ? 'Dashboard' :
                pathname.includes('/edit') ? `Edit ${pathname.split('/')[1].replace(/s$/, '').charAt(0).toUpperCase() + pathname.split('/')[1].replace(/s$/, '').slice(1)}` :
                  pathname.includes('/new') ? `New ${pathname.split('/')[1].replace(/s$/, '').charAt(0).toUpperCase() + pathname.split('/')[1].replace(/s$/, '').slice(1)}` :
                    pathname.split('/')[1].charAt(0).toUpperCase() + pathname.split('/')[1].slice(1)}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-6 relative z-10">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 md:h-10 md:w-10 rounded-full glass-button flex items-center justify-center group cursor-pointer border border-outline-variant/30 hover:border-primary/30 hover:text-primary transition-all shadow-sm"
              title="Toggle Theme"
            >
              <span className="material-symbols-outlined select-none text-[18px] md:text-xl group-hover:rotate-12 transition-transform">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <Link href="/settings/profile" className="p-1 md:p-1.5 glass-panel rounded-xl md:pl-2 md:pr-4 border border-outline-variant/30 hover:border-primary/45 hover:bg-surface-container-highest/20 transition-all cursor-pointer flex items-center gap-3 shadow-sm hover:shadow-[0_0_15px_rgba(125,211,252,0.15)] group">
              <div className="size-8 md:size-11 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 overflow-hidden shadow-[0_0_10px_rgba(125,211,252,0.1)] group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-[20px] md:text-[28px] select-none">account_circle</span>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">{user.fullName}</span>
                <span className="text-[10px] text-on-surface-variant/80 font-bold tracking-wide uppercase leading-none mt-0.5">{userRole}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Subscription Expiry Banner */}
        {!isLoadingSub && isExpired && (
          <div className="bg-error/10 border-b border-error/20 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
              </div>
              <div>
                <p className="text-error font-bold text-sm">Subscription Expired</p>
                <p className="text-on-surface-variant text-xs font-medium mt-0.5">Renew your plan to restore premium features.</p>
              </div>
            </div>
            <Link href="/settings/subscription" className="px-4 py-2 bg-error text-on-error text-xs font-bold rounded-lg hover:bg-error/90 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all shrink-0">
              Renew Now
            </Link>
          </div>
        )}
        {!isLoadingSub && !isExpired && daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0 && (
          <div className="bg-warning/10 border-b border-warning/20 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-warning text-[18px]">info</span>
              </div>
              <div>
                <p className="text-warning font-bold text-sm">Expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</p>
                <p className="text-on-surface-variant text-xs font-medium mt-0.5">Renew now to avoid service interruption.</p>
              </div>
            </div>
            <Link href="/settings/subscription" className="px-4 py-2 bg-warning text-on-warning text-xs font-bold rounded-lg hover:bg-warning/90 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all shrink-0">
              Renew Plan
            </Link>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <BranchProvider>
        <DashboardContent>{children}</DashboardContent>
      </BranchProvider>
    </SubscriptionProvider>
  );
}
