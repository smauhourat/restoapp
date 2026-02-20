import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '../theme.js';

const STORAGE_KEY = 'restoapp-theme-mode';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleMode: () => {},
});

const getPreferredMode = () => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(getPreferredMode);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event) => {
      setMode(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeModeContext);
