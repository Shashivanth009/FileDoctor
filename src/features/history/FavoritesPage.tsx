import { Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ToolCard } from '@/components/navigation/ToolCard';
import { useFavorites } from '@/hooks/useFavorites';
import { getToolById } from '@/services/toolRegistry';

export function FavoritesPage() {
  const { favorites, isFavorite, toggle } = useFavorites();
  const tools = favorites.map((id) => getToolById(id)).filter(Boolean) as ReturnType<typeof getToolById>[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Star} title="Favorites" description="Your bookmarked tools for quick access." />

      {tools.length === 0 ? (
        <div className="card p-10 text-center">
          <Star className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No favorites yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Click the ☆ on any tool card to add it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => tool && (
            <ToolCard key={tool.id} tool={tool} isFavorite={isFavorite(tool.id)} onFavoriteToggle={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
