import { describe, it, expect } from 'vitest';
import {
  DocumentModel,
  buildPdfFromDocument,
  exportDocumentAsMarkdown,
} from '@/services/docBuilderService';

describe('docBuilderService', () => {
  const sampleDoc: DocumentModel = {
    title: 'Test Clinical Report',
    subtitle: 'Generated Document Test',
    author: 'FileDoctor Suite',
    date: '2026-11-05',
    organization: 'Medical Tech',
    pageSize: 'a4',
    showPageNumbers: true,
    sections: [
      {
        id: 's1',
        type: 'heading',
        text: 'Introduction',
      },
      {
        id: 's2',
        type: 'paragraph',
        text: 'This is a sample paragraph that tests word wrapping and vector font placement in PDF generation.',
      },
      {
        id: 's3',
        type: 'bullet',
        bullets: ['Alpha test bullet', 'Beta test bullet'],
      },
      {
        id: 's4',
        type: 'callout',
        text: 'Callout note box text testing background bounds.',
      },
      {
        id: 's5',
        type: 'table',
        tableHeaders: ['Col A', 'Col B'],
        tableRows: [['Val 1', 'Val 2']],
      },
    ],
  };

  it('compiles DocumentModel into a valid vector PDF blob', async () => {
    const res = await buildPdfFromDocument(sampleDoc);
    expect(res.success).toBe(true);
    expect(res.outputBlob).toBeDefined();
    expect(res.outputSize).toBeGreaterThan(1000);
    expect(res.outputFilename).toContain('Test_Clinical_Report');
  });

  it('exports DocumentModel as structured Markdown text', () => {
    const md = exportDocumentAsMarkdown(sampleDoc);
    expect(md).toContain('# Test Clinical Report');
    expect(md).toContain('*Generated Document Test*');
    expect(md).toContain('## Introduction');
    expect(md).toContain('- Alpha test bullet');
    expect(md).toContain('| Col A | Col B |');
  });
});
