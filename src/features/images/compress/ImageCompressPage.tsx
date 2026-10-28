import { useState, useCallback } from 'react';
import { Archive, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { compressImage } from '@/services/imageProcessing';
import { downloadBlob } from '@/utils/download';
import { createZip } from '@/utils/zip';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import { formatBytes, formatSizeReduction } from '@/utils/format';
import type { ProcessingResult } from '@/types';

type FileResult = { file: File; result?: ProcessingResult; error?: string; preview?: string };

export function ImageCompressPage() {
  const [items, setItems] = useState<FileResult[]>([]);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [quality, setQuality] = useState(0.8);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const addFiles = useCallback((newFiles: File[]) => {
    const valid: FileResult[] = [];
    for (const f of newFiles) {
      const v = validateFile(f, { acceptedMimeTypes: ['image/png','image/jpeg','image/webp'], maxSizeBytes: 50*1024*1024 });
      if (!v.valid) { toastError(v.error); continue; }
      valid.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setItems((prev) => [...prev, ...valid]);
    proc.reset();
  }, [proc, toastError]);

  const handleCompress = async () => {
    if (items.length === 0) return;
    proc.start();
    addRecentTool('image-compress');
    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      try {
        const res = await compressImage(updated[i].file, maxSizeMB, 4096, quality);
        updated[i] = { ...updated[i], result: res };
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
    downloadBlob(zip, 'compressed_images.zip');
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Archive} title="Compress Images" description="Reduce image file sizes while preserving quality." badge={<span className="badge-green">Processed locally</span>} />

      <DropZone onFiles={addFiles} accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" multiple label="Drop images here" hint="PNG, JPEG, WebP" maxSizeMB={50} />

      {items.length > 0 && (
        <div className="card p-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="label">Target size (MB)</label>
              <input type="number" min={0.1} max={50} step={0.1} value={maxSizeMB} onChange={(e) => setMaxSizeMB(Number(e.target.value))} className="input w-28" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label">Quality ({Math.round(quality * 100)}%)</label>
              <input type="range" min="0.4" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-32 accent-brand-600" aria-label="Quality" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {item.preview && <img src={item.preview} alt="" className="w-12 h-12 object-cover rounded shrink-0" aria-hidden="true" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                    <span>{formatBytes(item.file.size)}</span>
                    {item.result && <>
                      <span>→</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatBytes(item.result.blob.size)}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatSizeReduction(item.file.size, item.result.blob.size)}</span>
                    </>}
                    {item.error && <span className="text-red-500">{item.error}</span>}
                  </div>
                </div>
                {item.result && (
                  <button onClick={() => downloadBlob(item.result!.blob, item.result!.fileName)} className="btn-ghost p-1.5 shrink-0" aria-label="Download"><Download className="w-4 h-4" /></button>
                )}
                <button onClick={() => { if (item.preview) URL.revokeObjectURL(item.preview); setItems((p) => p.filter((_, i) => i !== idx)); }} className="text-gray-400 hover:text-red-500 text-lg shrink-0" aria-label="Remove">×</button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={handleCompress} disabled={proc.status === 'processing'} className="btn-primary">
              Compress {items.length} image{items.length !== 1 ? 's' : ''}
            </button>
            {items.some((i) => i.result) && (
              <button onClick={downloadAll} className="btn-secondary"><Download className="w-4 h-4" /> Download all</button>
            )}
          </div>
        </div>
      )}

      {proc.status === 'processing' && <ProgressBar progress={proc.progress} label="Compressing…" />}
    </div>
  );
}
