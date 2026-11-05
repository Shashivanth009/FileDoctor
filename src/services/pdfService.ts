import { PDFDocument, rgb, degrees, StandardFonts, PDFName, PDFDict, PDFRawStream } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import { readFileAsArrayBuffer } from './fileService';
import { ProcessingResult } from '@/types';

export interface PdfCompressionOptions {
  mode: 'preset' | 'percentage' | 'target-size' | 'advanced';
  preset?: 'light' | 'balanced' | 'strong' | 'maximum';
  reductionPercentage?: number;
  targetSizeKB?: number;
  imageQuality?: number; // 0.1 to 1.0
  scaleFactor?: number; // 0.5 to 2.0
  removeMetadata?: boolean;
  grayscale?: boolean;
  rasterize?: boolean;
}

export interface PdfOrganizePageAction {
  originalIndex: number;
  rotation: number; // 0, 90, 180, 270
}

/**
 * Helper: Recompresses oversized embedded JPEG images within a PDFDocument.
 * Crucially preserves 100% vector typography, vector graphics, bookmarks, and layout integrity.
 */
async function optimizeEmbeddedImages(
  pdfDoc: PDFDocument,
  maxDimension: number,
  quality: number
): Promise<{ count: number; bytesSaved: number }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { count: 0, bytesSaved: 0 };
  }

  let count = 0;
  let bytesSaved = 0;
  const processedRefKeys = new Set<string>();

  try {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const resources = page.node.Resources();
      if (!resources) continue;
      const xObjectDict = resources.lookup(PDFName.of('XObject'));
      if (!xObjectDict || !(xObjectDict instanceof PDFDict)) continue;

      for (const [key, ref] of xObjectDict.entries()) {
        const refKey = ref.toString();
        if (processedRefKeys.has(refKey)) continue;

        const obj = pdfDoc.context.lookup(ref);
        if (!obj || !(obj instanceof PDFRawStream)) continue;

        const subtype = obj.dict.lookup(PDFName.of('Subtype'));
        if (subtype?.toString() !== '/Image') continue;

        const filter = obj.dict.lookup(PDFName.of('Filter'));
        const isJpeg = filter?.toString() === '/DCTDecode';
        const rawBytes = obj.getContents();

        // Only process substantial images (> 12 KB)
        if (rawBytes.length < 12288) continue;

        if (isJpeg) {
          try {
            const blob = new Blob([rawBytes as unknown as BlobPart], { type: 'image/jpeg' });
            let bmp: ImageBitmap | null = null;
            if (typeof createImageBitmap === 'function') {
              bmp = await createImageBitmap(blob);
            }

            if (!bmp) continue;

            const origW = bmp.width;
            const origH = bmp.height;
            let targetW = origW;
            let targetH = origH;

            if (targetW > maxDimension || targetH > maxDimension) {
              const scale = Math.min(maxDimension / targetW, maxDimension / targetH);
              targetW = Math.max(1, Math.round(targetW * scale));
              targetH = Math.max(1, Math.round(targetH * scale));
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            ctx.drawImage(bmp, 0, 0, targetW, targetH);
            const optimizedBlob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, 'image/jpeg', quality)
            );

            if (optimizedBlob && optimizedBlob.size < rawBytes.length * 0.90) {
              const newBuf = await optimizedBlob.arrayBuffer();
              const newPdfImg = await pdfDoc.embedJpg(new Uint8Array(newBuf));
              xObjectDict.set(key, newPdfImg.ref);
              processedRefKeys.add(refKey);
              bytesSaved += rawBytes.length - optimizedBlob.size;
              count++;
            }
          } catch {
            // Ignore single image failure and continue
          }
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  return { count, bytesSaved };
}

/**
 * Renders a PDF page to an HTML Canvas with high-fidelity font anti-aliasing
 */
export async function renderPdfPageToCanvas(
  pdfDocProxy: any,
  pageNumber: number,
  scale = 1.5,
  grayscale = false
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const page = await pdfDocProxy.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  // High-fidelity rendering context: opaque white base to eliminate text edge fringing
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not create canvas 2D context');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  await page.render({ canvasContext: ctx, viewport }).promise;

  if (grayscale) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = gray;
      d[i + 1] = gray;
      d[i + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return { canvas, width: viewport.width, height: viewport.height };
}

/**
 * 8.1 PDF Compressor — Multi-strategy real compression
 * Supports Presets (Light, Balanced, Strong, Maximum), Percentage, Target Size, and Advanced.
 * Enforces high visual quality, crisp text legibility, vector preservation, and STRICT size reduction.
 */
export async function compressPdf(
  file: File,
  options: PdfCompressionOptions
): Promise<ProcessingResult & { strategyUsed: string; targetAchieved?: boolean }> {
  const startTime = performance.now();
  const originalSize = file.size;
  const buffer = await readFileAsArrayBuffer(file);
  const warnings: string[] = [];

  let strategy = 'High-Fidelity Vector & Stream Optimization';
  let bestBytes: Uint8Array = new Uint8Array(buffer);
  let bestSize = originalSize;

  // -------------------------------------------------------------
  // STEP 0: Multi-Strategy Parameter Calibration
  // -------------------------------------------------------------
  let targetBytes = Math.round(originalSize * 0.60);
  let targetQuality = 0.75;
  let targetScale = 1.20;
  let maxImageDimension = 1280;
  let strategyLabel = 'Balanced High-Fidelity Compression';

  if (options.mode === 'preset') {
    switch (options.preset) {
      case 'light':
        targetBytes = Math.round(originalSize * 0.80);
        targetQuality = 0.85;
        targetScale = 1.35;
        maxImageDimension = 1600;
        strategyLabel = 'Light Studio Optimization (Vector preserved, ~20% reduction)';
        break;
      case 'strong':
        targetBytes = Math.round(originalSize * 0.45);
        targetQuality = 0.64;
        targetScale = 1.00;
        maxImageDimension = 1024;
        strategyLabel = 'Strong Crisp Compression (~55% reduction)';
        break;
      case 'maximum':
        targetBytes = Math.round(originalSize * 0.28);
        targetQuality = 0.52;
        targetScale = 0.85;
        maxImageDimension = 800;
        strategyLabel = 'Maximum Practical Compression (~70% reduction)';
        break;
      case 'balanced':
      default:
        targetBytes = Math.round(originalSize * 0.58);
        targetQuality = 0.75;
        targetScale = 1.20;
        maxImageDimension = 1280;
        strategyLabel = 'Balanced High-Fidelity Compression (~40% reduction)';
        break;
    }
  } else if (options.mode === 'percentage') {
    const pct = Math.max(5, Math.min(90, options.reductionPercentage || 40));
    targetBytes = Math.round(originalSize * (1 - pct / 100));
    targetQuality = Math.max(0.48, 0.88 - (pct / 100) * 0.38);
    targetScale = Math.max(0.75, 1.40 - (pct / 100) * 0.65);
    maxImageDimension = Math.round(1600 - (pct / 100) * 800);
    strategyLabel = `Target Percentage (-${pct}%) Compression`;
  } else if (options.mode === 'target-size') {
    const desiredBytes = (options.targetSizeKB || 500) * 1024;
    targetBytes = Math.min(desiredBytes, Math.round(originalSize * 0.90));
    const ratio = Math.max(0.15, Math.min(0.95, targetBytes / originalSize));
    targetQuality = Math.max(0.48, Math.min(0.88, 0.45 + ratio * 0.42));
    targetScale = Math.max(0.75, Math.min(1.40, 0.70 + ratio * 0.70));
    maxImageDimension = Math.round(750 + ratio * 850);
    strategyLabel = `Exact Target Size (~${Math.round(targetBytes / 1024)} KB) Compression`;
  } else if (options.mode === 'advanced') {
    targetQuality = Math.max(0.20, options.imageQuality || 0.75);
    targetScale = Math.max(0.50, options.scaleFactor || 1.15);
    maxImageDimension = Math.round(1400 * (options.scaleFactor || 1.0));
    targetBytes = Math.round(originalSize * 0.60);
    strategyLabel = `Custom Advanced (${Math.round(targetScale * 72)} DPI, ${Math.round(targetQuality * 100)}% quality)`;
  }

  targetBytes = Math.min(targetBytes, Math.round(originalSize * 0.95));

  try {
    // -------------------------------------------------------------
    // PHASE 1: Structural Stream Compaction & Object Streams
    // -------------------------------------------------------------
    let pdfDoc: PDFDocument | null = null;
    try {
      pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      if (options.removeMetadata !== false) {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setProducer('FileDoctor Privacy Engine');
        pdfDoc.setCreator('FileDoctor');
        pdfDoc.setKeywords([]);

        try {
          pdfDoc.catalog.delete(PDFName.of('Metadata'));
          pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
          pdfDoc.catalog.delete(PDFName.of('StructTreeRoot'));
        } catch {}

        try {
          const pages = pdfDoc.getPages();
          for (const page of pages) {
            page.node.delete(PDFName.of('Thumb'));
            page.node.delete(PDFName.of('PieceInfo'));
          }
        } catch {}
      }

      // Recompress embedded images inside the vector PDF
      const imgOpt = await optimizeEmbeddedImages(pdfDoc, maxImageDimension, targetQuality);

      const structuralBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      if (structuralBytes.length < bestSize) {
        bestBytes = structuralBytes;
        bestSize = structuralBytes.length;
        if (imgOpt.count > 0) {
          strategy = `${strategyLabel} (${imgOpt.count} embedded images optimized, 100% vector text preserved)`;
        } else {
          strategy = 'Lossless Structural & Object Stream Compression (100% Vector Quality)';
        }
      }
    } catch {
      // If structural pass fails, proceed to visual check
    }

    // -------------------------------------------------------------
    // PHASE 2: Visual Page-Level Compression
    // -------------------------------------------------------------
    // Attempt visual rasterization ONLY if:
    // 1) The user explicitly requested rasterization (options.rasterize === true), OR
    // 2) The best achieved size so far still exceeds targetBytes AND preset is strong/maximum or target-size/percentage
    const shouldEvaluateVisual =
      options.rasterize === true ||
      (bestSize > targetBytes &&
        (options.mode === 'percentage' ||
          options.mode === 'target-size' ||
          (options.mode === 'preset' && (options.preset === 'strong' || options.preset === 'maximum'))));

    if (shouldEvaluateVisual) {
      try {
        const pdfProxy = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        const numPages = pdfProxy.numPages;

        const page1 = await pdfProxy.getPage(1);
        const vp1 = page1.getViewport({ scale: 1.0 });
        const baseWidth = vp1.width || 612;

        // Wide presentation slides adjustment
        const slideModifier = baseWidth > 1000 ? Math.min(1.0, 1280 / baseWidth) : 1.0;
        let scale = Math.max(0.65, targetScale * slideModifier);

        if (options.mode === 'advanced' && options.scaleFactor) {
          scale = Math.max(0.50, Math.min(2.0, options.scaleFactor));
        }

        let quality = targetQuality;
        const overhead = 3072 + numPages * 800;
        const availableImageBudget = Math.max(10240, targetBytes - overhead);
        const budgetPerPage = availableImageBudget / Math.max(1, numPages);

        // Calibration test on Page 1
        const testCanvasResult = await renderPdfPageToCanvas(
          pdfProxy,
          1,
          scale,
          options.grayscale || false
        );

        const testBlob = await new Promise<Blob>((resolve) => {
          testCanvasResult.canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', quality);
        });

        // Fast-path protection: if Page 1 alone indicates rasterizing will exceed our current best size,
        // DO NOT rasterize the remaining pages! Prevents inflating vector slides.
        const estimatedTotalVisual = testBlob.size * numPages + overhead;
        const willInflate = estimatedTotalVisual >= bestSize && !options.rasterize;

        if (!willInflate) {
          if (testBlob.size > budgetPerPage) {
            const ratio = budgetPerPage / testBlob.size;
            scale = Math.max(0.60, scale * Math.sqrt(ratio) * 0.95);
            quality = Math.max(0.48, quality * Math.pow(ratio, 0.18));
          }

          const visualDoc = await PDFDocument.create();

          for (let p = 1; p <= numPages; p++) {
            const { canvas, width, height } = await renderPdfPageToCanvas(
              pdfProxy,
              p,
              scale,
              options.grayscale || false
            );

            let pageBlob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', quality);
            });

            if (pageBlob.size > budgetPerPage * 1.30 && quality > 0.55) {
              const tightQuality = Math.max(0.48, quality * 0.88);
              pageBlob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', tightQuality);
              });
            }

            const pageBuffer = await pageBlob.arrayBuffer();
            const embeddedImg = await visualDoc.embedJpg(new Uint8Array(pageBuffer));

            const pageScale = 1 / scale;
            const finalWidth = width * pageScale;
            const finalHeight = height * pageScale;

            const page = visualDoc.addPage([finalWidth, finalHeight]);
            page.drawImage(embeddedImg, {
              x: 0,
              y: 0,
              width: finalWidth,
              height: finalHeight,
            });
          }

          if (options.removeMetadata !== false) {
            visualDoc.setTitle('');
            visualDoc.setAuthor('');
            visualDoc.setSubject('');
            visualDoc.setProducer('FileDoctor Privacy Engine');
            visualDoc.setCreator('FileDoctor');
          }

          const visualBytes = await visualDoc.save({ useObjectStreams: true });

          // STRICT CHECK: ONLY accept visual compression if it actually BEATS bestSize!
          if (visualBytes.length < bestSize) {
            bestBytes = visualBytes;
            bestSize = visualBytes.length;
            strategy = `${strategyLabel} (Rasterized at ${Math.round(scale * 72)} DPI, ${Math.round(quality * 100)}% quality)`;
            warnings.push('Document rasterized: selectable text converted to high-fidelity images.');
          }
        }
      } catch {
        // If visual compression fails, keep bestBytes from Phase 1
      }
    }

    const outputBlob = new Blob([bestBytes as unknown as BlobPart], { type: 'application/pdf' });
    const outputSize = outputBlob.size;
    const processingTime = performance.now() - startTime;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outputFilename = `${baseName}_compressed.pdf`;

    const reductionAchieved = outputSize < originalSize;
    const meetsTarget = options.targetSizeKB
      ? outputSize <= options.targetSizeKB * 1024
      : outputSize <= targetBytes * 1.10;

    return {
      success: true,
      outputBlob,
      outputFilename,
      originalSize,
      outputSize,
      processingTime,
      strategyUsed: strategy,
      warnings,
      targetAchieved: meetsTarget && reductionAchieved,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize,
      processingTime: performance.now() - startTime,
      strategyUsed: strategy,
      error: err.message || 'Failed to compress PDF',
    };
  }
}

