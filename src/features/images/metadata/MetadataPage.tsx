import { useState } from 'react';
import { ShieldOff, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProcessingCard } from '@/components/processing/ProcessingCard';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { stripMetadata } from '@/services/imageProcessing';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { ProcessingResult } from '@/types';

export function MetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const handleFile = (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, { acceptedMimeTypes: ['image/png','image/jpeg','image/webp'], maxSizeBytes: 30*1024*1024 });
    if (!v.valid) { toastError(v.error); return; }
    setFile(f); setResult(null); proc.reset();
  };

  const handleStrip = async () => {
    if (!file) return;
    const ac = proc.start();
    addRecentTool('image-metadata');
    try {
      const res = await stripMetadata(file, 0.95, { onProgress: proc.setProgress, signal: ac.signal });
      setResult(res); proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'STRIP_FAILED', message: (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={ShieldOff} title="Strip Metadata" description="Remove EXIF, GPS, and other metadata from images for privacy." badge={<span className="badge-green">Processed locally</span>} />

      <div className="card p-4 flex items-start gap-3 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Metadata is removed by re-encoding the image through Canvas. This reliably strips EXIF, XMP, IPTC, GPS data, and thumbnails embedded in JPEG/PNG/WebP. Re-encoding may slightly affect visual quality. The original file is not modified.
        </p>
      </div>

      {!file ? (
        <DropZone onFiles={handleFile} accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" label="Drop an image here" hint="PNG, JPEG, or WebP" maxSizeMB={30} />
      ) : (
        <FileItem file={file} onRemove={() => { setFile(null); setResult(null); proc.reset(); }} />
      )}

      {file && proc.status === 'idle' && (
        <button onClick={handleStrip} className="btn-primary self-start">Strip Metadata</button>
      )}

      <ProcessingCard
        status={proc.status}
        progress={proc.progress}
        errorMessage={proc.error?.message}
        result={result}
        originalSize={file?.size}
        onCancel={proc.cancel}
        onReset={() => { proc.reset(); setFile(null); setResult(null); }}
      />
    </div>
  );
}
