import { useState, useCallback } from 'react';
import { FilePlus2, ArrowUp, ArrowDown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProcessingCard } from '@/components/processing/ProcessingCard';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { mergePdfs } from '@/services/pdfProcessing';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { ProcessingResult } from '@/types';

export function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const addFiles = useCallback((newFiles: File[]) => {
    const valid: File[] = [];
    for (const f of newFiles) {
      const v = validateFile(f, { acceptedMimeTypes: ['application/pdf'], acceptedExtensions: ['pdf'] });
      if (!v.valid) { toastError(v.error); continue; }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid]);
    setResult(null);
    proc.reset();
  }, [proc, toastError]);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveFile = (idx: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) { toastError('Select at least 2 PDF files.'); return; }
    const ac = proc.start();
    addRecentTool('pdf-merge');
    try {
      const res = await mergePdfs(files, { onProgress: proc.setProgress, signal: ac.signal });
      setResult(res);
      proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'MERGE_FAILED', message: (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={FilePlus2}
        title="Merge PDF"
        description="Combine multiple PDF files into a single document in your chosen order."
        badge={<span className="badge-green">Processed locally</span>}
      />

      <DropZone
        onFiles={addFiles}
        accept=".pdf,application/pdf"
        multiple
        label="Drop PDF files here"
        hint="Accepted: PDF files"
        maxSizeMB={100}
      />

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="label">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
          {files.map((file, idx) => (
            <FileItem
              key={`${file.name}-${idx}`}
              file={file}
              onRemove={() => removeFile(idx)}
              draggable={false}
              extra={
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveFile(idx, -1)}
                    disabled={idx === 0}
                    className="btn-ghost p-1 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveFile(idx, 1)}
                    disabled={idx === files.length - 1}
                    className="btn-ghost p-1 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                </div>
              }
            />
          ))}

          <button
            onClick={handleMerge}
            disabled={files.length < 2 || proc.status === 'processing'}
            className="btn-primary self-start mt-2"
          >
            Merge {files.length} PDFs
          </button>
        </div>
      )}

      <ProcessingCard
        status={proc.status}
        progress={proc.progress}
        errorMessage={proc.error?.message}
        result={result}
        originalSize={files.reduce((s, f) => s + f.size, 0)}
        onCancel={proc.cancel}
        onReset={() => { proc.reset(); setFiles([]); setResult(null); }}
      />
    </div>
  );
}
