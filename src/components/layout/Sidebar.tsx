import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  FileText,
  Image,
  Music,
  Database,
  Sparkles,
  Minimize2,
  Clock,
  Star,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Logo } from './Logo';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFavoritesStore } from '@/stores/favoritesStore';

interface NavItem {
  name: string;
  route: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor?: string;
  badge?: number | string;
}

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore();
  const favorites = useFavoritesStore((s) => s.favorites);
  const location = useLocation();

  const primaryNav: NavItem[] = [
    { name: 'Overview', route: '/', icon: Home },
    { name: 'Creation Studio', route: '/create', icon: PlusCircle, accentColor: '#48DCC7', badge: 'New' },
    { name: 'All Tools', route: '/tools', icon: LayoutGrid },
    { name: 'PDF Clinic', route: '/pdf', icon: FileText, accentColor: '#FF788C' },
    { name: 'Image Studio', route: '/image', icon: Image, accentColor: '#48DCC7' },
    { name: 'Audio & Video', route: '/audio-video', icon: Music, accentColor: '#9B8AFF' },
    { name: 'Data & Text', route: '/data-text', icon: Database, accentColor: '#496BFF' },
    { name: 'AI Utilities', route: '/ai', icon: Sparkles, accentColor: '#C4B5FD' },
    { name: 'Compression Center', route: '/compression', icon: Minimize2, accentColor: '#48DCC7' },
  ];

  const utilityNav: NavItem[] = [
    { name: 'Recent Operations', route: '/recent', icon: Clock },
    { name: 'Favorites', route: '/favorites', icon: Star, badge: favorites.length > 0 ? favorites.length : undefined },
    { name: 'Privacy Center', route: '/privacy', icon: Shield },
    { name: 'Settings', route: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-deep-navy border-r border-border-color transition-all duration-300 ease-in-out select-none ${
        sidebarCollapsed ? 'w-[76px]' : 'w-[250px]'
      }`}
    >
      {/* Brand Logo */}
      <div className={`h-16 flex items-center border-b border-border-color px-4 ${
        sidebarCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        <Logo size={sidebarCollapsed ? 'sm' : 'md'} showText={!sidebarCollapsed} />
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-muted-white hover:text-main-white hover:bg-surface-navy transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        <div>
          {!sidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-white/60 mb-2">
              Workspace
            </p>
          )}
          <nav className="space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.route === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.route);

              return (
                <NavLink
                  key={item.route}
                  to={item.route}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-surface-navy text-main-white font-semibold'
                      : 'text-muted-white hover:bg-surface-navy/50 hover:text-main-white'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {/* Left active vertical indicator bar */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md"
                      style={{ backgroundColor: item.accentColor || '#496BFF' }}
                    />
                  )}
                  <Icon
                    className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ color: isActive && item.accentColor ? item.accentColor : undefined }}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border-color pt-4">
          {!sidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-white/60 mb-2">
              System
            </p>
          )}
          <nav className="space-y-1">
            {utilityNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.route);

              return (
                <NavLink
                  key={item.route}
                  to={item.route}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-surface-navy text-main-white font-semibold'
                      : 'text-muted-white hover:bg-surface-navy/50 hover:text-main-white'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-electric-blue" />
                  )}
                  <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate flex-1">{item.name}</span>
                      {item.badge !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-electric-blue/15 text-electric-blue">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Collapsed expand toggle button */}
      {sidebarCollapsed && (
        <div className="p-3 border-t border-border-color flex justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-muted-white hover:text-main-white hover:bg-surface-navy transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
