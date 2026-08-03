"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getUser } from "../../../../lib/auth";
import { THEME_SECTIONS, QUOTATION_THEME_SECTIONS, DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from "../../../../lib/theme";
import { useTheme } from "../../../../components/ThemeProvider";

/* ────────────────────────────────────────────────────────────────────────
   Toast
   ──────────────────────────────────────────────────────────────────────── */

interface ToastMessage {
  type: 'success' | 'error';
  text: string;
}

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

function Toast({ message, onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progressKey, setProgressKey] = useState(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleClose = (ms: number) => {
    clearTimer();
    startedAtRef.current = Date.now();
    remainingRef.current = ms;
    timerRef.current = setTimeout(() => {
      handleClose();
    }, ms);
  };

  useEffect(() => {
    if (!message) return;

    setLeaving(false);
    setPaused(false);
    setProgressKey((k) => k + 1);
    const enterTimer = setTimeout(() => setVisible(true), 10);

    scheduleClose(duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const handleClose = () => {
    clearTimer();
    setLeaving(true);
    setVisible(false);
    setTimeout(() => {
      onClose();
      setLeaving(false);
    }, 300);
  };

  const handleMouseEnter = () => {
    if (!message) return;
    setPaused(true);
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(remainingRef.current - elapsed, 0);
    clearTimer();
  };

  const handleMouseLeave = () => {
    if (!message) return;
    setPaused(false);
    scheduleClose(remainingRef.current);
  };

  if (!message && !leaving) return null;

  const isSuccess = message?.type === 'success';

  return (
    <div
      className="fixed top-6 right-6 z-[1100] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`pointer-events-auto relative overflow-hidden flex items-start gap-4 min-w-[320px] max-w-md p-5 rounded-2xl border shadow-2xl backdrop-blur-sm transition-all duration-300 ease-out ${
          isSuccess
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        } ${
          visible
            ? 'opacity-100 translate-x-0 translate-y-0'
            : 'opacity-0 translate-x-4 -translate-y-1'
        }`}
      >
        <span
          className={`material-symbols-outlined mt-0.5 p-1 rounded-full shrink-0 ${
            isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}
        >
          {isSuccess ? 'check_circle' : 'error'}
        </span>
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{isSuccess ? 'Success' : 'Error'}</h4>
          <p className="text-sm opacity-90 leading-relaxed whitespace-pre-line">{message?.text}</p>
        </div>
        <button
          onClick={handleClose}
          aria-label="Dismiss notification"
          className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
          <div
            key={progressKey}
            className={`h-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{
              animation: `toast-countdown ${duration}ms linear forwards`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes toast-countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Theme Settings Page
   ──────────────────────────────────────────────────────────────────────── */

type Theme = "light" | "dark";

export default function ThemeSettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("dark");
  const [lightThemeData, setLightThemeData] = useState<Record<string, string>>({});
  const [darkThemeData, setDarkThemeData] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"global" | "quotation">("global");
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const { refreshTheme } = useTheme();

  useEffect(() => {
    const fetchSettings = async () => {
      const user = getUser();
      if (!user?.companyId) return;
      try {
        const res = await apiFetch(`/theme-settings/${user.companyId}`);
        const data = await res.json();
        if (data.success && data.settings) {
          setLightThemeData(data.settings.lightTheme || {});
          setDarkThemeData(data.settings.darkTheme || {});
        }
      } catch (e) {
        console.error("Failed to fetch theme settings", e);
      }
    };
    fetchSettings();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleColorChange = (key: string, value: string) => {
    if (key.startsWith("--quo-")) {
      setDarkThemeData((prev) => ({ ...prev, [key]: value }));
      setLightThemeData((prev) => ({ ...prev, [key]: value }));
    } else {
      if (theme === "dark") {
        setDarkThemeData((prev) => ({ ...prev, [key]: value }));
      } else {
        setLightThemeData((prev) => ({ ...prev, [key]: value }));
      }
    }
  };

  const handleApplyTheme = async () => {
    setSaving(true);
    const user = getUser();
    if (!user?.companyId) {
      setSaving(false);
      return;
    }
    try {
      const res = await apiFetch(`/theme-settings/${user.companyId}`, {
        method: "PUT",
        body: JSON.stringify({
          lightTheme: lightThemeData,
          darkTheme: darkThemeData,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save theme settings");
      }
      await refreshTheme();
      setToast({ type: 'success', text: `${activeTab === "global" ? (theme === "dark" ? "Dark" : "Light") : "Quotation"} theme saved successfully!` });
    } catch (e: any) {
      console.error("Failed to save theme settings", e);
      setToast({ type: 'error', text: e.message || "Failed to save theme settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (theme === "dark") {
      setDarkThemeData({});
    } else {
      setLightThemeData({});
    }
    // We can also trigger an auto-save here if we want to reset globally immediately
    // await handleApplyTheme(); 
  };

  const currentData = theme === "dark" ? darkThemeData : lightThemeData;
  const defaults = theme === "dark" ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
  const getValue = (key: string) => currentData[key] || defaults[key] || "#000000";

  // Create inline styles for the live preview to reflect unsaved changes
  const previewStyle = useMemo(() => {
    const style: any = {};
    for (const [key, val] of Object.entries(defaults)) {
      const activeVal = currentData[key] || val;
      style[key] = activeVal;
      // Tailwind v4 uses --color- prefix for utility classes, so we must override both locally
      style[key.replace('--', '--color-')] = activeVal;
    }
    return style;
  }, [currentData, defaults]);

  return (
    <>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className="flex-1 overflow-y-auto relative bg-background selection:bg-primary/30">
        <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          opacity: 0;
          animation: fadeSlideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}} />

        {/* Decorative Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-12">

          {/* HEADER */}
          <div className="mb-10 animate-fade-slide-up">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4 font-medium tracking-wide uppercase">
              <button onClick={() => router.back()} className="hover:bg-surface-container p-1 rounded-full transition-colors mr-1 group flex items-center justify-center cursor-pointer" aria-label="Go back">
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              </button>
              <span>Settings</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-primary">Theme Settings</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4 tracking-tight">Theme Settings</h1>
                <p className="text-on-surface-variant text-lg leading-relaxed">Customize your application's visual identity for {theme} mode.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="flex bg-surface-container rounded-2xl p-1 shadow-sm h-14 items-center">
                  <button
                    onClick={() => setActiveTab("global")}
                    className={`px-6 h-full rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "global" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                  >
                    Dashboard Theme
                  </button>
                  <button
                    onClick={() => setActiveTab("quotation")}
                    className={`px-6 h-full rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "quotation" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                  >
                    Quotation Theme
                  </button>
                </div>
                
                {activeTab === "global" && (
                  <button
                    onClick={toggleTheme}
                    className="group relative h-14 px-8 rounded-2xl bg-surface border border-outline-variant/30 text-on-surface font-bold flex items-center gap-3 overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="absolute inset-0 w-full h-full bg-primary/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                    <span className="text-lg">{theme === "dark" ? "🌙" : "☀️"}</span>
                    <span>{theme === "dark" ? "Dark Theme Palette" : "Light Theme Palette"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                {/* LEFT PANEL */}
            <div className="col-span-1 lg:col-span-8 space-y-6">
              {(activeTab === "global" ? THEME_SECTIONS : QUOTATION_THEME_SECTIONS).map((section) => (
                <div key={section.title} className="group/section relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/section:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-on-surface mb-8">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">palette</span>
                      </div>
                      {section.title}
                    </h3>
                  <div className="space-y-5">
                    {section.keys.map((item) => (
                      <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 max-w-[60%]">
                          <p className="font-medium text-on-surface">{item.name}</p>
                          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                            {(item as any).desc}
                          </p>
                          <p className="text-[10px] text-on-surface-variant/70 mt-1 font-mono uppercase tracking-widest">
                            {item.key}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            key={`color-${theme}-${item.key}`}
                            type="color"
                            value={getValue(item.key)}
                            onChange={(e) => handleColorChange(item.key, e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer"
                          />
                          <input
                            key={`text-${theme}-${item.key}`}
                            value={getValue(item.key)}
                            onChange={(e) => handleColorChange(item.key, e.target.value)}
                            className="glass-input px-3 py-2 rounded-lg text-sm font-mono w-24"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end pt-4">
                <div className="flex gap-4">
                  <button 
                    onClick={handleResetDefaults}
                    className="h-14 px-8 rounded-2xl text-base font-bold text-error hover:bg-error/10 transition-colors cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button 
                    onClick={handleApplyTheme}
                    disabled={saving}
                    className="group relative h-14 px-10 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                    {saving ? (
                      <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Saving...</span></>
                    ) : (
                      <><span className="material-symbols-outlined text-[20px]">save</span><span>Save {activeTab === "global" ? (theme === "dark" ? "Dark" : "Light") : "Quotation"} Theme</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL - LIVE PREVIEW */}
            <div className={`col-span-1 lg:col-span-4 ${theme === "dark" && activeTab === "global" ? "dark" : ""}`} style={previewStyle}>
              <div className="group/preview relative bg-surface border border-outline-variant/30 rounded-[2rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 sticky top-8 text-on-background bg-background">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-surface-container-lowest rounded-[1.8rem] p-6 sm:p-8">
                <h3 className="text-xl font-bold flex items-center gap-3 text-on-surface mb-8">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </div>
                  Live Preview
                </h3>

                {activeTab === "global" ? (
                  <>
                    <div className="rounded-xl bg-surface-container p-5 border border-outline-variant">
                      <div className="flex justify-between items-center mb-5">
                        <div>
                          <p className="text-sm text-on-surface-variant">Monthly Revenue</p>
                          <h3 className="text-3xl font-bold text-on-surface">$48,250</h3>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-primary text-on-primary text-sm font-medium">
                          +12.5%
                        </span>
                      </div>
                      {/* Simple Bar Chart */}
                      <div className="flex items-end justify-between h-52 gap-3 mt-8">
                        {[45, 70, 95, 60, 120, 90, 140].map((height, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-t-lg bg-primary transition-all duration-300 hover:bg-primary-fixed"
                            style={{ height: `${height}px` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel rounded-xl p-5 mt-6">
                      <h3 className="text-lg font-semibold mb-4 text-on-surface">Card Preview</h3>
                      <div className="rounded-xl bg-secondary text-on-secondary p-5 shadow-lg">
                        <p className="text-sm opacity-90">Active Users</p>
                        <h2 className="text-4xl font-bold mt-2">2,847</h2>
                        <p className="mt-4 text-sm font-medium">▲ 18% from last month</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-error-container p-4 mt-6 flex items-center gap-3">
                       <span className="text-error font-bold material-symbols-outlined">warning</span>
                       <p className="text-sm text-on-error-container">Critical system alert example.</p>
                    </div>
                  </>
                ) : (
                  <div 
                    className="rounded-lg overflow-hidden border shadow-sm flex flex-col font-sans"
                    style={{ 
                      backgroundColor: 'var(--quo-bg, #FFFFFF)', 
                      borderColor: 'var(--quo-border, #e2e2e2)' 
                    }}
                  >
                    <div 
                      className="p-4 flex items-center justify-between"
                      style={{ backgroundColor: 'var(--quo-surface, #1B1C1D)' }}
                    >
                      <div className="text-white text-xs opacity-90">YOUR LOGO</div>
                      <div className="text-right">
                        <div className="text-white text-lg font-serif tracking-widest">QUOTATION</div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div 
                        className="text-[10px] font-bold tracking-widest mb-1"
                        style={{ color: 'var(--quo-primary, #9D7E6C)' }}
                      >
                        COMPANY DETAILS
                      </div>
                      <div style={{ color: 'var(--quo-text, #1a1c1c)' }} className="text-sm font-bold">Acme Corp</div>
                      <div style={{ color: 'var(--quo-text-muted, #74777c)' }} className="text-xs">123 Business Rd, Tech City</div>
                      
                      <div className="mt-4 border rounded" style={{ borderColor: 'var(--quo-border, #e2e2e2)' }}>
                        <div 
                          className="flex text-[9px] uppercase font-bold p-2"
                          style={{ backgroundColor: 'var(--quo-surface, #1B1C1D)', color: 'var(--quo-primary, #9D7E6C)' }}
                        >
                          <div className="flex-1">Product</div>
                          <div className="w-12 text-right">Qty</div>
                          <div className="w-16 text-right">Price</div>
                        </div>
                        <div 
                          className="flex p-2 text-xs border-t"
                          style={{ backgroundColor: 'var(--quo-surface-alt, #F9F7F5)', borderColor: 'var(--quo-border, #e2e2e2)', color: 'var(--quo-text, #1a1c1c)' }}
                        >
                          <div className="flex-1 font-semibold">Premium Widget</div>
                          <div className="w-12 text-right">2</div>
                          <div className="w-16 text-right">₹1,500</div>
                        </div>
                        <div 
                          className="flex p-2 text-xs border-t"
                          style={{ backgroundColor: 'var(--quo-surface-alt, #F9F7F5)', borderColor: 'var(--quo-border, #e2e2e2)', color: 'var(--quo-text, #1a1c1c)' }}
                        >
                          <div className="flex-1 font-semibold">Support Plan</div>
                          <div className="w-12 text-right">1</div>
                          <div className="w-16 text-right">₹500</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div style={{ color: 'var(--quo-text-muted, #74777c)' }} className="text-[10px]">
                          Valid till: 30 Dec 2026
                        </div>
                        <div style={{ color: 'var(--quo-text, #1a1c1c)' }} className="text-sm font-bold">
                          Total: ₹3,500
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}