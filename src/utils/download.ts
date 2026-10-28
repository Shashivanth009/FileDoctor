import { sanitizeFileName } from './sanitize';

/**
 * Trigger a browser download for a Blob.
 * Returns the temporary object URL so the caller can revoke it when done.
 */
export function downloadBlob(blob: Blob, fileName: string): string {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeFileName(fileName);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Caller is responsible for revoking, but we revoke after a small delay as convenience
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return url;
}

/**
 * Create a temporary object URL and return a cleanup function.
 */
export function createTempUrl(blob: Blob): { url: string; revoke: () => void } {
  const url = URL.createObjectURL(blob);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}
