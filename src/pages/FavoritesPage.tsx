import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Trash2 } from 'lucide-react';
import { Card, Button, EmptyState } from '@/components/ui';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { getToolById } from '@/data/toolRegistry';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavoritesStore();

  const favTools = favorites
    .map((id) => getToolById(id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-color">
        <div>
          <h1 className="text-3xl font-bold font-heading text-main-white">Favorite Tools</h1>
          <p className="text-sm text-muted-white mt-1">
            Pin frequently used tools for instant one-click access.
          </p>
        </div>
      </div>

      {favTools.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Star className="w-8 h-8 text-amber" />}
            title="No favorite tools yet"
            description="Click the star icon on any tool card across the directory to pin it here."
            action={{
              label: 'Browse All Tools',
              onClick: () => navigate('/tools'),
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favTools.map((tool) => (
            <Card
              key={tool.id}
              hoverable
              onClick={() => navigate(tool.route)}
              className="flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-elevated-navy text-muted-white">
                    {tool.category}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(tool.id);
                    }}
                    className="p-1 text-amber hover:text-coral transition-colors"
                    title="Remove favorite"
                  >
                    <Star className="w-4 h-4 fill-amber" />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-main-white group-hover:text-electric-blue transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-white mt-1 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-color text-xs text-electric-blue font-medium">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

