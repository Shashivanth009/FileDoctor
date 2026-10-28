import { useState, useEffect } from 'react';
import { Crop } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProcessingCard } from '@/components/processing/ProcessingCard';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { getImageInfo, resizeImage } from '@/services/imageProcessing';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { ProcessingResult, ImageOutputFormat, ImageInfo } from '@/types';

const PRESETS = [
  { label: 'HD (1280×720)', w: 1280, h: 720 },
  { label: 'FHD (1920×1080)', w: 1920, h: 1080 },
  { label: 'Twitter (1200×675)', w: 1200, h: 675 },
  { label: 'Instagram (1080×1080)', w: 1080, h: 1080 },
  { label: 'Thumbnail (320×180)', w: 320, h: 180 },
];

export function ImageResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [outputFormat, setOutputFormat] = useState<ImageOutputFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.9);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, { acceptedMimeTypes: ['image/png','image/jpeg','image/webp','image/gif','image/bmp'], maxSizeBytes: 30*1024*1024 });
    if (!v.valid) { toastError(v.error); return; }
    setFile(f);
    setResult(null); proc.reset();
    try {
      const info = await getImageInfo(f);
      setImageInfo(info);
      setWidth(info.width);
      setHeight(info.height);
    } catch { toastError('Could not read image dimensions.'); }
  };

  const changeWidth = (w: number) => {
    setWidth(w);
    if (lockAspect && imageInfo) setHeight(Math.round(w / (imageInfo.width / imageInfo.height)));
  };

  const changeHeight = (h: number) => {
    setHeight(h);
    if (lockAspect && imageInfo) setWidth(Math.round(h * (imageInfo.width / imageInfo.height)));
  };

  const handleResize = async () => {
    if (!file) return;
    if (width < 1 || height < 1) { toastError('Dimensions must be at least 1×1.'); return; }
    if (width > 16000 || height > 16000) { toastError('Max dimensions are 16000×16000.'); return; }
    const ac = proc.start();
    addRecentTool('image-resize');
    try {
      const res = await resizeImage(file, width, height, outputFormat, quality, { onProgress: proc.setProgress, signal: ac.signal });
      setResult(res);
      proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'RESIZE_FAILED', message: (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Crop} title="Resize Image" description="Resize images to exact pixel dimensions with optional aspect-ratio lock." badge={<span className="badge-green">Processed locally</span>} />

      {!file ? (
        <DropZone onFiles={handleFile} accept="image/*" label="Drop an image here" maxSizeMB={30} />
      ) : (
        <FileItem file={file} onRemove={() => { setFile(null); setImageInfo(null); setResult(null); proc.reset(); }} />
      )}

      {imageInfo && (
        <div className="card p-4 flex flex-col gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Original: <strong className="text-gray-700 dark:text-gray-200">{imageInfo.width} × {imageInfo.height}</strong>
          </p>

          {/* Presets */}
          <div className="flex flex-col gap-1">
            <label className="label">Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => { setLockAspect(false); setWidth(p.w); setHeight(p.h); }}
                  className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-600 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension inputs */}
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="label" htmlFor="img-width">Width (px)</label>
              <input id="img-width" type="number" min={1} max={16000} value={width} onChange={(e) => changeWidth(Number(e.target.value))} className="input w-28" />
            </div>
            <button onClick={() => setLockAspect((l) => !l)} className={`mb-1 px-2 py-1.5 text-xs rounded border transition-colors ${lockAspect ? 'bg-brand-100 dark:bg-brand-900/30 border-brand-400 text-brand-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`} aria-pressed={lockAspect} aria-label="Lock aspect ratio">
              {lockAspect ? '🔒' : '🔓'} Ratio
            </button>
            <div className="flex flex-col gap-1">
              <label className="label" htmlFor="img-height">Height (px)</label>
              <input id="img-height" type="number" min={1} max={16000} value={height} onChange={(e) => changeHeight(Number(e.target.value))} className="input w-28" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="label">Format</label>
              <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as ImageOutputFormat)} className="input w-32">
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
            {outputFormat !== 'image/png' && (
              <div className="flex flex-col gap-1">
                <label className="label">Quality ({Math.round(quality * 100)}%)</label>
                <input type="range" min="0.5" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-32 accent-brand-600" aria-label="Quality" />
              </div>
            )}
          </div>

          <button onClick={handleResize} disabled={proc.status === 'processing'} className="btn-primary self-start">
            Resize to {width}×{height}
          </button>
        </div>
      )}

      <ProcessingCard
        status={proc.status}
        progress={proc.progress}
        errorMessage={proc.error?.message}
        result={result}
        originalSize={file?.size}
        onCancel={proc.cancel}
        onReset={() => { proc.reset(); setFile(null); setImageInfo(null); setResult(null); }}
      />
    </div>
  );
}
