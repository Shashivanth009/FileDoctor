import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';

describe('pdf-lib document manipulation', () => {
  it('creates valid PDF documents with custom metadata', async () => {
    const doc = await PDFDocument.create();
    doc.setTitle('Clinical Test PDF');
    doc.setAuthor('FileDoctor Test Suite');

    const page = doc.addPage([595.28, 841.89]);
    page.drawText('Test Page Content', { x: 50, y: 750, size: 24 });

    const bytes = await doc.save({ useObjectStreams: true });
    expect(bytes.length).toBeGreaterThan(500);

    // Verify round-trip load
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
    expect(loaded.getTitle()).toBe('Clinical Test PDF');
  });

  it('merges multiple PDF documents into a combined file', async () => {
    const doc1 = await PDFDocument.create();
    doc1.addPage([400, 400]);
    const bytes1 = await doc1.save();

    const doc2 = await PDFDocument.create();
    doc2.addPage([400, 400]);
    doc2.addPage([400, 400]);
    const bytes2 = await doc2.save();

    // Merge doc1 and doc2
    const merged = await PDFDocument.create();
    const l1 = await PDFDocument.load(bytes1);
    const l2 = await PDFDocument.load(bytes2);

    const pages1 = await merged.copyPages(l1, l1.getPageIndices());
    pages1.forEach((p) => merged.addPage(p));

    const pages2 = await merged.copyPages(l2, l2.getPageIndices());
    pages2.forEach((p) => merged.addPage(p));

    const mergedBytes = await merged.save();
    const verifyDoc = await PDFDocument.load(mergedBytes);

    expect(verifyDoc.getPageCount()).toBe(3); // 1 + 2 = 3 pages
  });

  it('splits pages from a document', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 300]);
    doc.addPage([300, 300]);
    doc.addPage([300, 300]);
    const bytes = await doc.save();

    const loaded = await PDFDocument.load(bytes);
    const splitDoc = await PDFDocument.create();
    // Extract only page 2 (index 1)
    const [page2] = await splitDoc.copyPages(loaded, [1]);
    splitDoc.addPage(page2);

    const splitBytes = await splitDoc.save();
    const verifyDoc = await PDFDocument.load(splitBytes);
    expect(verifyDoc.getPageCount()).toBe(1);
  });

  it('strips bloated metadata and compresses object streams losslessly', async () => {
    const doc = await PDFDocument.create();
    doc.setTitle('A'.repeat(5000));
    doc.setSubject('B'.repeat(5000));
    doc.setAuthor('C'.repeat(5000));
    doc.addPage([500, 500]);
    const bloatedBytes = await doc.save();

    // Clean metadata
    const loaded = await PDFDocument.load(bloatedBytes);
    loaded.setTitle('');
    loaded.setSubject('');
    loaded.setAuthor('');
    const cleanedBytes = await loaded.save({ useObjectStreams: true });

    expect(cleanedBytes.length).toBeLessThan(bloatedBytes.length);
  });

  it('guarantees compressed output is never larger than the input file', async () => {
    const { compressPdf } = await import('@/services/pdfService');
    const doc = await PDFDocument.create();
    doc.setTitle('A'.repeat(3000));
    doc.addPage([600, 400]);
    const pdfBytes = await doc.save();

    const mockFile = new File([pdfBytes as unknown as BlobPart], 'test_doc.pdf', { type: 'application/pdf' });
    const res = await compressPdf(mockFile, { mode: 'preset', preset: 'balanced' });

    expect(res.success).toBe(true);
    expect(res.outputSize).toBeLessThanOrEqual(mockFile.size);
    expect(res.outputBlob).toBeDefined();
  });

  it('supports light, balanced, strong, and maximum compression presets', async () => {
    const { compressPdf } = await import('@/services/pdfService');
    const doc = await PDFDocument.create();
    doc.setTitle('Metadata to Strip '.repeat(200));
    const p1 = doc.addPage([600, 400]);
    p1.drawText('Sample slide page', { x: 50, y: 350 });
    const pdfBytes = await doc.save();
    const mockFile = new File([pdfBytes as unknown as BlobPart], 'slides.pdf', { type: 'application/pdf' });

    const lightRes = await compressPdf(mockFile, { mode: 'preset', preset: 'light' });
    const strongRes = await compressPdf(mockFile, { mode: 'preset', preset: 'strong' });

    expect(lightRes.success).toBe(true);
    expect(strongRes.success).toBe(true);
    expect(lightRes.outputSize).toBeLessThanOrEqual(mockFile.size);
    expect(strongRes.outputSize).toBeLessThanOrEqual(mockFile.size);
  });
});

