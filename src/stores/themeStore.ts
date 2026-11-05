import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
}

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeClass = (resolved: 'dark' | 'light') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      resolved: 'dark',
      setMode: (mode: ThemeMode) => {
        const resolved = mode === 'system' ? getSystemTheme() : mode;
        set({ mode, resolved });
        applyThemeClass(resolved);
      },
    }),
    {
      name: 'filedoctor-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.mode === 'system' ? getSystemTheme() : state.mode;
          state.resolved = resolved;
          applyThemeClass(resolved);
        }
      },
    }
  )
);
