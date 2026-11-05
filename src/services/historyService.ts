import { HistoryEntry, ActiveToolSession } from '@/types';

const DB_NAME = 'filedoctor-db';
const DB_VERSION = 2;

const HISTORY_STORE = 'history';
const OUTPUT_STORE = 'outputs';
const INPUT_STORE = 'inputs';
const ACTIVE_SESSIONS_STORE = 'active_sessions';

// Exactly 1 hour retention as requested by user
export const FILE_EXPIRATION_MS = 60 * 60 * 1000;

export const HISTORY_UPDATED_EVENT = 'filedoctor:history-updated';

function notifyHistoryUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HISTORY_UPDATED_EVENT));
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const store = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
        store.createIndex('toolId', 'toolId', { unique: false });
      } else {
        const store = (event.target as IDBOpenDBRequest).transaction?.objectStore(HISTORY_STORE);
        if (store && !store.indexNames.contains('expiresAt')) {
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(OUTPUT_STORE)) {
        const store = db.createObjectStore(OUTPUT_STORE, { keyPath: 'id' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(INPUT_STORE)) {
        const store = db.createObjectStore(INPUT_STORE, { keyPath: 'id' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(ACTIVE_SESSIONS_STORE)) {
        const store = db.createObjectStore(ACTIVE_SESSIONS_STORE, { keyPath: 'toolId' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

/**
 * Automatically purges any files, outputs, or sessions older than 1 hour.
 */
export async function cleanupExpiredFiles(): Promise<number> {
  try {
    const db = await openDB();
    const now = Date.now();
    let purgedCount = 0;

    // 1. Clean history & associated blobs
    const historyEntries = await new Promise<HistoryEntry[]>((resolve) => {
      const tx = db.transaction(HISTORY_STORE, 'readonly');
      const store = tx.objectStore(HISTORY_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const expiredIds: string[] = [];
    for (const entry of historyEntries) {
      const expiry = entry.expiresAt || (entry.timestamp + FILE_EXPIRATION_MS);
      if (now >= expiry) {
        expiredIds.push(entry.id);
      }
    }

    if (expiredIds.length > 0) {
      const tx = db.transaction([HISTORY_STORE, OUTPUT_STORE, INPUT_STORE], 'readwrite');
      const histStore = tx.objectStore(HISTORY_STORE);
      const outStore = tx.objectStore(OUTPUT_STORE);
      const inStore = tx.objectStore(INPUT_STORE);

      for (const id of expiredIds) {
        histStore.delete(id);
        outStore.delete(id);
        inStore.delete(id);
        purgedCount++;
      }

      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }

    // 2. Clean active sessions older than 1 hour
    const activeSessions = await new Promise<ActiveToolSession[]>((resolve) => {
      const tx = db.transaction(ACTIVE_SESSIONS_STORE, 'readonly');
      const store = tx.objectStore(ACTIVE_SESSIONS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const expiredSessionTools: string[] = [];
    for (const session of activeSessions) {
      const expiry = session.expiresAt || (session.updatedAt + FILE_EXPIRATION_MS);
      if (now >= expiry) {
        expiredSessionTools.push(session.toolId);
      }
    }

    if (expiredSessionTools.length > 0) {
      const tx = db.transaction(ACTIVE_SESSIONS_STORE, 'readwrite');
      const store = tx.objectStore(ACTIVE_SESSIONS_STORE);
      for (const toolId of expiredSessionTools) {
        store.delete(toolId);
      }
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }

    if (purgedCount > 0 || expiredSessionTools.length > 0) {
      notifyHistoryUpdated();
    }

    return purgedCount;
  } catch (err) {
    console.error('Failed to run cleanupExpiredFiles:', err);
    return 0;
  }
}

// Background sweep every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    cleanupExpiredFiles();
  }, 30000);
}

/**
 * Add an operation record to history, optionally saving the input and output blobs.
 * Automatically sets 1-hour expiration.
 */
export async function addHistoryEntry(
  entry: Omit<HistoryEntry, 'expiresAt'> & { expiresAt?: number },
  inputBlob?: Blob,
  outputBlob?: Blob
): Promise<void> {
  const expiresAt = entry.expiresAt || (entry.timestamp + FILE_EXPIRATION_MS);
  const fullEntry: HistoryEntry = {
    ...entry,
    expiresAt,
    hasRetainedOutput: !!outputBlob || entry.hasRetainedOutput,
    hasRetainedInput: !!inputBlob || !!entry.hasRetainedInput,
  };

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([HISTORY_STORE, OUTPUT_STORE, INPUT_STORE], 'readwrite');
    tx.objectStore(HISTORY_STORE).put(fullEntry);

    if (outputBlob && fullEntry.outputFilename) {
      tx.objectStore(OUTPUT_STORE).put({
        id: fullEntry.id,
        blob: outputBlob,
        filename: fullEntry.outputFilename,
        savedAt: Date.now(),
        expiresAt,
      });
    }

    if (inputBlob) {
      tx.objectStore(INPUT_STORE).put({
        id: fullEntry.id,
        blob: inputBlob,
        filename: fullEntry.inputFilename,
        mimeType: fullEntry.mimeType || 'application/octet-stream',
        savedAt: Date.now(),
        expiresAt,
      });
    }

    tx.oncomplete = () => {
      notifyHistoryUpdated();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve recent history items (automatically purging expired items first).
 */
export async function getHistory(limit = 50): Promise<HistoryEntry[]> {
  await cleanupExpiredFiles();
  const db = await openDB();
  const now = Date.now();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readonly');
    const index = tx.objectStore(HISTORY_STORE).index('timestamp');
    const request = index.openCursor(null, 'prev');
    const results: HistoryEntry[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && results.length < limit) {
        const item: HistoryEntry = cursor.value;
        const expiry = item.expiresAt || (item.timestamp + FILE_EXPIRATION_MS);
        if (now < expiry) {
          results.push(item);
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a specific history entry and its input and output blobs.
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([HISTORY_STORE, OUTPUT_STORE, INPUT_STORE], 'readwrite');
    tx.objectStore(HISTORY_STORE).delete(id);
    tx.objectStore(OUTPUT_STORE).delete(id);
    tx.objectStore(INPUT_STORE).delete(id);
    tx.oncomplete = () => {
      notifyHistoryUpdated();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear all history, retained blobs, and active sessions.
 */
export async function clearHistory(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([HISTORY_STORE, OUTPUT_STORE, INPUT_STORE, ACTIVE_SESSIONS_STORE], 'readwrite');
    tx.objectStore(HISTORY_STORE).clear();
    tx.objectStore(OUTPUT_STORE).clear();
    tx.objectStore(INPUT_STORE).clear();
    tx.objectStore(ACTIVE_SESSIONS_STORE).clear();
    tx.oncomplete = () => {
      notifyHistoryUpdated();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Save an output file blob in the vault.
 */
export async function saveOutput(
  id: string,
  blob: Blob,
  filename: string,
  expiresAt = Date.now() + FILE_EXPIRATION_MS
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTPUT_STORE, 'readwrite');
    tx.objectStore(OUTPUT_STORE).put({ id, blob, filename, savedAt: Date.now(), expiresAt });
    tx.oncomplete = () => {
      notifyHistoryUpdated();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve an output file blob.
 */
export async function getOutput(id: string): Promise<{ blob: Blob; filename: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTPUT_STORE, 'readonly');
    const request = tx.objectStore(OUTPUT_STORE).get(id);
    request.onsuccess = () => {
      if (request.result) {
        if (request.result.expiresAt && Date.now() > request.result.expiresAt) {
          resolve(null);
        } else {
          resolve({ blob: request.result.blob, filename: request.result.filename });
        }
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an output blob.
 */
export async function deleteOutput(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTPUT_STORE, 'readwrite');
    tx.objectStore(OUTPUT_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Save an input file blob.
 */
export async function saveInput(
  id: string,
  blob: Blob,
  filename: string,
  mimeType = 'application/octet-stream',
  expiresAt = Date.now() + FILE_EXPIRATION_MS
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INPUT_STORE, 'readwrite');
    tx.objectStore(INPUT_STORE).put({ id, blob, filename, mimeType, savedAt: Date.now(), expiresAt });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve an input file blob.
 */
export async function getInput(id: string): Promise<{ blob: Blob; filename: string; mimeType: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INPUT_STORE, 'readonly');
    const request = tx.objectStore(INPUT_STORE).get(id);
    request.onsuccess = () => {
      if (request.result) {
        if (request.result.expiresAt && Date.now() > request.result.expiresAt) {
          resolve(null);
        } else {
          resolve({
            blob: request.result.blob,
            filename: request.result.filename,
            mimeType: request.result.mimeType,
          });
        }
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// -------------------------------------------------------------
// ACTIVE TOOL SESSIONS (Prevents file deletion on tab refresh)
// -------------------------------------------------------------

/**
 * Save active working session for a tool so refreshing the tab retains the file and settings.
 * Automatically expires 1 hour after last update.
 */
export async function saveActiveSession(session: Omit<ActiveToolSession, 'updatedAt' | 'expiresAt'> & { updatedAt?: number; expiresAt?: number }): Promise<void> {
  const db = await openDB();
  const now = Date.now();
  const fullSession: ActiveToolSession = {
    ...session,
    updatedAt: session.updatedAt || now,
    expiresAt: session.expiresAt || (now + FILE_EXPIRATION_MS),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ACTIVE_SESSIONS_STORE, 'readwrite');
    tx.objectStore(ACTIVE_SESSIONS_STORE).put(fullSession);
    tx.oncomplete = () => {
      notifyHistoryUpdated();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve active working session for a tool. If expired, automatically removes it and returns null.
 */
export async function getActiveSession(toolId: string): Promise<ActiveToolSession | null> {
  const db = await openDB();
  const now = Date.now();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ACTIVE_SESSIONS_STORE, 'readwrite');
    const store = tx.objectStore(ACTIVE_SESSIONS_STORE);
    const request = store.get(toolId);

    request.onsuccess = () => {
      const session: ActiveToolSession | undefined = request.result;
      if (!session) {
        resolve(null);
        return;
      }

      if (session.expiresAt && now >= session.expiresAt) {
        // Expired, delete it
        store.delete(toolId);
        resolve(null);
      } else {
        resolve(session);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear the active working session for a tool (e.g. when user clicks "Change file" or "Process another").
 */
export async function clearActiveSession(toolId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ACTIVE_SESSIONS_STORE, 'readwrite');
    tx.objectStore(ACTIVE_SESSIONS_STORE).delete(toolId);
    tx.oncomplete = () => {
      notifyHistoryUpdated();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Storage quota estimate
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      return { usage: est.usage || 0, quota: est.quota || 0 };
    } catch {
      return null;
    }
  }
  return null;
}
