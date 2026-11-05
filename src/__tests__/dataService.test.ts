import { describe, it, expect } from 'vitest';
import {
  formatJson,
  minifyJson,
  cleanText,
  removeDuplicateLines,
  convertCase,
  countWordsAndChars,
  decodeJwt,
} from '../services/dataService';

describe('dataService', () => {
  it('formats valid JSON with custom indentation', () => {
    const raw = '{"a":1,"b":[2,3]}';
    const res = formatJson(raw, 2);
    expect(res.success).toBe(true);
    expect(res.result).toContain('  "a": 1');
  });

  it('rejects invalid JSON gracefully', () => {
    const broken = '{"a": 1, broken}';
    const res = formatJson(broken);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('minifies JSON properly', () => {
    const pretty = '{\n  "hello": "world",\n  "active": true\n}';
    const res = minifyJson(pretty);
    expect(res.success).toBe(true);
    expect(res.result).toBe('{"hello":"world","active":true}');
  });

  it('cleans whitespace and linebreaks', () => {
    const messy = '   hello    world   \n\n\n  next line   ';
    const cleaned = cleanText(messy);
    expect(cleaned).toBe('hello world\nnext line');
  });

  it('removes duplicate lines', () => {
    const lines = 'apple\nbanana\napple\norange\nbanana';
    const unique = removeDuplicateLines(lines);
    expect(unique).toBe('apple\nbanana\norange');
  });

  it('converts cases accurately', () => {
    expect(convertCase('hello world', 'uppercase')).toBe('HELLO WORLD');
    expect(convertCase('HELLO WORLD', 'lowercase')).toBe('hello world');
    expect(convertCase('hello world', 'title')).toBe('Hello World');
    expect(convertCase('hello world', 'camel')).toBe('helloWorld');
    expect(convertCase('hello world', 'snake')).toBe('hello_world');
    expect(convertCase('hello world', 'kebab')).toBe('hello-world');
    expect(convertCase('hello world', 'constant')).toBe('HELLO_WORLD');
  });

  it('counts words and characters accurately', () => {
    const text = 'FileDoctor is fast. It works inside your browser.';
    const stats = countWordsAndChars(text);
    expect(stats.words).toBe(8);
    expect(stats.sentences).toBe(2);
    expect(stats.characters).toBe(text.length);
  });

  it('decodes JWT tokens accurately and verifies expiration flag', () => {
    // Standard test JWT with exp in the future
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiZXhwIjoyNTAwMDAwMDAwfQ.signature';
    const res = decodeJwt(token);
    expect(res.valid).toBe(true);
    expect(res.header.alg).toBe('HS256');
    expect(res.payload.name).toBe('Alice');
    expect(res.isExpired).toBe(false);
  });
});

