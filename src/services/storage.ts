import { openDB, type IDBPDatabase } from 'idb';
import type { HistoryEntry, AppPreferences } from '@/types';

const DB_NAME = 'file-doctor-db';
const DB_VERSION = 1;
const HISTORY_STORE = 'history';
const OUTPUTS_STORE = 'outputs';

type FileDoctorDB = {
  [HISTORY_STORE]: HistoryEntry;
  [OUTPUTS_STORE]: { id: string; blob: Blob; createdAt: number };
};

let dbInstance: IDBPDatabase<FileDoctorDB> | null = null;

async function getDb(): Promise<IDBPDatabase<FileDoctorDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<FileDoctorDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const store = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains(OUTPUTS_STORE)) {
        db.createObjectStore(OUTPUTS_STORE, { keyPath: 'id' });
      }
    },
  });
  return dbInstance;
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  const db = await getDb();
  await db.put(HISTORY_STORE, entry);
}

export async function getHistory(limit = 50): Promise<HistoryEntry[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex(HISTORY_STORE, 'timestamp');
  return all.reverse().slice(0, limit);
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(HISTORY_STORE, id);
  await db.delete(OUTPUTS_STORE, id);
}

export async function clearHistory(): Promise<void> {
  const db = await getDb();
  await db.clear(HISTORY_STORE);
  await db.clear(OUTPUTS_STORE);
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

export async function saveOutput(id: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put(OUTPUTS_STORE, { id, blob, createdAt: Date.now() });
}

export async function getOutput(id: string): Promise<Blob | null> {
  const db = await getDb();
  const record = await db.get(OUTPUTS_STORE, id);
  return record?.blob ?? null;
}

export async function deleteOutput(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(OUTPUTS_STORE, id);
}

// ─── Preferences (localStorage) ───────────────────────────────────────────────

const PREFS_KEY = 'fd-preferences';

const defaultPrefs: AppPreferences = {
  theme: 'system',
  favoriteTools: [],
  recentTools: [],
  retainOutputs: false,
  maxStoredOutputs: 10,
};

export function getPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...defaultPrefs };
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return { ...defaultPrefs };
  }
}

export function savePreferences(prefs: Partial<AppPreferences>): void {
  try {
    const current = getPreferences();
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch {
    // localStorage may be unavailable in restricted environments
  }
}

export function addRecentTool(toolId: string): void {
  const prefs = getPreferences();
  const recent = [toolId, ...prefs.recentTools.filter((id) => id !== toolId)].slice(0, 10);
  savePreferences({ recentTools: recent });
}

export function toggleFavoriteTool(toolId: string): boolean {
  const prefs = getPreferences();
  const isFav = prefs.favoriteTools.includes(toolId);
  const favorites = isFav
    ? prefs.favoriteTools.filter((id) => id !== toolId)
    : [...prefs.favoriteTools, toolId];
  savePreferences({ favoriteTools: favorites });
  return !isFav;
}
