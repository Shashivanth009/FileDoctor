import { describe, it, expect } from 'vitest';
import {
  DocumentModel,
  buildPdfFromDocument,
  exportDocumentAsMarkdown,
  exportDocumentAsWordDoc,
  DOCUMENT_TEMPLATES,
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
    stampBadge: 'APPROVED',
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
      {
        id: 's6',
        type: 'stat-grid',
        stats: [
          { label: 'Total', value: '$1,200.00' },
          { label: 'Status', value: 'Complete' },
        ],
      },
      {
        id: 's7',
        type: 'divider',
      },
      {
        id: 's8',
        type: 'signature',
        signatoryName: 'Dr. Jane Smith',
        signatoryTitle: 'Chief Medical Officer',
        dateSigned: '2026-11-05',
      },
    ],
  };

  it('compiles DocumentModel into a valid vector PDF blob with stamps and signatures', async () => {
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
    expect(md).toContain('Dr. Jane Smith');
  });

  it('exports DocumentModel as a Microsoft Word .doc Blob', () => {
    const wordBlob = exportDocumentAsWordDoc(sampleDoc);
    expect(wordBlob).toBeDefined();
    expect(wordBlob.size).toBeGreaterThan(500);
    expect(wordBlob.type).toContain('msword');
  });

  it('provides all pre-built document templates with valid configurations', () => {
    expect(DOCUMENT_TEMPLATES.invoice).toBeDefined();
    expect(DOCUMENT_TEMPLATES.proposal).toBeDefined();
    expect(DOCUMENT_TEMPLATES.certificate).toBeDefined();
    expect(DOCUMENT_TEMPLATES.letterhead).toBeDefined();
    expect(DOCUMENT_TEMPLATES.meeting).toBeDefined();
  });
});
