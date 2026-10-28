import { useState, useEffect, useCallback } from 'react';
import { getHistory, saveHistoryEntry, deleteHistoryEntry, clearHistory as clearAll } from '@/services/storage';
import type { HistoryEntry } from '@/types';
import { nanoid } from '@/utils/nanoid';

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then((h) => { setEntries(h); setLoading(false); });
  }, []);

  const addEntry = useCallback(async (entry: Omit<HistoryEntry, 'id'>) => {
    const full: HistoryEntry = { ...entry, id: nanoid() };
    await saveHistoryEntry(full);
    setEntries((prev) => [full, ...prev].slice(0, 50));
    return full.id;
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    await deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHistory = useCallback(async () => {
    await clearAll();
    setEntries([]);
  }, []);

  return { entries, loading, addEntry, removeEntry, clearHistory };
}
