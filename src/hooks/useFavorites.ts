import { useState, useCallback } from 'react';
import { getPreferences, toggleFavoriteTool } from '@/services/storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => getPreferences().favoriteTools);

  const toggle = useCallback((toolId: string) => {
    const isNowFav = toggleFavoriteTool(toolId);
    setFavorites((prev) =>
      isNowFav ? [...prev, toolId] : prev.filter((id) => id !== toolId)
    );
    return isNowFav;
  }, []);

  const isFavorite = useCallback((toolId: string) => favorites.includes(toolId), [favorites]);

  return { favorites, toggle, isFavorite };
}
