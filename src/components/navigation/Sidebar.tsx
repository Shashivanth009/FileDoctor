import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, FileText, Image, Music, Database, Sparkles,
  Clock, Star, Settings, ChevronLeft, ChevronRight, X, Stethoscope
} from 'lucide-react';
import { useState } from 'react';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  to: string;
  end?: boolean;
};

const navItems: NavItem[] = [
  { label: 'All Tools', icon: <LayoutGrid className="w-4 h-4" />, to: '/tools', end: true },
  { label: 'PDF Clinic', icon: <FileText className="w-4 h-4" />, to: '/pdf' },
  { label: 'Image Studio', icon: <Image className="w-4 h-4" />, to: '/images' },
  { label: 'Audio & Video', icon: <Music className="w-4 h-4" />, to: '/audio' },
  { label: 'Data & Text', icon: <Database className="w-4 h-4" />, to: '/data' },
  { label: 'AI Utilities', icon: <Sparkles className="w-4 h-4" />, to: '/ai' },
];

const bottomItems: NavItem[] = [
  { label: 'Recent', icon: <Clock className="w-4 h-4" />, to: '/history' },
  { label: 'Favorites', icon: <Star className="w-4 h-4" />, to: '/favorites' },
  { label: 'Settings', icon: <Settings className="w-4 h-4" />, to: '/settings' },
];

type Props = {
  collapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ collapsed = false, onToggle, isMobileOpen = false, onMobileClose }: Props) {
  const navigate = useNavigate();

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
        <button
          onClick={() => { navigate('/'); onMobileClose?.(); }}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          aria-label="FileDoctor home"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4.5 h-4.5 text-white" style={{width:'18px',height:'18px'}} />
          </div>
          {!collapsed && (
            <span className="font-semibold text-gray-900 dark:text-white text-sm">FileDoctor</span>
          )}
        </button>
        {!collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hidden md:block"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {isMobileOpen && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 md:hidden"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto" aria-label="Main navigation">
        {collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="w-full flex justify-center p-2 mb-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <ul className="flex flex-col gap-0.5" role="list">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                   ${isActive
                     ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400'
                     : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                   }
                   ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom nav */}
      <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-800">
        <ul className="flex flex-col gap-0.5" role="list">
          {bottomItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                   ${isActive
                     ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400'
                     : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                   }
                   ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}
        aria-label="Sidebar"
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 z-50 md:hidden shadow-xl"
              aria-label="Mobile navigation"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
