import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { minify as terserMinify } from 'terser';
import { readFileAsText, readFileAsArrayBuffer } from './fileService';
import { ProcessingResult } from '@/types';

/**
 * 11.1 Data Conversion: CSV <-> JSON
 */
export async function convertCsvToJson(
  file: File,
  options: { pretty?: boolean; delimiter?: string } = {}
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const text = await readFileAsText(file);
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: options.delimiter || '',
    });

    if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
      throw new Error(parsed.errors[0].message);
    }

    const jsonStr = options.pretty ? JSON.stringify(parsed.data, null, 2) : JSON.stringify(parsed.data);
    const outputBlob = new Blob([jsonStr], { type: 'application/json' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}.json`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to convert CSV to JSON',
    };
  }
}

export async function convertJsonToCsv(file: File): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const text = await readFileAsText(file);
    const data = JSON.parse(text);

    const items = Array.isArray(data) ? data : [data];
    const csv = Papa.unparse(items);
    const outputBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}.csv`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to convert JSON to CSV',
    };
  }
}

/**
 * 11.2 Data Conversion: CSV / JSON <-> Excel (XLSX)
 */
export async function convertCsvToXlsx(file: File): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const text = await readFileAsText(file);
    const workbook = XLSX.read(text, { type: 'string' });
    const outputBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const outputBlob = new Blob([outputBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}.xlsx`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to convert CSV to Excel',
    };
  }
}

export async function convertXlsxToCsv(file: File, sheetIndex = 0): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    const outputBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}.csv`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to convert Excel to CSV',
    };
  }
}

export async function convertJsonToXlsx(file: File): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const text = await readFileAsText(file);
    const data = JSON.parse(text);
    const arrayData = Array.isArray(data) ? data : [data];

    const worksheet = XLSX.utils.json_to_sheet(arrayData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const outputBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const outputBlob = new Blob([outputBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}.xlsx`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to convert JSON to Excel',
    };
  }
}

export async function convertXlsxToJson(file: File, sheetIndex = 0): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const jsonStr = JSON.stringify(jsonData, null, 2);
    const outputBlob = new Blob([jsonStr], { type: 'application/json' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}.json`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to convert Excel to JSON',
    };
  }
}

/**
 * 11.3 Code Tools: Formatters & Minifiers
 */
export function formatJson(input: string, indent = 2): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(input);
    return { success: true, result: JSON.stringify(parsed, null, indent) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function minifyJson(input: string): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(input);
    return { success: true, result: JSON.stringify(parsed) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function minifyJavaScript(code: string): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    const res = await terserMinify(code, {
      mangle: true,
      compress: true,
    });
    return { success: true, result: res.code || '' };
  } catch (err: any) {
    return { success: false, error: err.message || 'JS Minification failed' };
  }
}

export function formatHtml(html: string): string {
  let tab = '  ';
  let result = '';
  let indent = '';

  html.split(/>\s*</).forEach((element) => {
    if (element.match(/^\/\w/)) {
      indent = indent.substring(tab.length);
    }
    result += indent + '<' + element + '>\r\n';
    if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith('input') && !element.startsWith('img') && !element.startsWith('br') && !element.startsWith('hr')) {
      indent += tab;
    }
  });

  return result.substring(1, result.length - 3);
}

export function formatCss(css: string): string {
  return css
    .replace(/\s*([\{\};:,])\s*/g, '$1')
    .replace(/;/g, ';\n  ')
    .replace(/\{/g, ' {\n  ')
    .replace(/\}/g, '\n}\n\n')
    .trim();
}

/**
 * 11.4 Text Tools
 */
export function cleanText(
  text: string,
  options: { removeExtraSpaces?: boolean; removeBlankLines?: boolean; trimLines?: boolean } = {}
): string {
  let res = text;
  if (options.trimLines !== false) {
    res = res.split('\n').map((l) => l.trim()).join('\n');
  }
  if (options.removeExtraSpaces !== false) {
    res = res.replace(/[ \t]+/g, ' ');
  }
  if (options.removeBlankLines !== false) {
    res = res.replace(/^\s*[\r\n]/gm, '');
  }
  return res.trim();
}

export function removeDuplicateLines(text: string): string {
  const lines = text.split('\n');
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      unique.push(line);
    }
  }
  return unique.join('\n');
}

export function convertCase(
  text: string,
  targetCase: 'uppercase' | 'lowercase' | 'title' | 'camel' | 'snake' | 'kebab' | 'constant'
): string {
  switch (targetCase) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
    case 'camel':
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
    case 'snake':
      return text
        .trim()
        .replace(/\s+/g, '_')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase();
    case 'kebab':
      return text
        .trim()
        .replace(/\s+/g, '-')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();
    case 'constant':
      return text
        .trim()
        .replace(/\s+/g, '_')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toUpperCase();
  }
}

export function countWordsAndChars(text: string): {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
} {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentences = trimmed ? (trimmed.match(/[\w|\)][.?!]+(\s|$)/g) || []).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n+/).filter((p) => p.trim()).length : 0;
  const readingTimeMinutes = Math.ceil(words / 200);

  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTimeMinutes };
}

export async function generateHash(
  text: string,
  algorithm: 'SHA-256' | 'SHA-512' | 'SHA-1'
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function decodeJwt(token: string): {
  header: any;
  payload: any;
  valid: boolean;
  error?: string;
  isExpired?: boolean;
} {
  try {
    const parts = token.trim().split('.');
    if (parts.length < 2) throw new Error('JWT must have at least 2 parts separated by dots');

    const base64UrlDecode = (str: string) => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
      return JSON.parse(decodeURIComponent(escape(atob(padded))));
    };

    const header = base64UrlDecode(parts[0]);
    const payload = base64UrlDecode(parts[1]);

    const isExpired = payload.exp ? Date.now() >= payload.exp * 1000 : false;

    return { header, payload, valid: true, isExpired };
  } catch (err: any) {
    return { header: null, payload: null, valid: false, error: err.message || 'Invalid JWT token' };
  }
}

