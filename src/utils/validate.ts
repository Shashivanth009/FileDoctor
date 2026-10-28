import type { ValidationResult, FileConstraints } from '@/types';

export const MAX_FILE_SIZE_DEFAULT = 200 * 1024 * 1024; // 200 MB

export function validateFile(file: File, constraints: FileConstraints = {}): ValidationResult {
  const {
    maxSizeBytes = MAX_FILE_SIZE_DEFAULT,
    acceptedMimeTypes,
    acceptedExtensions,
  } = constraints;

  if (file.size === 0) return { valid: false, error: 'File is empty.' };
  if (file.size > maxSizeBytes) {
    const mb = Math.round(maxSizeBytes / 1024 / 1024);
    return { valid: false, error: `File exceeds the ${mb} MB size limit.` };
  }

  if (acceptedMimeTypes && acceptedMimeTypes.length > 0) {
    const ok = acceptedMimeTypes.some(
      (mime) =>
        file.type === mime ||
        (mime.endsWith('/*') && file.type.startsWith(mime.replace('/*', '/')))
    );
    if (!ok) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!acceptedExtensions?.includes(ext)) {
        return {
          valid: false,
          error: `Unsupported file type: ${file.type || ext}. Expected: ${acceptedMimeTypes.join(', ')}`,
        };
      }
    }
  }

  if (acceptedExtensions && acceptedExtensions.length > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!acceptedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file extension ".${ext}". Expected: ${acceptedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

export function validateFiles(files: File[], constraints: FileConstraints = {}): ValidationResult {
  for (const file of files) {
    const result = validateFile(file, constraints);
    if (!result.valid) return result;
  }
  return { valid: true };
}
