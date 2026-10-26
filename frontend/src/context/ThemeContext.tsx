import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  getStoredThemeMode,
  resolveTheme,
  type ThemeMode,
} from './themeApply';

export type { ThemeMode };
export { THEME_STORAGE_KEY };

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(getStoredThemeMode()),
  );

  useLayoutEffect(() => {
    const active = applyThemeToDocument(themeMode);
    setResolvedTheme(active);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeMode === 'system') {
        setResolvedTheme(applyThemeToDocument('system'));
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore local storage errors
    }
    setResolvedTheme(applyThemeToDocument(mode));
  }, []);

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode }),
    [themeMode, resolvedTheme, setThemeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
