import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { FileHistoryDrawer } from './FileHistoryDrawer';
import { useSettingsStore } from '@/stores/settingsStore';

export const Layout: React.FC = () => {
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [fileHistoryOpen, setFileHistoryOpen] = useState(false);

  // Keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-ink-navy text-main-white flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[250px]'
        }`}
      >
        <Header
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleMobileNav={() => setMobileNavOpen(true)}
          onOpenFileHistory={() => setFileHistoryOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* File History Drawer */}
      <FileHistoryDrawer
        open={fileHistoryOpen}
        onClose={() => setFileHistoryOpen(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

