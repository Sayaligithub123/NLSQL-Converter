export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'nlsql_theme_mode';

export function getStoredThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    const legacy = localStorage.getItem('nlsql_user_preferences');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'system') {
        return parsed.themeMode;
      }
      if (typeof parsed.darkMode === 'boolean') {
        return parsed.darkMode ? 'dark' : 'light';
      }
    }
  } catch {
    // ignore storage errors
  }
  return 'system';
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemeToDocument(mode: ThemeMode): 'light' | 'dark' {
  const active = resolveTheme(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', active === 'dark');
  root.style.colorScheme = active;
  root.dataset.theme = active;
  return active;
}