/**
 * 8.2 PDF Merge: Combine multiple PDFs into one
 */
export async function mergePdfs(files: File[]): Promise<ProcessingResult> {
  const startTime = performance.now();
  let totalOriginalSize = 0;

  try {
    const mergedDoc = await PDFDocument.create();

    for (const file of files) {
      totalOriginalSize += file.size;
      const buffer = await readFileAsArrayBuffer(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }

    const outputBytes = await mergedDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });

    return {
      success: true,
      outputBlob,
      outputFilename: 'merged_document.pdf',
      originalSize: totalOriginalSize,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: totalOriginalSize,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to merge PDFs',
    };
  }
}

/**
 * 8.3 PDF Split: Split into pages or ranges
 */
export async function splitPdf(
  file: File,
  pagesToExtract: number[] // 1-based page indices
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();

    const zeroBasedIndices = pagesToExtract
      .map((p) => p - 1)
      .filter((idx) => idx >= 0 && idx < sourceDoc.getPageCount());

    const copiedPages = await newDoc.copyPages(sourceDoc, zeroBasedIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    const outputBytes = await newDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}_split.pdf`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to split PDF',
    };
  }
}

/**
 * 8.4 PDF Organize: Reorder, rotate, delete pages
 */
export async function organizePdf(
  file: File,
  pageActions: PdfOrganizePageAction[] // target ordered list with rotation
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();

    for (const action of pageActions) {
      const [copiedPage] = await newDoc.copyPages(sourceDoc, [action.originalIndex]);
      if (action.rotation) {
        const currentRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((currentRotation + action.rotation) % 360));
      }
      newDoc.addPage(copiedPage);
    }

    const outputBytes = await newDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}_organized.pdf`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to organize PDF',
    };
  }
}

