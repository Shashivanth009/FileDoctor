import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Zap, Lock, ArrowRight, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOOL_REGISTRY, searchTools, getPopularTools } from '@/services/toolRegistry';
import { ToolCard } from '@/components/navigation/ToolCard';
import { useFavorites } from '@/hooks/useFavorites';
import { getPreferences } from '@/services/storage';
import type { ToolCategory } from '@/types';

const CATEGORIES: { id: ToolCategory | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'All Tools', emoji: '🛠' },
  { id: 'pdf', label: 'PDF Clinic', emoji: '📄' },
  { id: 'image', label: 'Image Studio', emoji: '🖼' },
  { id: 'data-text', label: 'Data & Text', emoji: '📊' },
  { id: 'audio', label: 'Audio & Video', emoji: '🎵' },
  { id: 'ai', label: 'AI Utilities', emoji: '✨' },
];

export function HomePage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const { isFavorite, toggle } = useFavorites();
  const navigate = useNavigate();

  const recentToolIds = getPreferences().recentTools;
  const recentTools = recentToolIds
    .map((id) => TOOL_REGISTRY.find((t) => t.id === id))
    .filter(Boolean) as typeof TOOL_REGISTRY;

  const popularTools = getPopularTools();

  let displayedTools = query
    ? searchTools(query)
    : activeCategory === 'all'
    ? TOOL_REGISTRY
    : TOOL_REGISTRY.filter((t) => t.category === activeCategory);

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center py-8 px-4"
      >
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 text-balance">
          Your files. Your browser.{' '}
          <span className="text-brand-600 dark:text-brand-400">Your control.</span>
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-6 text-balance">
          FileDoctor is a privacy-first file processing suite. Convert, compress, and transform files directly in your browser — no uploads, no accounts, no tracking.
        </p>

        {/* Hero search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveCategory('all'); }}
            placeholder="Search tools — try 'compress', 'merge', or 'OCR'…"
            className="input pl-11 h-12 text-base shadow-sm"
            aria-label="Search all tools"
          />
        </div>
      </motion.section>

      {/* Privacy badges */}
      <section aria-label="Privacy features" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <Lock className="w-4 h-4 text-brand-500" />, title: 'Processed locally', desc: 'Files never leave your browser for core operations.' },
          { icon: <Shield className="w-4 h-4 text-brand-500" />, title: 'No account needed', desc: 'Open and use immediately — no sign-up required.' },
          { icon: <Zap className="w-4 h-4 text-brand-500" />, title: 'Real processing', desc: 'Actual file conversion and transformation, not demos.' },
        ].map((item) => (
          <div key={item.title} className="card p-4 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/30 shrink-0">{item.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Popular tools */}
      {!query && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Popular Tools</h2>
            <button onClick={() => navigate('/tools')} className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} isFavorite={isFavorite(tool.id)} onFavoriteToggle={toggle} />
            ))}
          </div>
        </section>
      )}

      {/* Recent tools */}
      {!query && recentTools.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recently Used</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentTools.slice(0, 4).map((tool) => (
              <ToolCard key={tool.id} tool={tool} isFavorite={isFavorite(tool.id)} onFavoriteToggle={toggle} compact />
            ))}
          </div>
        </section>
      )}

      {/* Browse by category / search results */}
      <section>
        {query ? (
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            {displayedTools.length} result{displayedTools.length !== 1 ? 's' : ''} for "{query}"
          </h2>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Browse by Category</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </>
        )}

        {displayedTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} isFavorite={isFavorite(tool.id)} onFavoriteToggle={toggle} />
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-gray-500 dark:text-gray-400">No tools match your search.</p>
            <button onClick={() => setQuery('')} className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-2">
              Clear search
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 pt-6 pb-2 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          FileDoctor · No file-upload server for core operations · Privacy by design · Open in your browser
        </p>
        <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">
          Built with React, Vite, pdf-lib, pdfjs-dist, and browser APIs.
        </p>
      </footer>
    </div>
  );
}
