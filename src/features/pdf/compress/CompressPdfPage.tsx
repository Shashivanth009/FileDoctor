import { useState } from 'react';
import { Minimize2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProcessingCard } from '@/components/processing/ProcessingCard';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { compressPdf } from '@/services/pdfProcessing';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { ProcessingResult } from '@/types';

export function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const handleFile = (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, { acceptedMimeTypes: ['application/pdf'], acceptedExtensions: ['pdf'] });
    if (!v.valid) { toastError(v.error); return; }
    setFile(f);
    setResult(null);
    proc.reset();
  };

  const handleCompress = async () => {
    if (!file) return;
    const ac = proc.start();
    addRecentTool('pdf-compress');
    try {
      const res = await compressPdf(file, { onProgress: proc.setProgress, signal: ac.signal });
      setResult(res);
      proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'COMPRESS_FAILED', message: (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Minimize2}
        title="Compress PDF"
        description="Rebuild the PDF structure to reduce file size."
        badge={<span className="badge-yellow">Partial</span>}
      />

      {/* Honest explanation */}
      <div className="card p-4 flex items-start gap-3 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">What this tool does</p>
          <p className="mt-1 text-amber-700 dark:text-amber-400">
            This tool rebuilds the PDF using pdf-lib with object streams enabled, which reduces structural overhead. Compression is most noticeable on PDFs with redundant structure. PDFs containing large embedded images or binary assets may not shrink significantly without rasterization, which is not currently available.
          </p>
          <p className="mt-1 text-amber-700 dark:text-amber-400">
            The actual output size is shown after processing — no estimated savings are displayed beforehand.
          </p>
        </div>
      </div>

      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf,application/pdf" label="Drop a PDF here" hint="Single PDF" maxSizeMB={100} />
      ) : (
        <FileItem file={file} onRemove={() => { setFile(null); setResult(null); proc.reset(); }} />
      )}

      {file && proc.status === 'idle' && (
        <button onClick={handleCompress} className="btn-primary self-start">
          Compress PDF
        </button>
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
