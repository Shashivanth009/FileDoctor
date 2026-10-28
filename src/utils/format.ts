/**
 * Format a byte count into a human-readable string.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format a duration in seconds to mm:ss or hh:mm:ss.
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a timestamp into a locale date+time string.
 */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Compute actual size reduction as a percentage string.
 * Returns null when the output is larger than the input.
 */
export function formatSizeReduction(originalBytes: number, outputBytes: number): string {
  if (originalBytes === 0) return '—';
  const delta = originalBytes - outputBytes;
  const pct = (delta / originalBytes) * 100;
  if (pct > 0) return `-${pct.toFixed(1)}%`;
  if (pct < 0) return `+${Math.abs(pct).toFixed(1)}%`;
  return '0%';
}
