import { Database } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ToolCard } from '@/components/navigation/ToolCard';
import { getToolsByCategory } from '@/services/toolRegistry';
import { useFavorites } from '@/hooks/useFavorites';

export function DataCategoryPage() {
  const tools = getToolsByCategory('data-text');
  const { isFavorite, toggle } = useFavorites();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Database} title="Data & Text" description="Convert between tabular formats, format code, and clean up text." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} isFavorite={isFavorite(tool.id)} onFavoriteToggle={toggle} />
        ))}
      </div>
    </div>
  );
}
