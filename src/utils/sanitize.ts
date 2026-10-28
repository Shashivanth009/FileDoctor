/**
 * Sanitize a filename to remove path traversal and invalid characters.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 255) || 'file';
}

/**
 * Add or replace the extension of a filename.
 */
export function withExtension(name: string, ext: string): string {
  const dotExt = ext.startsWith('.') ? ext : `.${ext}`;
  const base = name.replace(/\.[^/.]+$/, '');
  return sanitizeFileName(base + dotExt);
}

/**
 * Get the extension (without dot) from a filename.
 */
export function getExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

/**
 * Get the base name (without extension) from a filename.
 */
export function getBaseName(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}
