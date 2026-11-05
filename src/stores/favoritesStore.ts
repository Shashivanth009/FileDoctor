import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;
  reorder: (from: number, to: number) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (toolId: string) => {
        const { favorites } = get();
        if (favorites.includes(toolId)) {
          set({ favorites: favorites.filter((id) => id !== toolId) });
        } else {
          set({ favorites: [...favorites, toolId] });
        }
      },
      isFavorite: (toolId: string) => get().favorites.includes(toolId),
      reorder: (from: number, to: number) => {
        const { favorites } = get();
        const updated = [...favorites];
        const [item] = updated.splice(from, 1);
        updated.splice(to, 0, item);
        set({ favorites: updated });
      },
    }),
    { name: 'filedoctor-favorites' }
  )
);
