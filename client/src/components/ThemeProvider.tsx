'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getUser } from '../lib/auth';
import { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from '../lib/theme';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  refreshTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  const applyThemeVars = (themeSettings: any, currentIsDark: boolean) => {
    const root = document.documentElement;
    const settings = currentIsDark ? themeSettings.darkTheme : themeSettings.lightTheme;
    const defaultTheme = currentIsDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
    
    // First, clear any previously set inline variables that are not in settings
    for (const key of Object.keys(defaultTheme)) {
      if (!settings || !settings[key]) {
        root.style.removeProperty(key);
      }
    }

    // Then set the customized variables
    if (settings) {
      for (const [key, value] of Object.entries(settings)) {
        if (value) {
          root.style.setProperty(key, value as string);
          root.style.setProperty(key.replace('--', '--color-'), value as string);
        }
      }
    }
  };

  const refreshTheme = async () => {
    try {
      const user = getUser();
      if (!user?.companyId) return;
      const res = await apiFetch(`/theme-settings/${user.companyId}`);
      const data = await res.json();
      if (data.success && data.settings) {
        localStorage.setItem('themeSettings', JSON.stringify(data.settings));
        // Apply immediately based on current isDark state
        const storedTheme = localStorage.getItem('theme');
        applyThemeVars(data.settings, storedTheme === 'dark');
      }
    } catch (e) {
      console.error('Failed to fetch theme settings', e);
    }
  };

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme');
    const isDarkState = storedTheme === 'dark';
    if (isDarkState) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    
    // Apply cached settings immediately to prevent FOUC if possible
    const cachedSettingsStr = localStorage.getItem('themeSettings');
    if (cachedSettingsStr) {
      try {
        const cachedSettings = JSON.parse(cachedSettingsStr);
        applyThemeVars(cachedSettings, isDarkState);
      } catch (e) {}
    }

    // Sync with backend
    refreshTheme();
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    const root = document.documentElement;
    if (nextIsDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    const cachedSettingsStr = localStorage.getItem('themeSettings');
    if (cachedSettingsStr) {
      try {
        const cachedSettings = JSON.parse(cachedSettingsStr);
        applyThemeVars(cachedSettings, nextIsDark);
      } catch (e) {}
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, refreshTheme }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden', display: 'contents' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
