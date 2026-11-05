import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  defaultCompression: 'light' | 'balanced' | 'strong' | 'maximum';
  defaultImageFormat: 'png' | 'jpeg' | 'webp';
  outputNaming: 'suffix' | 'prefix' | 'replace';
  historyRetention: number; // days, 0 = forever
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
  setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  toggleSidebar: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      defaultCompression: 'balanced',
      defaultImageFormat: 'webp',
      outputNaming: 'suffix',
      historyRetention: 30,
      reducedMotion: false,
      sidebarCollapsed: false,
      setSetting: (key, value) => set({ [key]: value } as any),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    { name: 'filedoctor-settings' }
  )
);
