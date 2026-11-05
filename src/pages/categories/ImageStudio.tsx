import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { Card } from '@/components/ui';
import { getToolsByCategory } from '@/data/toolRegistry';
import { useFavoritesStore } from '@/stores/favoritesStore';

export const ImageStudio: React.FC = () => {
  const navigate = useNavigate();
  const tools = getToolsByCategory('image');
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-color">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-arctic-mint/15 text-arctic-mint flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading text-main-white">Image Studio</h1>
            <p className="text-sm text-muted-white mt-1 max-w-xl">
              Compress, convert, resize, crop, strip EXIF metadata, and extract color palettes in real-time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-arctic-mint font-medium bg-arctic-mint/10 border border-arctic-mint/20 px-3 py-1.5 rounded-full w-fit">
          <ShieldCheck className="w-4 h-4" />
          <span>Canvas & WebGL Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card
            key={tool.id}
            hoverable
            onClick={() => navigate(tool.route)}
            className="flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-arctic-mint/10 text-arctic-mint flex items-center justify-center group-hover:bg-arctic-mint group-hover:text-ink-navy transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(tool.id);
                  }}
                  className="p-1 text-muted-white hover:text-amber transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${isFavorite(tool.id) ? 'fill-amber text-amber' : ''}`}
                  />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-main-white group-hover:text-arctic-mint transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-muted-white mt-1 line-clamp-2 leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-color text-[11px] text-muted-white">
              <span className="text-success font-medium">100% Client-side</span>
              <span className="text-arctic-mint group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-medium">
                Open <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

