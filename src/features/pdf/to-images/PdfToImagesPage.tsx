import { useState } from 'react';
import { Images, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { downloadBlob } from '@/utils/download';
import { createZip } from '@/utils/zip';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import { formatBytes } from '@/utils/format';
import { getBaseName } from '@/utils/sanitize';

type PageImage = { pageNum: number; blob: Blob; url: string };

export function PdfToImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [scale, setScale] = useState(1.5);
  const [images, setImages] = useState<PageImage[]>([]);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, { acceptedMimeTypes: ['application/pdf'], acceptedExtensions: ['pdf'] });
    if (!v.valid) { toastError(v.error); return; }
    setFile(f);
    setImages([]);
    proc.reset();

    // Load page count with pdfjs
    try {
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
      const ab = await f.arrayBuffer();
      const pdf = await getDocument({ data: ab }).promise;
      setPageCount(pdf.numPages);
      await pdf.destroy();
    } catch { toastError('Could not read PDF page count.'); }
  };

  const handleConvert = async () => {
    if (!file) return;
    const ac = proc.start();
    addRecentTool('pdf-to-images');
    // Clean up previous blob URLs
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);

    try {
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
      const ab = await file.arrayBuffer();
      const pdf = await getDocument({ data: ab }).promise;
      const total = pdf.numPages;
      const generated: PageImage[] = [];

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        if (ac.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob((b) => b ? res(b) : rej(new Error('Canvas to blob failed')), format, 0.92);
        });

        const url = URL.createObjectURL(blob);
        generated.push({ pageNum, blob, url });
        setImages([...generated]);
        proc.setProgress(Math.round((pageNum / total) * 100));
        page.cleanup();
      }

      await pdf.destroy();
      proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'RENDER_FAILED', message: (err as Error).message });
    }
  };

  const downloadAll = async () => {
    if (images.length === 1) {
      downloadBlob(images[0].blob, `${getBaseName(file?.name ?? 'page')}_p1.${format === 'image/png' ? 'png' : 'jpg'}`);
      return;
    }
    const ext = format === 'image/png' ? 'png' : 'jpg';
    const zip = await createZip(images.map((img) => ({
      fileName: `${getBaseName(file?.name ?? 'page')}_p${img.pageNum}.${ext}`,
      data: img.blob,
    })));
    downloadBlob(zip, `${getBaseName(file?.name ?? 'pages')}_images.zip`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Images} title="PDF to Images" description="Render each PDF page as a PNG or JPEG image." badge={<span className="badge-green">Processed locally</span>} />

      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf,application/pdf" label="Drop a PDF here" maxSizeMB={50} />
      ) : (
        <FileItem file={file} onRemove={() => { images.forEach((i) => URL.revokeObjectURL(i.url)); setFile(null); setImages([]); proc.reset(); }} />
      )}

      {file && (
        <div className="card p-4 flex flex-col gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{pageCount} pages detected</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label className="label">Output format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className="input w-40">
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="label">Resolution scale ({scale}×)</label>
              <input type="range" min="1" max="3" step="0.5" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-36 accent-brand-600" aria-label="Resolution scale" />
            </div>
          </div>
          <button onClick={handleConvert} disabled={proc.status === 'processing'} className="btn-primary self-start">
            Convert to Images
          </button>
        </div>
      )}

      {proc.status === 'processing' && (
        <ProgressBar progress={proc.progress > 0 ? proc.progress : -1} label={`Rendering pages (${images.length}/${pageCount})…`} />
      )}

      {proc.status === 'error' && (
        <div className="card p-4 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{proc.error?.message}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{images.length} image{images.length !== 1 ? 's' : ''}</p>
            {proc.status === 'done' && (
              <button onClick={downloadAll} className="btn-primary text-sm">
                <Download className="w-4 h-4" />
                {images.length === 1 ? 'Download' : 'Download all (ZIP)'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.pageNum} className="card overflow-hidden flex flex-col">
                <img src={img.url} alt={`Page ${img.pageNum}`} className="w-full h-32 object-contain bg-gray-100 dark:bg-gray-800" loading="lazy" />
                <div className="p-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">p.{img.pageNum} · {formatBytes(img.blob.size)}</span>
                  <button
                    onClick={() => downloadBlob(img.blob, `page_${img.pageNum}.${format === 'image/png' ? 'png' : 'jpg'}`)}
                    className="btn-ghost p-1"
                    aria-label={`Download page ${img.pageNum}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
