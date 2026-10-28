import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ToolCard } from '@/components/navigation/ToolCard';
import { TOOL_REGISTRY, searchTools } from '@/services/toolRegistry';
import { useFavorites } from '@/hooks/useFavorites';
import type { ToolCategory } from '@/types';

const CATEGORIES: { id: ToolCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pdf', label: 'PDF' },
  { id: 'image', label: 'Images' },
  { id: 'data-text', label: 'Data & Text' },
  { id: 'audio', label: 'Audio' },
  { id: 'ai', label: 'AI' },
];

export function AllToolsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');
  const { isFavorite, toggle } = useFavorites();

  const tools = query
    ? searchTools(query)
    : category === 'all'
    ? TOOL_REGISTRY
    : TOOL_REGISTRY.filter((t) => t.category === category);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={LayoutGrid} title="All Tools" description={`${TOOL_REGISTRY.length} tools available`} />

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCategory('all'); }}
          placeholder="Filter tools…"
          className="input flex-1"
          aria-label="Filter tools"
        />
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === cat.id && !query ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {tools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} isFavorite={isFavorite(tool.id)} onFavoriteToggle={toggle} />
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">No tools match "{query}"</p>
          <button onClick={() => setQuery('')} className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-2">Clear</button>
        </div>
      )}
    </div>
  );
}