/**
 * 8.5 PDF to Images: Export pages as image files
 */
export async function pdfToImages(
  file: File,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  dpiScale = 2.0
): Promise<{ images: { blob: Blob; pageNumber: number; filename: string }[]; processingTime: number }> {
  const startTime = performance.now();
  const buffer = await readFileAsArrayBuffer(file);
  const pdfProxy = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  const images: { blob: Blob; pageNumber: number; filename: string }[] = [];

  for (let p = 1; p <= pdfProxy.numPages; p++) {
    const { canvas } = await renderPdfPageToCanvas(pdfProxy, p, dpiScale);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), mimeType, 0.92);
    });
    images.push({
      blob,
      pageNumber: p,
      filename: `${baseName}_page_${p}.${format}`,
    });
  }

  return { images, processingTime: performance.now() - startTime };
}

/**
 * 8.6 Images to PDF: Convert images to formatted PDF
 */
export async function imagesToPdf(
  files: File[],
  options: {
    pageSize?: 'a4' | 'letter' | 'fit';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
  } = {}
): Promise<ProcessingResult> {
  const startTime = performance.now();
  let totalSize = 0;

  try {
    const pdfDoc = await PDFDocument.create();
    const margin = options.margin ?? 20;

    for (const file of files) {
      totalSize += file.size;
      const buffer = await readFileAsArrayBuffer(file);
      const type = file.type;

      let embeddedImage;
      if (type === 'image/jpeg' || type === 'image/jpg') {
        embeddedImage = await pdfDoc.embedJpg(buffer);
      } else if (type === 'image/png') {
        embeddedImage = await pdfDoc.embedPng(buffer);
      } else {
        // Convert any other image (WebP, BMP, GIF) to PNG via canvas
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const img = new Image();
        img.src = dataUrl;
        await new Promise((res) => (img.onload = res));

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        const pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b || new Blob()), 'image/png'));
        const pngBuf = await pngBlob.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(pngBuf);
      }

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;

      let pageWidth = 595.28; // A4 pt
      let pageHeight = 841.89;

      if (options.pageSize === 'letter') {
        pageWidth = 612.0;
        pageHeight = 792.0;
      } else if (options.pageSize === 'fit') {
        pageWidth = imgWidth + margin * 2;
        pageHeight = imgHeight + margin * 2;
      }

      if (options.orientation === 'landscape' && pageWidth < pageHeight) {
        const tmp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = tmp;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });

    return {
      success: true,
      outputBlob,
      outputFilename: 'images_document.pdf',
      originalSize: totalSize,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: totalSize,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to convert images to PDF',
    };
  }
}

