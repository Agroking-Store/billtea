"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch, getUser } from "../../../../lib/auth";
import { THEME_SECTIONS, QUOTATION_THEME_SECTIONS, DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from "../../../../lib/theme";
import { useTheme } from "../../../../components/ThemeProvider";

type Theme = "light" | "dark";

export default function ThemeSettingsPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lightThemeData, setLightThemeData] = useState<Record<string, string>>({});
  const [darkThemeData, setDarkThemeData] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"global" | "quotation">("global");
  const [saving, setSaving] = useState(false);
  
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
    if (theme === "dark") {
      setDarkThemeData((prev) => ({ ...prev, [key]: value }));
    } else {
      setLightThemeData((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleApplyTheme = async () => {
    setSaving(true);
    const user = getUser();
    if (!user?.companyId) return;
    try {
      await apiFetch(`/theme-settings/${user.companyId}`, {
        method: "PUT",
        body: JSON.stringify({
          lightTheme: lightThemeData,
          darkTheme: darkThemeData,
        }),
      });
      await refreshTheme();
    } catch (e) {
      console.error("Failed to save theme settings", e);
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
    <main className="bg-background text-on-background min-h-screen w-full overflow-y-auto pb-20">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold">Theme Settings</h1>
            <p className="text-on-surface-variant mt-2">
              Customize your application's visual identity for {theme} mode.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="flex bg-surface-container rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setActiveTab("global")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "global" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                Dashboard Theme
              </button>
              <button
                onClick={() => setActiveTab("quotation")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "quotation" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                Quotation Theme
              </button>
            </div>
            
            {activeTab === "global" && (
              <button
                onClick={toggleTheme}
                className="btn-primary rounded-xl px-5 py-2 whitespace-nowrap text-sm h-10"
              >
                {theme === "dark" ? "🌙 Dark Theme Palette" : "☀️ Light Theme Palette"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT PANEL */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            {(activeTab === "global" ? THEME_SECTIONS : QUOTATION_THEME_SECTIONS).map((section) => (
              <div key={section.title} className="glass-panel rounded-2xl p-6">
                <h2 className="text-2xl font-semibold mb-6">{section.title}</h2>
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
            ))}
            
            <div className="flex justify-end pt-4">
              <div className="flex gap-4">
                <button 
                  onClick={handleResetDefaults}
                  className="px-6 py-3 rounded-xl font-medium text-error hover:bg-error/10 transition-colors"
                >
                  Reset Defaults
                </button>
                <button 
                  onClick={handleApplyTheme}
                  disabled={saving}
                  className="btn-primary rounded-xl px-8 py-3 font-medium flex justify-center items-center gap-2"
                >
                  {saving ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined">save</span>
                  )}
                  Save {activeTab === "global" ? (theme === "dark" ? "Dark" : "Light") : "Quotation"} Theme
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - LIVE PREVIEW */}
          <div className={`col-span-1 lg:col-span-4 ${theme === "dark" && activeTab === "global" ? "dark" : ""}`} style={previewStyle}>
            <div className="glass-elevated rounded-2xl p-6 sticky top-8 text-on-background bg-background">
              <h2 className="text-2xl font-semibold mb-6">Live Preview</h2>

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
    </main>
  );
}