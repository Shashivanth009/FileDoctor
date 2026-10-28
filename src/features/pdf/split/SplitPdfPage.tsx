import { useState } from 'react';
import { Scissors, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { loadPdfInfo, splitPdf, splitPdfIntoPages } from '@/services/pdfProcessing';
import { downloadBlob } from '@/utils/download';
import { createZip } from '@/utils/zip';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { ProcessingResult, PdfDocumentInfo } from '@/types';

export function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfDocumentInfo | null>(null);
  const [mode, setMode] = useState<'all-pages' | 'range'>('range');
  const [rangeInput, setRangeInput] = useState('');
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, { acceptedMimeTypes: ['application/pdf'], acceptedExtensions: ['pdf'] });
    if (!v.valid) { toastError(v.error); return; }
    setFile(f);
    setResults([]);
    proc.reset();
    try {
      const info = await loadPdfInfo(f);
      setPdfInfo(info);
      setRangeInput(`1-${info.pageCount}`);
    } catch { toastError('Could not read PDF metadata.'); }
  };

  const parseRanges = (input: string, max: number): number[][] | null => {
    const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
    const ranges: number[][] = [];
    for (const part of parts) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        if (!a || !b || a < 1 || b > max || a > b) return null;
        ranges.push([a, b]);
      } else {
        const n = Number(part);
        if (!n || n < 1 || n > max) return null;
        ranges.push([n, n]);
      }
    }
    return ranges.length > 0 ? ranges : null;
  };

  const handleSplit = async () => {
    if (!file || !pdfInfo) return;
    const ac = proc.start();
    addRecentTool('pdf-split');
    try {
      let res: ProcessingResult[];
      if (mode === 'all-pages') {
        res = await splitPdfIntoPages(file, { onProgress: proc.setProgress, signal: ac.signal });
      } else {
        const ranges = parseRanges(rangeInput, pdfInfo.pageCount);
        if (!ranges) { proc.setError({ code: 'INVALID_RANGE', message: 'Invalid page range. Use e.g. "1-3, 5, 7-9".' }); return; }
        res = await splitPdf(file, ranges, { onProgress: proc.setProgress, signal: ac.signal });
      }
      setResults(res);
      proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'SPLIT_FAILED', message: (err as Error).message });
    }
  };

  const downloadAll = async () => {
    if (results.length === 1) { downloadBlob(results[0].blob, results[0].fileName); return; }
    const zip = await createZip(results.map((r) => ({ fileName: r.fileName, data: r.blob })));
    downloadBlob(zip, `${file?.name ?? 'split'}_pages.zip`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Scissors} title="Split PDF" description="Extract pages or split a PDF into individual files." badge={<span className="badge-green">Processed locally</span>} />

      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf,application/pdf" label="Drop a PDF here" hint="Single PDF file" maxSizeMB={100} />
      ) : (
        <FileItem file={file} onRemove={() => { setFile(null); setPdfInfo(null); setResults([]); proc.reset(); }} />
      )}

      {pdfInfo && (
        <div className="card p-4 flex flex-col gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-800 dark:text-gray-200">{pdfInfo.pageCount}</strong> page{pdfInfo.pageCount !== 1 ? 's' : ''} detected
          </p>

          <div className="flex flex-col gap-2">
            <label className="label">Split mode</label>
            <div className="flex gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" value="range" checked={mode === 'range'} onChange={() => setMode('range')} className="accent-brand-600" />
                <span className="text-sm">Page ranges</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" value="all-pages" checked={mode === 'all-pages'} onChange={() => setMode('all-pages')} className="accent-brand-600" />
                <span className="text-sm">Split into individual pages</span>
              </label>
            </div>
          </div>

          {mode === 'range' && (
            <div className="flex flex-col gap-1">
              <label className="label" htmlFor="ranges">Page ranges (e.g. 1-3, 5, 7-9)</label>
              <input
                id="ranges"
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                className="input max-w-xs"
                placeholder="1-3, 5, 7-9"
              />
            </div>
          )}

          <button onClick={handleSplit} disabled={proc.status === 'processing'} className="btn-primary self-start">
            Split PDF
          </button>
        </div>
      )}

      {proc.status === 'processing' && (
        <ProgressBar progress={proc.progress > 0 ? proc.progress : -1} label="Splitting pages…" />
      )}

      {proc.status === 'error' && (
        <div className="card p-4 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{proc.error?.message}</p>
          <button onClick={proc.reset} className="btn-secondary text-xs mt-2">Try again</button>
        </div>
      )}

      {proc.status === 'done' && results.length > 0 && (
        <div className="card p-4 flex flex-col gap-3 border-emerald-200 dark:border-emerald-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {results.length} file{results.length !== 1 ? 's' : ''} ready
          </p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{r.fileName}</span>
                <button onClick={() => downloadBlob(r.blob, r.fileName)} className="btn-ghost text-xs shrink-0">
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={downloadAll} className="btn-primary self-start">
            <Download className="w-4 h-4" />
            {results.length === 1 ? 'Download' : `Download all (ZIP)`}
          </button>
        </div>
      )}
    </div>
  );
}
