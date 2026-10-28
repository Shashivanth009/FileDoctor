import { useState, useCallback } from 'react';
import { FileImage, ArrowUp, ArrowDown } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProcessingCard } from '@/components/processing/ProcessingCard';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { downloadBlob } from '@/utils/download';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { ProcessingResult } from '@/types';

const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'];
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp'];

export function ImagesToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const addFiles = useCallback((newFiles: File[]) => {
    const valid: File[] = [];
    for (const f of newFiles) {
      const v = validateFile(f, { acceptedMimeTypes: IMAGE_MIME, acceptedExtensions: IMAGE_EXT, maxSizeBytes: 30 * 1024 * 1024 });
      if (!v.valid) { toastError(v.error); continue; }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid]);
    setResult(null);
    proc.reset();
  }, [proc, toastError]);

  const moveFile = (idx: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const arr = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return arr;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
  };

  const PAGE_SIZES: Record<string, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612, 792],
  };

  const handleConvert = async () => {
    if (files.length === 0) { toastError('Add at least one image.'); return; }
    const ac = proc.start();
    addRecentTool('pdf-from-images');
    try {
      const pdf = await PDFDocument.create();
      pdf.setCreator('FileDoctor');

      for (let i = 0; i < files.length; i++) {
        if (ac.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        const f = files[i];
        const ab = await f.arrayBuffer();
        const bytes = new Uint8Array(ab);

        let embeddedImage;
        if (f.type === 'image/png') {
          embeddedImage = await pdf.embedPng(bytes);
        } else if (f.type === 'image/jpeg') {
          embeddedImage = await pdf.embedJpg(bytes);
        } else {
          // Convert WebP to PNG via canvas
          const blob = await convertToPng(f);
          const pngAb = await blob.arrayBuffer();
          embeddedImage = await pdf.embedPng(new Uint8Array(pngAb));
        }

        let pWidth: number, pHeight: number;
        if (pageSize === 'fit') {
          pWidth = embeddedImage.width;
          pHeight = embeddedImage.height;
        } else {
          [pWidth, pHeight] = PAGE_SIZES[pageSize];
          // Rotate to landscape if image is wider
          if (embeddedImage.width > embeddedImage.height && pWidth < pHeight) {
            [pWidth, pHeight] = [pHeight, pWidth];
          }
        }

        const page = pdf.addPage([pWidth, pHeight]);
        const { width: iw, height: ih } = embeddedImage;
        const scale = Math.min(pWidth / iw, pHeight / ih);
        const scaledW = iw * scale;
        const scaledH = ih * scale;

        page.drawImage(embeddedImage, {
          x: (pWidth - scaledW) / 2,
          y: (pHeight - scaledH) / 2,
          width: scaledW,
          height: scaledH,
        });

        proc.setProgress(Math.round(((i + 1) / files.length) * 90));
      }

      const pdfBytes = await pdf.save();
      proc.setProgress(100);

      const res: ProcessingResult = {
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        fileName: 'images.pdf',
        mimeType: 'application/pdf',
        metadata: { pageCount: files.length },
      };
      setResult(res);
      proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'CONVERT_FAILED', message: (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={FileImage} title="Images to PDF" description="Combine images into a single PDF document." badge={<span className="badge-green">Processed locally</span>} />

      <DropZone onFiles={addFiles} accept="image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp" multiple label="Drop images here" hint="PNG, JPEG, WebP" maxSizeMB={30} />

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="label">{files.length} image{files.length !== 1 ? 's' : ''}</p>

          <div className="flex flex-col gap-1">
            <label className="label">Page size</label>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value as typeof pageSize)} className="input w-40">
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="fit">Fit to image</option>
            </select>
          </div>

          {files.map((file, idx) => (
            <FileItem
              key={`${file.name}-${idx}`}
              file={file}
              onRemove={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
              extra={
                <div className="flex items-center gap-1">
                  <button onClick={() => moveFile(idx, -1)} disabled={idx === 0} className="btn-ghost p-1 disabled:opacity-30" aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveFile(idx, 1)} disabled={idx === files.length - 1} className="btn-ghost p-1 disabled:opacity-30" aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                </div>
              }
            />
          ))}

          <button onClick={handleConvert} disabled={proc.status === 'processing'} className="btn-primary self-start mt-2">
            Create PDF
          </button>
        </div>
      )}

      <ProcessingCard
        status={proc.status}
        progress={proc.progress}
        errorMessage={proc.error?.message}
        result={result}
        onCancel={proc.cancel}
        onReset={() => { proc.reset(); setFiles([]); setResult(null); }}
      />
    </div>
  );
}

async function convertToPng(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/png' });
}
