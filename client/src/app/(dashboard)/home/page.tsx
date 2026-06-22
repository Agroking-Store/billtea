'use client';

import React, { useState } from 'react';

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

export default function DashboardHome() {
  const [hoveredInvoicePoint, setHoveredInvoicePoint] = useState<SalesDataPoint | null>(null);
  const [hoveredQuotationPoint, setHoveredQuotationPoint] = useState<SalesDataPoint | null>(null);

  return (
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
  );
}
