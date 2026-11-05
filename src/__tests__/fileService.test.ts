import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  getFileExtension,
  sanitizeFilename,
  generateOutputFilename,
  validateFile,
} from '../services/fileService';

describe('fileService', () => {
  it('formats file sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 15.5)).toBe('15.5 MB');
  });

  it('extracts file extensions safely', () => {
    expect(getFileExtension('document.pdf')).toBe('pdf');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
    expect(getFileExtension('PHOTO.JPEG')).toBe('jpeg');
    expect(getFileExtension('noextension')).toBe('');
  });

  it('sanitizes unsafe filenames', () => {
    expect(sanitizeFilename('my file (1) [final]!.pdf')).toBe('my_file__1___final__.pdf');
    expect(sanitizeFilename('../../../etc/passwd')).toBe('.._.._.._etc_passwd');
  });

  it('generates predictable output filenames', () => {
    expect(generateOutputFilename('report.pdf', 'compressed')).toBe('report_compressed.pdf');
    expect(generateOutputFilename('photo.png', 'converted', 'webp')).toBe('photo_converted.webp');
  });

  it('validates file size limits', () => {
    const smallFile = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const validRes = validateFile(smallFile, { maxSize: 1024 });
    expect(validRes.valid).toBe(true);

    const invalidRes = validateFile(smallFile, { maxSize: 2 });
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.error).toContain('File too large');
  });
});

