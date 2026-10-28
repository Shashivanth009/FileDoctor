import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Sun, Moon, Monitor, X } from 'lucide-react';
import { searchTools } from '@/services/toolRegistry';
import type { Theme } from '@/types';

type Props = {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onMenuToggle: () => void;
};

export function TopBar({ theme, onThemeChange, onMenuToggle }: Props) {
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = query.trim() ? searchTools(query).slice(0, 6) : [];

  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setQuery(''); setIsSearchOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function selectTool(route: string) {
    navigate(route);
    setQuery('');
    setIsSearchOpen(false);
  }

  const themeOptions: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="btn-ghost p-2 md:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 relative max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsSearchOpen(true); }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search tools…"
            className="input pl-9 pr-8 h-9"
            aria-label="Search tools"
            aria-autocomplete="list"
            aria-expanded={results.length > 0}
            role="combobox"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setIsSearchOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {isSearchOpen && results.length > 0 && (
          <div
            className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
            role="listbox"
          >
            {results.map((tool) => (
              <button
                key={tool.id}
                onClick={() => selectTool(tool.route)}
                role="option"
                className="w-full flex flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tool.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{tool.description}</span>
              </button>
            ))}
          </div>
        )}

        {isSearchOpen && query && results.length === 0 && (
          <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No tools found for "{query}"</p>
          </div>
        )}
      </div>

      {/* Click-outside to close */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { setIsSearchOpen(false); }} aria-hidden="true" />
      )}

      {/* Theme switcher */}
      <div className="flex items-center gap-1 ml-auto">
        {themeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onThemeChange(opt.value)}
            className={`p-2 rounded-lg text-xs transition-colors ${theme === opt.value ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-label={`${opt.label} theme`}
            title={opt.label}
          >
            {opt.icon}
          </button>
        ))}
      </div>
    </header>
  );
}
