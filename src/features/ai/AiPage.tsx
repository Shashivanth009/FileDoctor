import { useState } from 'react';
import { FileText, ScanText, AlertCircle, Copy } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';

// ─── Document Summarizer ─────────────────────────────────────────────────────

export function SummarizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const proc = useProcessing();
  const { error: toastError, success } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, { acceptedMimeTypes: ['application/pdf','text/plain'], acceptedExtensions: ['pdf','txt'], maxSizeBytes: 20*1024*1024 });
    if (!v.valid) { toastError(v.error); return; }
    setFile(f); setExtractedText(''); setSummary(''); proc.reset();

    proc.start();
    try {
      let text = '';
      if (f.type === 'text/plain') {
        text = await f.text();
      } else {
        // Extract text from PDF using pdfjs-dist
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
        GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
        const ab = await f.arrayBuffer();
        const pdf = await getDocument({ data: ab }).promise;
        const parts: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          parts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
          proc.setProgress(Math.round((i / pdf.numPages) * 80));
        }
        await pdf.destroy();
        text = parts.join('\n');
      }

      setExtractedText(text);
      proc.setProgress(90);

      // Local extractive summary: take first 5 sentences
      const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
      const local = sentences.slice(0, 5).join(' ').trim();
      setSummary(local || text.slice(0, 500));
      proc.setDone();
      addRecentTool('ai-summarize');
    } catch (err) {
      proc.setError({ code: 'EXTRACT_FAILED', message: (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={FileText} title="Document Summarizer" description="Extract text from PDFs and generate a local extractive summary." badge={<span className="badge-yellow">Local only</span>} />

      <div className="card p-3 flex items-start gap-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          This tool extracts text locally and produces a basic extractive summary (first sentences). No AI model is invoked. No content is sent to any server. For generative AI summaries, configure an AI provider in Settings.
        </p>
      </div>

      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf,.txt,application/pdf,text/plain" label="Drop a PDF or text file" hint="PDF or TXT" maxSizeMB={20} />
      ) : (
        <FileItem file={file} onRemove={() => { setFile(null); setExtractedText(''); setSummary(''); proc.reset(); }} />
      )}

      {proc.status === 'processing' && <ProgressBar progress={proc.progress > 0 ? proc.progress : -1} label="Extracting text…" />}

      {proc.status === 'error' && (
        <div className="card p-4 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{proc.error?.message}</p>
        </div>
      )}

      {summary && (
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="label">Extractive Summary (local)</p>
            <button onClick={() => { navigator.clipboard.writeText(summary); success('Copied!'); }} className="btn-ghost text-xs p-1.5"><Copy className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {extractedText && (
        <details className="card p-4">
          <summary className="label cursor-pointer">Full extracted text ({extractedText.length.toLocaleString()} chars)</summary>
          <textarea readOnly value={extractedText} className="input mt-3 h-48 resize-none text-xs font-mono" aria-label="Extracted text" />
        </details>
      )}
    </div>
  );
}

// ─── OCR ─────────────────────────────────────────────────────────────────────

export function OcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [lang, setLang] = useState('eng');
  const proc = useProcessing();
  const { error: toastError, success } = useToast();

  const handleFile = (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, { acceptedMimeTypes: ['image/png','image/jpeg','image/webp','image/bmp'], maxSizeBytes: 20*1024*1024 });
    if (!v.valid) { toastError(v.error); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f); setPreview(URL.createObjectURL(f)); setOcrText(''); proc.reset();
  };

  const handleOcr = async () => {
    if (!file) return;
    proc.start();
    addRecentTool('ai-ocr');
    try {
      // Dynamically load Tesseract.js on demand
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(lang, 1, {
        logger: (m: { progress: number }) => { if (typeof m.progress === 'number') proc.setProgress(Math.round(m.progress * 100)); },
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      setOcrText(text);
      proc.setDone();
    } catch (err) {
      proc.setError({ code: 'OCR_FAILED', message: `OCR failed: ${(err as Error).message}. Tesseract.js requires a network connection to download language data on first use.` });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={ScanText} title="OCR Extractor" description="Extract text from images using Tesseract.js (loaded on demand)." badge={<span className="badge-yellow">Requires download</span>} />

      <div className="card p-3 flex items-start gap-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          OCR uses Tesseract.js which runs entirely in your browser. On first use, language model data (~10 MB per language) is downloaded from Tesseract's CDN. No image content is sent to any server.
        </p>
      </div>

      {!file ? (
        <DropZone onFiles={handleFile} accept="image/png,image/jpeg,image/webp,image/bmp,.png,.jpg,.jpeg,.webp,.bmp" label="Drop an image to extract text" hint="PNG, JPEG, WebP, BMP" maxSizeMB={20} />
      ) : (
        <FileItem file={file} onRemove={() => { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); setOcrText(''); proc.reset(); }} />
      )}

      {preview && <img src={preview} alt="OCR input preview" className="rounded-lg max-h-48 object-contain bg-gray-100 dark:bg-gray-800 w-full" />}

      {file && (
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="label" htmlFor="ocr-lang">Language</label>
            <select id="ocr-lang" value={lang} onChange={(e) => setLang(e.target.value)} className="input w-40">
              <option value="eng">English</option>
              <option value="fra">French</option>
              <option value="deu">German</option>
              <option value="spa">Spanish</option>
              <option value="por">Portuguese</option>
              <option value="ita">Italian</option>
              <option value="chi_sim">Chinese (Simplified)</option>
              <option value="jpn">Japanese</option>
              <option value="ara">Arabic</option>
            </select>
          </div>
          <button onClick={handleOcr} disabled={proc.status === 'processing'} className="btn-primary mb-0.5">
            Extract Text
          </button>
        </div>
      )}

      {proc.status === 'processing' && <ProgressBar progress={proc.progress > 0 ? proc.progress : -1} label="Running OCR (may take a moment on first use)…" />}

      {proc.status === 'error' && (
        <div className="card p-4 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{proc.error?.message}</p>
        </div>
      )}

      {ocrText && (
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="label">Extracted Text</p>
            <button onClick={() => { navigator.clipboard.writeText(ocrText); success('Copied!'); }} className="btn-ghost text-xs p-1.5"><Copy className="w-3.5 h-3.5" /></button>
          </div>
          <textarea value={ocrText} onChange={(e) => setOcrText(e.target.value)} className="input h-56 resize-none text-sm" aria-label="Extracted text (editable)" spellCheck={false} />
        </div>
      )}
    </div>
  );
}
