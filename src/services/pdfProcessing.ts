import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ProcessingResult, ProcessingContext, PdfDocumentInfo } from '@/types';
import { withExtension, getBaseName } from '@/utils/sanitize';

/**
 * Load a PDF and return basic document info using pdf-lib.
 */
export async function loadPdfInfo(file: File): Promise<PdfDocumentInfo> {
  const ab = await file.arrayBuffer();
  const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
  const pages = doc.getPages();

  return {
    pageCount: pages.length,
    title: doc.getTitle(),
    author: doc.getAuthor(),
    subject: doc.getSubject(),
    creator: doc.getCreator(),
    sizeBytes: file.size,
    pages: pages.map((p, i) => {
      const { width, height } = p.getSize();
      return { pageNumber: i + 1, width, height };
    }),
  };
}

/**
 * Merge multiple PDF files into one.
 */
export async function mergePdfs(
  files: File[],
  ctx: ProcessingContext = {}
): Promise<ProcessingResult> {
  const { onProgress, signal } = ctx;
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const ab = await files[i].arrayBuffer();
    const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
    const pageIndices = doc.getPageIndices();
    const copiedPages = await merged.copyPages(doc, pageIndices);
    copiedPages.forEach((p) => merged.addPage(p));
    onProgress?.(Math.round(((i + 1) / files.length) * 90));
  }

  merged.setTitle('Merged Document');
  merged.setCreator('FileDoctor');
  const pdfBytes = await merged.save();
  onProgress?.(100);

  return {
    blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    fileName: 'merged.pdf',
    mimeType: 'application/pdf',
    metadata: { pageCount: merged.getPageCount() },
  };
}

/**
 * Extract a subset of pages from a PDF.
 */
export async function splitPdf(
  file: File,
  pageRanges: number[][], // array of [start, end] (1-based, inclusive)
  ctx: ProcessingContext = {}
): Promise<ProcessingResult[]> {
  const { onProgress, signal } = ctx;
  const ab = await file.arrayBuffer();
  const sourceDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
  const results: ProcessingResult[] = [];

  for (let ri = 0; ri < pageRanges.length; ri++) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const [start, end] = pageRanges[ri];
    const indices = Array.from(
      { length: end - start + 1 },
      (_, k) => start - 1 + k
    ).filter((idx) => idx >= 0 && idx < sourceDoc.getPageCount());

    const newDoc = await PDFDocument.create();
    newDoc.setCreator('FileDoctor');
    const copied = await newDoc.copyPages(sourceDoc, indices);
    copied.forEach((p) => newDoc.addPage(p));
    const pdfBytes = await newDoc.save();

    const baseName = getBaseName(file.name);
    results.push({
      blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      fileName: `${baseName}_pages_${start}-${end}.pdf`,
      mimeType: 'application/pdf',
      metadata: { pageCount: newDoc.getPageCount(), rangeStart: start, rangeEnd: end },
    });

    onProgress?.(Math.round(((ri + 1) / pageRanges.length) * 100));
  }

  return results;
}

/**
 * Extract all pages as individual PDFs.
 */
export async function splitPdfIntoPages(
  file: File,
  ctx: ProcessingContext = {}
): Promise<ProcessingResult[]> {
  const { onProgress, signal } = ctx;
  const ab = await file.arrayBuffer();
  const sourceDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
  const results: ProcessingResult[] = [];
  const total = sourceDoc.getPageCount();
  const baseName = getBaseName(file.name);

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const newDoc = await PDFDocument.create();
    newDoc.setCreator('FileDoctor');
    const [copied] = await newDoc.copyPages(sourceDoc, [i]);
    newDoc.addPage(copied);
    const pdfBytes = await newDoc.save();
    results.push({
      blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      fileName: `${baseName}_page_${i + 1}.pdf`,
      mimeType: 'application/pdf',
      metadata: { pageNumber: i + 1 },
    });
    onProgress?.(Math.round(((i + 1) / total) * 100));
  }

  return results;
}

/**
 * Compress a PDF by re-saving with pdf-lib (removes some redundancy).
 * NOTE: pdf-lib re-save does NOT guarantee significant compression.
 * We document this honestly and offer it as a "clean rebuild" operation.
 */
export async function compressPdf(
  file: File,
  ctx: ProcessingContext = {}
): Promise<ProcessingResult & { compressionNote: string }> {
  const { onProgress } = ctx;
  onProgress?.(10);
  const ab = await file.arrayBuffer();
  const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
  onProgress?.(50);
  const pdfBytes = await doc.save({ useObjectStreams: true });
  onProgress?.(100);

  return {
    blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    fileName: withExtension(getBaseName(file.name) + '_compressed', 'pdf'),
    mimeType: 'application/pdf',
    compressionNote:
      'pdf-lib rebuilds the PDF structure which may reduce size for some documents. ' +
      'Significant compression of image-heavy PDFs requires rasterization, which is not yet available.',
  };
}

/**
 * Embed a signature (drawn as PNG data URL) into a PDF page.
 */
export async function signPdf(
  file: File,
  signatureDataUrl: string,
  placement: {
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
  },
  ctx: ProcessingContext = {}
): Promise<ProcessingResult> {
  const { onProgress } = ctx;
  onProgress?.(10);

  const ab = await file.arrayBuffer();
  const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
  onProgress?.(30);

  // Convert data URL to bytes
  const base64 = signatureDataUrl.split(',')[1];
  if (!base64) throw new Error('Invalid signature data.');
  const sigBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const sigImage = await doc.embedPng(sigBytes);
  const pages = doc.getPages();
  const page = pages[Math.min(placement.pageIndex, pages.length - 1)];
  const { height: pageHeight } = page.getSize();

  // pdf-lib uses bottom-left origin; convert from top-left
  const pdfY = pageHeight - placement.y - placement.height;

  page.drawImage(sigImage, {
    x: placement.x,
    y: pdfY,
    width: placement.width,
    height: placement.height,
  });

  onProgress?.(80);
  const pdfBytes = await doc.save();
  onProgress?.(100);

  return {
    blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    fileName: withExtension(getBaseName(file.name) + '_signed', 'pdf'),
    mimeType: 'application/pdf',
  };
}
