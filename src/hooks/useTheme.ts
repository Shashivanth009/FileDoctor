import { useState, useEffect } from 'react';
import { getPreferences, savePreferences } from '@/services/storage';
import type { Theme } from '@/types';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getPreferences().theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    savePreferences({ theme: t });
    applyTheme(t);
  }

  return { theme, setTheme };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

// Initialize theme immediately on load
const savedTheme = (() => {
  try { return (JSON.parse(localStorage.getItem('fd-preferences') ?? '{}') as { theme?: Theme }).theme ?? 'system'; }
  catch { return 'system' as Theme; }
})();
applyTheme(savedTheme);