/**
 * 8.7 PDF Signer: Add signature image at position (x, y)
 */
export async function signPdf(
  file: File,
  signatureDataUrl: string,
  pageIndex: number,
  xPct: number, // 0 to 1
  yPct: number, // 0 to 1
  widthPct: number // 0 to 1
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    // Clean signature base64
    const signatureImageBytes = await fetch(signatureDataUrl).then((res) => res.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

    const pages = pdfDoc.getPages();
    const page = pages[pageIndex] || pages[0];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const sigWidth = pageWidth * widthPct;
    const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;

    const x = pageWidth * xPct;
    // PDF coordinate system origin (0,0) is bottom-left
    const y = pageHeight - (pageHeight * yPct) - sigHeight;

    page.drawImage(signatureImage, {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: sigWidth,
      height: sigHeight,
    });

    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}_signed.pdf`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to sign PDF',
    };
  }
}

/**
 * Additional PDF Tool: Rotate PDF Pages
 */
export async function rotatePdf(file: File, angleDegrees: number): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angleDegrees) % 360));
    });

    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}_rotated.pdf`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to rotate PDF',
    };
  }
}

/**
 * Additional PDF Tool: Watermark PDF
 */
export async function watermarkPdf(
  file: File,
  text: string,
  opacity = 0.35,
  fontSize = 48
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: fontSize,
        font,
        color: rgb(0.6, 0.6, 0.6),
        opacity,
        rotate: degrees(45),
      });
    });

    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}_watermarked.pdf`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to watermark PDF',
    };
  }
}

/**
 * Additional PDF Tool: Add Page Numbers
 */
export async function addPageNumbersToPdf(
  file: File,
  position: 'bottom-center' | 'bottom-right' | 'top-right' = 'bottom-center'
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const total = pages.length;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const text = `Page ${index + 1} of ${total}`;
      const fontSize = 10;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let x = (width - textWidth) / 2;
      let y = 20;

      if (position === 'bottom-right') {
        x = width - textWidth - 30;
        y = 20;
      } else if (position === 'top-right') {
        x = width - textWidth - 30;
        y = height - 25;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    });

    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}_numbered.pdf`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to add page numbers',
    };
  }
}

/**
 * Additional PDF Tool: PDF to Plain Text
 */
export async function extractPdfText(file: File): Promise<{ text: string; pageCount: number; processingTime: number }> {
  const startTime = performance.now();
  const buffer = await readFileAsArrayBuffer(file);
  const pdfProxy = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  let fullText = '';
  for (let p = 1; p <= pdfProxy.numPages; p++) {
    const page = await pdfProxy.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    fullText += `--- Page ${p} ---\n${pageText}\n\n`;
  }

  return {
    text: fullText.trim(),
    pageCount: pdfProxy.numPages,
    processingTime: performance.now() - startTime,
  };
}

/**
 * Additional PDF Tool: Flatten Form Fields
 */
export async function flattenPdf(file: File): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {
      // Form might not exist, proceed
    }

    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob,
      outputFilename: `${baseName}_flattened.pdf`,
      originalSize: file.size,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to flatten PDF',
    };
  }
}

