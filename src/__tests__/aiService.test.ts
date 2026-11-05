import { describe, it, expect } from 'vitest';
import { summarizeDocumentLocally, queryDocumentContent } from '../services/aiService';

describe('aiService', () => {
  const sampleArticle = `
    FileDoctor is a privacy-first web application for processing digital files.
    All operations execute locally inside the client browser tab without any backend server transmission.
    Users must verify that sensitive documents are never uploaded to untrusted public cloud infrastructure.
    The platform employs WebAssembly and Web Audio to maintain desktop-grade computational performance.
    We should implement robust encryption algorithms to safeguard user preferences.
  `;

  it('generates extractive summaries with key points and action items', () => {
    const summary = summarizeDocumentLocally(sampleArticle, 2);
    expect(summary.executiveSummary.length).toBeGreaterThan(20);
    expect(summary.bulletPoints.length).toBe(2);
    expect(summary.keyTerms.length).toBeGreaterThan(0);
    // Action items should detect "must" and "should"
    expect(summary.actionItems.length).toBeGreaterThan(0);
  });

  it('answers queries with relevant passage citations', () => {
    const matches = queryDocumentContent(sampleArticle, 'performance audio');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].passage).toContain('Web Audio');
    expect(matches[0].relevanceScore).toBeGreaterThan(0);
  });
});

