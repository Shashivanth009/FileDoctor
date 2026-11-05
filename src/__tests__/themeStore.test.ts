import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '@/stores/themeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    document.documentElement.className = '';
  });

  it('initializes with default or persisted theme', () => {
    const state = useThemeStore.getState();
    expect(state.mode).toBeDefined();
    expect(['dark', 'light']).toContain(state.resolved);
  });

  it('switches to light mode and applies light class to html element', () => {
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().resolved).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('switches to dark mode and applies dark class to html element', () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});

