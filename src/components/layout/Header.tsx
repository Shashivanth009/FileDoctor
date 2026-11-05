import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, Sun, Moon, Laptop, ShieldCheck, Clock, Plus } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { getHistory, HISTORY_UPDATED_EVENT } from '@/services/historyService';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onToggleMobileNav: () => void;
  onOpenFileHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onToggleMobileNav,
  onOpenFileHistory,
}) => {
  const { mode, setMode } = useThemeStore();
  const [fileCount, setFileCount] = useState<number>(0);

  const updateCount = async () => {
    try {
      const items = await getHistory(50);
      setFileCount(items.length);
    } catch {
      setFileCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener(HISTORY_UPDATED_EVENT, updateCount);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, updateCount);
  }, []);

  const cycleTheme = () => {
    if (mode === 'dark') setMode('light');
    else if (mode === 'light') setMode('system');
    else setMode('dark');
  };

  return (
    <header className="h-14 border-b border-border-color bg-deep-navy/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 lg:px-6 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="md:hidden p-2 rounded-lg bg-surface-navy border border-border-color text-muted-white hover:text-main-white cursor-pointer shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Global Search trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-navy border border-border-color hover:border-electric-blue/40 text-muted-white hover:text-main-white text-xs transition-all cursor-pointer w-28 xs:w-40 sm:w-64 md:w-72"
        >
          <Search className="w-3.5 h-3.5 text-muted-white shrink-0" />
          <span className="truncate">Search tools...</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-elevated-navy px-1.5 py-0.5 rounded border border-border-color text-muted-white shrink-0">
            <span className="text-[9px]">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Create Studio Trigger */}
        <Link
          to="/create"
          title="Create documents, PDFs, graphics, or record audio"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-electric-blue to-arctic-mint text-white font-semibold text-xs shadow-md shadow-electric-blue/20 hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create</span>
        </Link>

        {/* File History trigger with live count badge */}
        <button
          type="button"
          onClick={onOpenFileHistory}
          title="File History & Vault (Persists on refresh, 1-hour expiration)"
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-surface-navy border border-border-color hover:border-electric-blue/40 hover:bg-elevated-navy text-muted-white hover:text-main-white text-xs transition-all cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-electric-blue shrink-0" />
          <span className="hidden sm:inline font-medium">File History</span>
          {fileCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-electric-blue text-white text-[10px] font-bold">
              {fileCount}
            </span>
          )}
        </button>

        {/* Privacy state badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-success text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local sandbox</span>
        </div>

        {/* Theme mode button */}
        <button
          type="button"
          onClick={cycleTheme}
          title={`Current theme: ${mode}. Click to cycle.`}
          className="p-2 rounded-lg bg-surface-navy border border-border-color text-muted-white hover:text-main-white hover:bg-elevated-navy transition-colors cursor-pointer shrink-0"
        >
          {mode === 'dark' ? (
            <Moon className="w-4 h-4 text-electric-blue" />
          ) : mode === 'light' ? (
            <Sun className="w-4 h-4 text-amber" />
          ) : (
            <Laptop className="w-4 h-4 text-arctic-mint" />
          )}
        </button>
      </div>
    </header>
  );
};

