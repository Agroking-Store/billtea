"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch, getUser } from "../../../../lib/auth";
import { THEME_SECTIONS, DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from "../../../../lib/theme";
import { useTheme } from "../../../../components/ThemeProvider";

type Theme = "light" | "dark";

export default function ThemeSettingsPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lightThemeData, setLightThemeData] = useState<Record<string, string>>({});
  const [darkThemeData, setDarkThemeData] = useState<Record<string, string>>({});
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

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={toggleTheme}
              className="btn-primary rounded-xl px-5 py-2 whitespace-nowrap"
            >
              {theme === "dark" ? "🌙 Dark Theme Palette" : "☀️ Light Theme Palette"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            {THEME_SECTIONS.map((section) => (
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
                          className="glass-input rounded-lg px-3 py-2 w-36 uppercase font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT PANEL - LIVE PREVIEW */}
          <div className={`col-span-1 lg:col-span-4 ${theme === "dark" ? "dark" : ""}`} style={previewStyle}>
            <div className="glass-elevated rounded-2xl p-6 sticky top-8 text-on-background bg-background">
              <h2 className="text-2xl font-semibold mb-6">Live Preview</h2>

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

              {/* Preview Card */}
              <div className="glass-panel rounded-xl p-5 mt-6">
                <h3 className="text-lg font-semibold mb-4 text-on-surface">Card Preview</h3>
                <div className="rounded-xl bg-secondary text-on-secondary p-5 shadow-lg">
                  <p className="text-sm opacity-90">Active Users</p>
                  <h2 className="text-4xl font-bold mt-2">2,847</h2>
                  <p className="mt-4 text-sm font-medium">▲ 18% from last month</p>
                </div>
              </div>
              
              {/* Error State Preview */}
              <div className="rounded-xl bg-error-container p-4 mt-6 flex items-center gap-3">
                 <span className="text-error font-bold material-symbols-outlined">warning</span>
                 <p className="text-sm text-on-error-container">Critical system alert example.</p>
              </div>

              {/* Buttons */}
              <div className="grid gap-3 mt-8">
                <button 
                  onClick={handleApplyTheme}
                  disabled={saving}
                  className="btn-primary rounded-xl py-3 font-medium flex justify-center items-center gap-2"
                >
                  {saving ? "Applying..." : "Apply Global Theme"}
                </button>

                <button 
                  onClick={handleResetDefaults}
                  className="glass-button rounded-xl py-3 font-medium text-error border-error-container hover:bg-error-container"
                >
                  Reset Palette Defaults
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </main>
  );
}