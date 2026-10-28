import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import type { ToolDefinition } from '@/types';

type Props = {
  tool: ToolDefinition;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  compact?: boolean;
};

const availabilityBadge: Record<ToolDefinition['availability'], { label: string; cls: string }> = {
  available: { label: 'Available', cls: 'badge-green' },
  partial: { label: 'Partial', cls: 'badge-yellow' },
  unavailable: { label: 'Unavailable', cls: 'badge-red' },
  demo: { label: 'Demo', cls: 'badge-brand' },
};

export function ToolCard({ tool, isFavorite = false, onFavoriteToggle, compact = false }: Props) {
  const navigate = useNavigate();
  // Dynamically pick icon from Lucide
  const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon] ?? Icons.File;
  const badge = availabilityBadge[tool.availability];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="card-hover p-4 flex flex-col gap-3 cursor-pointer group relative"
      onClick={() => navigate(tool.route)}
      role="article"
    >
      {/* Favorite button */}
      {onFavoriteToggle && (
        <button
          onClick={(e) => { e.stopPropagation(); onFavoriteToggle(tool.id); }}
          className={`absolute top-3 right-3 p-1 rounded transition-colors ${isFavorite ? 'text-amber-400' : 'text-gray-300 dark:text-gray-700 hover:text-amber-400'}`}
          aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
        >
          <Star className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      )}

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/30 shrink-0">
          <IconComponent className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-5">{tool.name}</p>
          {!compact && (
            <span className={badge.cls + ' mt-0.5'}>{badge.label}</span>
          )}
        </div>
      </div>

      {!compact && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{tool.description}</p>
      )}

      {!compact && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {tool.inputFormats.slice(0, 4).map((f) => (
            <span key={f} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-mono uppercase">
              {f}
            </span>
          ))}
          {tool.inputFormats.length > 4 && (
            <span className="text-xs px-1.5 py-0.5 text-gray-400">+{tool.inputFormats.length - 4}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
