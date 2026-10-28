import { useState, useCallback } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { convertImage } from '@/services/imageProcessing';
import { downloadBlob } from '@/utils/download';
import { createZip } from '@/utils/zip';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import { formatBytes } from '@/utils/format';
import type { ProcessingResult, ImageOutputFormat } from '@/types';

type FileResult = { file: File; result?: ProcessingResult; error?: string; preview?: string };

export function ImageConvertPage() {
  const [items, setItems] = useState<FileResult[]>([]);
  const [outputFormat, setOutputFormat] = useState<ImageOutputFormat>('image/webp');
  const [quality, setQuality] = useState(0.88);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const addFiles = useCallback((newFiles: File[]) => {
    const valid: FileResult[] = [];
    for (const f of newFiles) {
      const v = validateFile(f, { acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'], acceptedExtensions: ['png','jpg','jpeg','webp','gif','bmp'], maxSizeBytes: 30*1024*1024 });
      if (!v.valid) { toastError(v.error); continue; }
      valid.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setItems((prev) => [...prev, ...valid]);
    proc.reset();
  }, [proc, toastError]);

  const handleConvert = async () => {
    if (items.length === 0) return;
    proc.start();
    addRecentTool('image-convert');
    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      try {
        const res = await convertImage(updated[i].file, outputFormat, quality);
        updated[i] = { ...updated[i], result: res, error: undefined };
      } catch (err) {
        updated[i] = { ...updated[i], error: (err as Error).message };
      }
      proc.setProgress(Math.round(((i + 1) / updated.length) * 100));
      setItems([...updated]);
    }
    proc.setDone();
  };

  const downloadAll = async () => {
    const ready = items.filter((i) => i.result);
    if (ready.length === 1) { downloadBlob(ready[0].result!.blob, ready[0].result!.fileName); return; }
    const zip = await createZip(ready.map((i) => ({ fileName: i.result!.fileName, data: i.result!.blob })));
    downloadBlob(zip, 'converted_images.zip');
  };

  const formatLabels: Record<ImageOutputFormat, string> = {
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/webp': 'WebP',
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={RefreshCw} title="Convert Images" description="Convert images between PNG, JPEG, and WebP formats in your browser." badge={<span className="badge-green">Processed locally</span>} />

      <DropZone onFiles={addFiles} accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp" multiple label="Drop images here" hint="PNG, JPEG, WebP, GIF, BMP" maxSizeMB={30} />

      {items.length > 0 && (
        <div className="card p-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="label">Output format</label>
              <div className="flex gap-2">
                {(Object.keys(formatLabels) as ImageOutputFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${outputFormat === fmt ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'}`}
                  >
                    {formatLabels[fmt]}
                  </button>
                ))}
              </div>
            </div>
            {outputFormat !== 'image/png' && (
              <div className="flex flex-col gap-1">
                <label className="label">Quality ({Math.round(quality * 100)}%)</label>
                <input type="range" min="0.5" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-36 accent-brand-600" aria-label="Quality" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {item.preview && <img src={item.preview} alt="" className="w-12 h-12 object-cover rounded shrink-0" aria-hidden="true" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span>{formatBytes(item.file.size)}</span>
                    {item.result && <>
                      <span>→</span>
                      <span className={item.result.blob.size < item.file.size ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}>
                        {formatBytes(item.result.blob.size)}
                      </span>
                    </>}
                    {item.error && <span className="text-red-500">{item.error}</span>}
                  </div>
                </div>
                {item.result && (
                  <button onClick={() => downloadBlob(item.result!.blob, item.result!.fileName)} className="btn-ghost p-1.5 shrink-0" aria-label="Download">
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => {
                  if (item.preview) URL.revokeObjectURL(item.preview);
                  setItems((prev) => prev.filter((_, i) => i !== idx));
                }} className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none shrink-0" aria-label="Remove">×</button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <button onClick={handleConvert} disabled={proc.status === 'processing'} className="btn-primary">
              Convert {items.length} image{items.length !== 1 ? 's' : ''}
            </button>
            {items.some((i) => i.result) && (
              <button onClick={downloadAll} className="btn-secondary">
                <Download className="w-4 h-4" /> Download all
              </button>
            )}
          </div>
        </div>
      )}

      {proc.status === 'processing' && <ProgressBar progress={proc.progress} label="Converting…" />}
    </div>
  );
}
