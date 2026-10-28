import { describe, it, expect } from 'vitest';
import { formatBytes, formatDuration, formatSizeReduction } from '@/utils/format';
import { sanitizeFileName, withExtension, getExtension, getBaseName } from '@/utils/sanitize';
import { validateFile } from '@/utils/validate';
import { nanoid } from '@/utils/nanoid';
import { searchTools, getToolById } from '@/services/toolRegistry';
import { cleanText } from '@/services/dataProcessing';

// ─── formatBytes ─────────────────────────────────────────────────────────────

describe('formatBytes', () => {
  it('returns "0 B" for zero', () => expect(formatBytes(0)).toBe('0 B'));
  it('formats bytes', () => expect(formatBytes(512)).toBe('512 B'));
  it('formats KB', () => expect(formatBytes(1024)).toBe('1 KB'));
  it('formats MB', () => expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB'));
  it('formats GB', () => expect(formatBytes(2 * 1024 ** 3)).toBe('2 GB'));
});

// ─── formatDuration ──────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats seconds', () => expect(formatDuration(65)).toBe('1:05'));
  it('formats hours', () => expect(formatDuration(3661)).toBe('1:01:01'));
  it('pads minutes', () => expect(formatDuration(600)).toBe('10:00'));
});

// ─── formatSizeReduction ─────────────────────────────────────────────────────

describe('formatSizeReduction', () => {
  it('returns reduction percentage', () => expect(formatSizeReduction(1000, 800)).toBe('-20.0%'));
  it('returns increase when larger', () => expect(formatSizeReduction(800, 1000)).toBe('+25.0%'));
  it('returns dash for zero original', () => expect(formatSizeReduction(0, 100)).toBe('—'));
  it('returns 0% when same', () => expect(formatSizeReduction(100, 100)).toBe('0%'));
});

// ─── sanitizeFileName ────────────────────────────────────────────────────────

describe('sanitizeFileName', () => {
  it('removes path separators', () => expect(sanitizeFileName('foo/bar.pdf')).toBe('foo-bar.pdf'));
  it('removes invalid chars', () => expect(sanitizeFileName('file:name?.pdf')).toBe('file-name-.pdf'));
  it('collapses double dots', () => expect(sanitizeFileName('foo..bar')).toBe('foo.bar'));
  it('handles empty result', () => expect(sanitizeFileName('...')).toBe('file'));
  it('preserves normal names', () => expect(sanitizeFileName('my-file_v2.pdf')).toBe('my-file_v2.pdf'));
});

describe('withExtension', () => {
  it('replaces extension', () => expect(withExtension('image.jpg', 'png')).toBe('image.png'));
  it('adds extension', () => expect(withExtension('noext', 'pdf')).toBe('noext.pdf'));
  it('handles dot prefix', () => expect(withExtension('file.csv', '.json')).toBe('file.json'));
});

describe('getExtension', () => {
  it('returns lowercase extension', () => expect(getExtension('File.PDF')).toBe('pdf'));
  it('returns empty for no extension', () => expect(getExtension('noext')).toBe(''));
});

describe('getBaseName', () => {
  it('strips extension', () => expect(getBaseName('report.pdf')).toBe('report'));
  it('handles no extension', () => expect(getBaseName('readme')).toBe('readme'));
});

// ─── validateFile ────────────────────────────────────────────────────────────

describe('validateFile', () => {
  const makeFile = (name: string, type: string, size = 1024) =>
    new File(['x'.repeat(size)], name, { type });

  it('rejects empty files', () => {
    const f = new File([], 'empty.pdf', { type: 'application/pdf' });
    expect(validateFile(f).valid).toBe(false);
  });

  it('accepts valid PDF', () => {
    const f = makeFile('doc.pdf', 'application/pdf');
    expect(validateFile(f, { acceptedMimeTypes: ['application/pdf'] }).valid).toBe(true);
  });

  it('rejects oversized file', () => {
    const f = makeFile('big.pdf', 'application/pdf');
    // Spoof the size property — jsdom can't actually allocate 300 MB
    Object.defineProperty(f, 'size', { value: 300 * 1024 * 1024 });
    expect(validateFile(f).valid).toBe(false);
  });

  it('rejects wrong type', () => {
    const f = makeFile('img.png', 'image/png');
    const r = validateFile(f, { acceptedMimeTypes: ['application/pdf'], acceptedExtensions: ['pdf'] });
    expect(r.valid).toBe(false);
  });
});

// ─── nanoid ──────────────────────────────────────────────────────────────────

describe('nanoid', () => {
  it('generates a string of default length', () => expect(nanoid()).toHaveLength(12));
  it('generates a string of custom length', () => expect(nanoid(20)).toHaveLength(20));
  it('generates unique IDs', () => expect(nanoid()).not.toBe(nanoid()));
  it('uses only safe characters', () => expect(nanoid()).toMatch(/^[A-Za-z0-9]+$/));
});

// ─── searchTools ─────────────────────────────────────────────────────────────

describe('searchTools', () => {
  it('returns all tools for empty query', () => {
    const r = searchTools('');
    expect(r.length).toBeGreaterThan(0);
  });

  it('finds merge tool by name', () => {
    const r = searchTools('merge');
    expect(r.some((t) => t.id === 'pdf-merge')).toBe(true);
  });

  it('finds tools by tag', () => {
    const r = searchTools('compress');
    expect(r.length).toBeGreaterThan(0);
  });

  it('finds tools by format', () => {
    const r = searchTools('csv');
    expect(r.some((t) => t.id === 'tabular-convert')).toBe(true);
  });

  it('returns empty for unmatched query', () => {
    expect(searchTools('zzznomatchzzz')).toHaveLength(0);
  });
});

describe('getToolById', () => {
  it('returns tool by id', () => expect(getToolById('pdf-merge')?.id).toBe('pdf-merge'));
  it('returns undefined for unknown id', () => expect(getToolById('nonexistent')).toBeUndefined());
});

// ─── cleanText ───────────────────────────────────────────────────────────────

describe('cleanText', () => {
  const opts = {
    removeDuplicateLines: false,
    normalizeWhitespace: false,
    removeBlankLines: false,
    fixLineBreaks: false,
    stripMarkdown: false,
    trimLines: false,
  };

  it('fixes line breaks', () => {
    const r = cleanText('a\r\nb\rc', { ...opts, fixLineBreaks: true });
    expect(r).toBe('a\nb\nc');
  });

  it('removes duplicate lines', () => {
    const r = cleanText('a\nb\na\nc', { ...opts, removeDuplicateLines: true });
    expect(r).toBe('a\nb\nc');
  });

  it('removes blank lines', () => {
    const r = cleanText('a\n\n\nb', { ...opts, fixLineBreaks: true, removeBlankLines: true });
    expect(r).toBe('a\nb');
  });

  it('strips markdown headings', () => {
    const r = cleanText('# Title\nSome text', { ...opts, stripMarkdown: true });
    expect(r).not.toContain('#');
    expect(r).toContain('Title');
  });

  it('strips markdown bold', () => {
    const r = cleanText('**bold** text', { ...opts, stripMarkdown: true });
    expect(r).toBe('bold text');
  });

  it('trims line ends', () => {
    const r = cleanText('hello   \nworld  ', { ...opts, trimLines: true });
    expect(r).toBe('hello\nworld');
  });

  it('normalizes internal whitespace', () => {
    const r = cleanText('too   many   spaces', { ...opts, normalizeWhitespace: true });
    expect(r).toBe('too many spaces');
  });
});
