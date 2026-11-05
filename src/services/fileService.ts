export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.slice(idx + 1).toLowerCase() : '';
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
}

export function generateOutputFilename(input: string, suffix: string, newExt?: string): string {
  const parts = input.split('.');
  const originalExt = parts.length > 1 ? parts.pop() : '';
  const ext = newExt || originalExt || '';
  const base = parts.join('.');
  return sanitizeFilename(ext ? `${base}_${suffix}.${ext}` : `${base}_${suffix}`);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeFilename(filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}): { valid: boolean; error?: string } {
  if (options.maxSize && file.size > options.maxSize) {
    return { valid: false, error: `File too large. Maximum size is ${formatFileSize(options.maxSize)}.` };
  }
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const typeMatch = options.allowedTypes.some(t => {
      if (t.endsWith('/*')) return file.type.startsWith(t.replace('/*', '/'));
      return file.type === t;
    });
    const extMatch = options.allowedExtensions?.some(ext => file.name.toLowerCase().endsWith(`.${ext}`));
    if (!typeMatch && !extMatch) {
      return { valid: false, error: `File type "${file.type || 'unknown'}" is not supported.` };
    }
  }
  return { valid: true };
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
