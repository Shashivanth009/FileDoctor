import { describe, it, expect } from 'vitest';
import {
  tools,
  categories,
  getToolById,
  getToolsByCategory,
  getPopularTools,
  searchTools,
} from '../data/toolRegistry';

describe('toolRegistry', () => {
  it('contains comprehensive suite of tools', () => {
    expect(tools.length).toBeGreaterThanOrEqual(30);
    expect(categories.length).toBeGreaterThanOrEqual(6);
  });

  it('finds tools by unique ID', () => {
    const compressPdf = getToolById('pdf-compress');
    expect(compressPdf).toBeDefined();
    expect(compressPdf?.category).toBe('pdf');
    expect(compressPdf?.privacyLevel).toBe('local');
  });

  it('filters tools by category correctly', () => {
    const pdfTools = getToolsByCategory('pdf');
    expect(pdfTools.length).toBeGreaterThan(5);
    pdfTools.forEach((t) => expect(t.category).toBe('pdf'));

    const imageTools = getToolsByCategory('image');
    expect(imageTools.length).toBeGreaterThan(4);
    imageTools.forEach((t) => expect(t.category).toBe('image'));
  });

  it('filters popular tools', () => {
    const popular = getPopularTools();
    expect(popular.length).toBeGreaterThan(0);
    popular.forEach((t) => expect(t.isPopular).toBe(true));
  });

  it('searches tools with relevance ranking', () => {
    const pdfResults = searchTools('compress pdf');
    expect(pdfResults.length).toBeGreaterThan(0);
    expect(pdfResults[0].id).toBe('pdf-compress');

    const exifResults = searchTools('metadata');
    expect(exifResults.some((t) => t.id === 'image-metadata')).toBe(true);

    const jsonResults = searchTools('excel');
    expect(jsonResults.some((t) => t.id === 'csv-to-xlsx')).toBe(true);
  });
});

