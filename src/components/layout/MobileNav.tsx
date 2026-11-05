import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
} from 'lucide-react';
import { Logo } from './Logo';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ open, onClose }) => {
  const links = [
    { name: 'Overview', route: '/', icon: Home },
    { name: 'All Tools', route: '/tools', icon: LayoutGrid },
    { name: 'PDF Clinic', route: '/pdf', icon: FileText, color: '#FF788C' },
    { name: 'Image Studio', route: '/image', icon: Image, color: '#48DCC7' },
    { name: 'Audio & Video', route: '/audio-video', icon: Music, color: '#9B8AFF' },
    { name: 'Data & Text', route: '/data-text', icon: Database, color: '#496BFF' },
    { name: 'AI Utilities', route: '/ai', icon: Sparkles, color: '#C4B5FD' },
    { name: 'Compression Center', route: '/compression', icon: Minimize2, color: '#48DCC7' },
    { name: 'Recent Operations', route: '/recent', icon: Clock },
    { name: 'Favorites', route: '/favorites', icon: Star },
    { name: 'Privacy Center', route: '/privacy', icon: Shield },
    { name: 'Settings', route: '/settings', icon: Settings },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-navy/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-4/5 max-w-xs bg-deep-navy border-r border-border-color h-full flex flex-col p-4 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border-color">
              <Logo size="md" />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-white hover:text-main-white hover:bg-surface-navy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-1">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.route}
                    to={item.route}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-surface-navy text-main-white font-semibold'
                          : 'text-muted-white hover:bg-surface-navy/50 hover:text-main-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-border-color text-xs text-muted-white text-center">
              100% Client-side · Private by design
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

