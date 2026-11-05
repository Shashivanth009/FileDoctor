import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ShieldCheck, Filter } from 'lucide-react';
import { Card, Input, Tabs } from '@/components/ui';
import { tools, categories, searchTools } from '@/data/toolRegistry';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { ToolCategory } from '@/types';

export const AllTools: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const tabItems = [
    { id: 'all', label: `All Tools (${tools.length})` },
    ...categories.map((c) => ({
      id: c.id,
      label: c.name,
      badge: tools.filter((t) => t.category === c.id).length,
    })),
  ];

  let displayTools = query ? searchTools(query) : tools;
  if (selectedCategory !== 'all') {
    displayTools = displayTools.filter((t) => t.category === selectedCategory);
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-main-white">Directory of All Tools</h1>
        <p className="text-sm text-muted-white mt-1">
          Every tool is private, runs 100% inside your browser, and requires no file uploads.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-96">
          <Input
            icon={<Search className="w-4 h-4" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, format, or keyword (e.g. compress, EXIF, XLSX)..."
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        tabs={tabItems}
        activeTab={selectedCategory}
        onChange={setSelectedCategory}
      />

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
        {displayTools.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-white">
            No tools match "{query}". Try searching for "PDF", "image", "convert", or "compress".
          </div>
        ) : (
          displayTools.map((tool) => (
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
                    className="p-1 text-muted-white hover:text-amber transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${isFavorite(tool.id) ? 'fill-amber text-amber' : ''}`}
                    />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-main-white group-hover:text-electric-blue transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-white mt-1 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-color text-[11px] text-muted-white">
                <span className="text-success font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Client-side
                </span>
                <span className="text-electric-blue group-hover:translate-x-0.5 transition-transform">
                  Launch →
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

