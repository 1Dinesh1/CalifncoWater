import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';

export const THEME_COLORS = {
  light: {
    isDark: false,
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9',
    surfaceElevated: '#ffffff',
    card: '#ffffff',
    cardBorder: '#e2e8f0',
    border: '#e2e8f0',
    borderSubtle: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    primary: '#0284c7',
    primaryDark: '#0369a1',
    primaryLight: '#e0f2fe',
    accent: '#0ea5e9',
    success: '#10b981',
    successBg: '#dcfce7',
    warning: '#f59e0b',
    warningBg: '#fef3c7',
    danger: '#ef4444',
    dangerBg: '#fee2e2',
    statusBar: 'dark',
    shadowColor: '#0f172a',
  },
  dark: {
    isDark: true,
    background: '#090d16',
    surface: '#131b2e',
    surfaceSubtle: '#1e293b',
    surfaceElevated: '#1a243b',
    card: '#131b2e',
    cardBorder: '#23324d',
    border: '#23324d',
    borderSubtle: '#182438',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textSubtle: '#64748b',
    inputBg: '#0b1120',
    inputBorder: '#334155',
    primary: '#38bdf8',
    primaryDark: '#0284c7',
    primaryLight: '#082f49',
    accent: '#0ea5e9',
    success: '#34d399',
    successBg: '#064e3b',
    warning: '#fbbf24',
    warningBg: '#78350f',
    danger: '#f87171',
    dangerBg: '#7f1d1d',
    statusBar: 'light',
    shadowColor: '#000000',
  },
};

// In-memory theme preference storage that survives modal navigations & screen switches
let inMemoryThemeMode = 'system';

// If running in a web or supported environment with localStorage, use it safely
const getStoredTheme = () => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const saved = globalThis.localStorage.getItem('califnco_theme_mode');
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    }
  } catch {
    // Ignore storage read errors gracefully
  }
  return inMemoryThemeMode;
};

const persistTheme = (mode) => {
  inMemoryThemeMode = mode;
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.setItem('califnco_theme_mode', mode);
    }
  } catch {
    // Ignore storage write errors gracefully
  }
};

const ThemeContext = createContext({
  themeMode: 'system',
  isDark: false,
  theme: THEME_COLORS.light,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(getStoredTheme);
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme() || 'light');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

  const setThemeMode = (mode) => {
    if (['light', 'dark', 'system'].includes(mode)) {
      setThemeModeState(mode);
      persistTheme(mode);
    }
  };

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [themeMode, systemScheme]);

  const theme = useMemo(() => {
    return isDark ? THEME_COLORS.dark : THEME_COLORS.light;
  }, [isDark]);

  const contextValue = useMemo(() => ({
    themeMode,
    isDark,
    theme,
    setThemeMode,
    toggleTheme,
  }), [themeMode, isDark, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeMode: 'light',
      isDark: false,
      theme: THEME_COLORS.light,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

export default ThemeContext;
