import { useState, useRef, useEffect } from 'react';
import { PenTool, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProcessingCard } from '@/components/processing/ProcessingCard';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { signPdf } from '@/services/pdfProcessing';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { ProcessingResult } from '@/types';

export function SignPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sigMode, setSigMode] = useState<'draw' | 'type'>('draw');
  const [typedSig, setTypedSig] = useState('');
  const [hasDrawing, setHasDrawing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [placement, setPlacement] = useState({ pageIndex: 0, x: 50, y: 700, width: 200, height: 60 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawing(true);
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  const getSignatureDataUrl = (): string => {
    if (sigMode === 'draw') {
      return canvasRef.current?.toDataURL('image/png') ?? '';
    }
    // Render typed signature to canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, 400, 80);
    ctx.font = 'italic 36px Georgia, serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedSig, 10, 40);
    return canvas.toDataURL('image/png');
  };

  const handleSign = async () => {
    if (!file) return;
    if (sigMode === 'draw' && !hasDrawing) { toastError('Please draw a signature first.'); return; }
    if (sigMode === 'type' && !typedSig.trim()) { toastError('Please enter a typed signature.'); return; }

    const sigDataUrl = getSignatureDataUrl();
    const ac = proc.start();
    addRecentTool('pdf-sign');
    try {
      const res = await signPdf(file, sigDataUrl, placement, { onProgress: proc.setProgress, signal: ac.signal });
      setResult(res);
      proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'SIGN_FAILED', message: (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={PenTool} title="Sign PDF" description="Draw or type a signature and embed it into your PDF." badge={<span className="badge-green">Processed locally</span>} />

      <div className="card p-3 flex items-start gap-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          This inserts a visual signature image into the PDF. It is not a cryptographic digital signature and does not guarantee legal validity on its own.
        </p>
      </div>

      {!file ? (
        <DropZone onFiles={(f) => {
          const v = validateFile(f[0], { acceptedMimeTypes: ['application/pdf'] });
          if (!v.valid) { toastError(v.error); return; }
          setFile(f[0]); proc.reset(); setResult(null);
        }} accept=".pdf,application/pdf" label="Drop your PDF here" />
      ) : (
        <FileItem file={file} onRemove={() => { setFile(null); proc.reset(); setResult(null); }} />
      )}

      {file && (
        <div className="card p-4 flex flex-col gap-4">
          {/* Mode selector */}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="sigMode" value="draw" checked={sigMode === 'draw'} onChange={() => setSigMode('draw')} className="accent-brand-600" />
              <span className="text-sm">Draw</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="sigMode" value="type" checked={sigMode === 'type'} onChange={() => setSigMode('type')} className="accent-brand-600" />
              <span className="text-sm">Type</span>
            </label>
          </div>

          {sigMode === 'draw' ? (
            <div className="flex flex-col gap-2">
              <label className="label">Draw your signature</label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={120}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                  aria-label="Signature drawing area"
                />
                {!hasDrawing && (
                  <p className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
                    Sign here
                  </p>
                )}
              </div>
              <button onClick={clearCanvas} className="btn-ghost self-start text-xs">
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="typed-sig">Type your name</label>
              <input id="typed-sig" type="text" value={typedSig} onChange={(e) => setTypedSig(e.target.value)} className="input max-w-xs font-serif italic text-lg" placeholder="Your Name" />
              {typedSig && (
                <p className="text-2xl italic font-serif text-gray-800 dark:text-gray-200 mt-1">{typedSig}</p>
              )}
            </div>
          )}

          {/* Placement controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'pageIndex', label: 'Page (0-based)', min: 0, max: 100 },
              { key: 'x', label: 'X position (pt)', min: 0, max: 600 },
              { key: 'y', label: 'Y (from top, pt)', min: 0, max: 900 },
              { key: 'width', label: 'Width (pt)', min: 50, max: 400 },
            ].map(({ key, label, min, max }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="label text-xs">{label}</label>
                <input
                  type="number"
                  min={min} max={max}
                  value={(placement as Record<string, number>)[key]}
                  onChange={(e) => setPlacement((p) => ({ ...p, [key]: Number(e.target.value) }))}
                  className="input"
                />
              </div>
            ))}
          </div>

          <button onClick={handleSign} disabled={proc.status === 'processing'} className="btn-primary self-start">
            Embed Signature
          </button>
        </div>
      )}

      <ProcessingCard
        status={proc.status}
        progress={proc.progress}
        errorMessage={proc.error?.message}
        result={result}
        onCancel={proc.cancel}
        onReset={() => { proc.reset(); setFile(null); setResult(null); clearCanvas(); }}
      />
    </div>
  );
}
