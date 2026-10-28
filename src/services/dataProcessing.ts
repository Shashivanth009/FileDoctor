import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ProcessingResult } from '@/types';
import { withExtension, getBaseName } from '@/utils/sanitize';

// ─── CSV / JSON / Excel ───────────────────────────────────────────────────────

export async function csvToJson(file: File): Promise<ProcessingResult> {
  const text = await file.text();
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    throw new Error(`CSV parse error at row ${firstError.row}: ${firstError.message}`);
  }

  const json = JSON.stringify(result.data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  return {
    blob,
    fileName: withExtension(getBaseName(file.name), 'json'),
    mimeType: 'application/json',
    metadata: { rowCount: result.data.length, fields: result.meta.fields },
  };
}

export async function jsonToCsv(file: File): Promise<ProcessingResult> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON: could not parse file.');
  }

  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of objects to convert to CSV.');
  }

  const csv = Papa.unparse(data as object[]);
  const blob = new Blob([csv], { type: 'text/csv' });

  return {
    blob,
    fileName: withExtension(getBaseName(file.name), 'csv'),
    mimeType: 'text/csv',
    metadata: { rowCount: (data as object[]).length },
  };
}

export async function xlsxToCsv(file: File, sheetName?: string): Promise<ProcessingResult> {
  const ab = await file.arrayBuffer();
  const workbook = XLSX.read(ab, { type: 'array' });

  const selectedSheet = sheetName ?? workbook.SheetNames[0];
  if (!workbook.SheetNames.includes(selectedSheet)) {
    throw new Error(`Sheet "${selectedSheet}" not found.`);
  }

  const worksheet = workbook.Sheets[selectedSheet];
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv' });

  return {
    blob,
    fileName: withExtension(`${getBaseName(file.name)}_${selectedSheet}`, 'csv'),
    mimeType: 'text/csv',
    metadata: { sheet: selectedSheet, sheets: workbook.SheetNames },
  };
}

export async function csvToXlsx(file: File): Promise<ProcessingResult> {
  const text = await file.text();
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });

  if (result.errors.length > 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const worksheet = XLSX.utils.json_to_sheet(result.data as object[]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const xlsxBytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
  const blob = new Blob([xlsxBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return {
    blob,
    fileName: withExtension(getBaseName(file.name), 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    metadata: { rowCount: result.data.length },
  };
}

export async function getXlsxSheets(file: File): Promise<string[]> {
  const ab = await file.arrayBuffer();
  const workbook = XLSX.read(ab, { type: 'array' });
  return workbook.SheetNames;
}

export async function xlsxSheetToJson(
  file: File,
  sheetName?: string
): Promise<{ data: object[]; sheets: string[] }> {
  const ab = await file.arrayBuffer();
  const workbook = XLSX.read(ab, { type: 'array' });
  const selected = sheetName ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[selected];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as object[];
  return { data, sheets: workbook.SheetNames };
}

// ─── Code Formatter ───────────────────────────────────────────────────────────

export type CodeLanguage = 'json' | 'html' | 'css' | 'javascript';

export function formatCode(code: string, language: CodeLanguage): string {
  switch (language) {
    case 'json':
      return JSON.stringify(JSON.parse(code), null, 2);
    case 'html':
      return formatHtml(code);
    case 'css':
      return formatCss(code);
    case 'javascript':
      return formatJs(code);
    default:
      return code;
  }
}

export function minifyCode(code: string, language: CodeLanguage): string {
  switch (language) {
    case 'json':
      return JSON.stringify(JSON.parse(code));
    case 'html':
      return code
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
    case 'css':
      return code
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')
        .trim();
    case 'javascript':
      // Basic JS minification — strips comments and collapses whitespace
      return code
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([=+\-*/%&|^!<>?:;,{}[\]()])\s*/g, '$1')
        .trim();
    default:
      return code;
  }
}

function formatHtml(html: string): string {
  let indent = 0;
  const voidElements = new Set([
    'area','base','br','col','embed','hr','img','input',
    'link','meta','param','source','track','wbr',
  ]);
  const lines: string[] = [];
  const tokens = html.split(/(<[^>]+>)/g);

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      lines.push('  '.repeat(indent) + trimmed);
    } else if (trimmed.startsWith('<') && !trimmed.startsWith('<!')) {
      lines.push('  '.repeat(indent) + trimmed);
      const tagName = (trimmed.match(/<(\w+)/) ?? [])[1]?.toLowerCase() ?? '';
      if (!voidElements.has(tagName) && !trimmed.endsWith('/>')) {
        indent++;
      }
    } else {
      lines.push('  '.repeat(indent) + trimmed);
    }
  }
  return lines.join('\n');
}

function formatCss(css: string): string {
  return css
    .replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function formatJs(js: string): string {
  // Basic indentation-aware formatting for JS
  let indent = 0;
  const lines = js.split('\n');
  return lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('}') || trimmed.startsWith(')') || trimmed.startsWith(']')) {
      indent = Math.max(0, indent - 1);
    }
    const out = '  '.repeat(indent) + trimmed;
    if (trimmed.endsWith('{') || trimmed.endsWith('(') || trimmed.endsWith('[')) {
      indent++;
    }
    return out;
  }).join('\n');
}

// ─── Text Cleaner ─────────────────────────────────────────────────────────────

export type TextCleanOptions = {
  removeDuplicateLines: boolean;
  normalizeWhitespace: boolean;
  removeBlankLines: boolean;
  fixLineBreaks: boolean;
  stripMarkdown: boolean;
  trimLines: boolean;
};

export function cleanText(text: string, options: TextCleanOptions): string {
  let result = text;

  if (options.fixLineBreaks) {
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  if (options.trimLines) {
    result = result.split('\n').map((l) => l.trimEnd()).join('\n');
  }

  if (options.normalizeWhitespace) {
    result = result.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n');
  }

  if (options.stripMarkdown) {
    result = result
      .replace(/^#{1,6}\s+/gm, '')         // headings
      .replace(/\*\*(.+?)\*\*/g, '$1')       // bold
      .replace(/\*(.+?)\*/g, '$1')           // italic
      .replace(/`{1,3}[^`]*`{1,3}/g, '')    // code
      .replace(/!\[.*?\]\(.*?\)/g, '')       // images
      .replace(/\[(.+?)\]\(.*?\)/g, '$1')   // links
      .replace(/^[-*+]\s+/gm, '')           // unordered lists
      .replace(/^\d+\.\s+/gm, '')           // ordered lists
      .replace(/^>\s+/gm, '')               // blockquotes
      .replace(/^---+$/gm, '');             // hr
  }

  if (options.removeBlankLines) {
    result = result.replace(/\n{2,}/g, '\n');
  }

  if (options.removeDuplicateLines) {
    const seen = new Set<string>();
    result = result.split('\n').filter((line) => {
      const key = line.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).join('\n');
  }

  return result;
}
