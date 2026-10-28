import { useState } from 'react';
import { Palette, Copy, Check } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { extractImagePalette } from '@/services/imageProcessing';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { ColorSwatch } from '@/utils/colors';

export function PalettePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [count, setCount] = useState(8);
  const [copied, setCopied] = useState<string | null>(null);
  const proc = useProcessing();
  const { error: toastError, success } = useToast();

  const handleFile = (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, { acceptedMimeTypes: ['image/png','image/jpeg','image/webp','image/gif','image/bmp'], maxSizeBytes: 30*1024*1024 });
    if (!v.valid) { toastError(v.error); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f); setPreview(URL.createObjectURL(f)); setSwatches([]); proc.reset();
  };

  const handleExtract = async () => {
    if (!file) return;
    proc.start();
    addRecentTool('image-palette');
    try {
      const colors = await extractImagePalette(file, count);
      setSwatches(colors);
      proc.setDone();
    } catch (err) {
      proc.setError({ code: 'PALETTE_FAILED', message: (err as Error).message });
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text); success('Copied!');
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const copyAsCss = () => {
    const css = swatches.map((s, i) => `  --color-${i + 1}: ${s.hex};`).join('\n');
    copy(`:root {\n${css}\n}`);
  };

  const copyAsJson = () => {
    copy(JSON.stringify(swatches.map((s) => ({ hex: s.hex, rgb: s.rgb, percentage: s.percentage })), null, 2));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Palette} title="Color Palette" description="Extract dominant colors from any image using pixel analysis." badge={<span className="badge-green">Processed locally</span>} />

      {!file ? (
        <DropZone onFiles={handleFile} accept="image/*" label="Drop an image here" hint="Any raster image format" maxSizeMB={30} />
      ) : (
        <FileItem file={file} onRemove={() => { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); setSwatches([]); proc.reset(); }} />
      )}

      {file && (
        <div className="card p-4 flex flex-col gap-4">
          {preview && <img src={preview} alt="Preview" className="rounded-lg max-h-40 object-contain bg-gray-100 dark:bg-gray-800 w-full" />}
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="label">Number of colors</label>
              <input type="number" min={2} max={16} value={count} onChange={(e) => setCount(Number(e.target.value))} className="input w-24" />
            </div>
            <button onClick={handleExtract} disabled={proc.status === 'processing'} className="btn-primary mb-0.5">
              Extract Colors
            </button>
          </div>
        </div>
      )}

      {proc.status === 'processing' && <ProgressBar progress={-1} label="Analyzing pixels…" />}

      {swatches.length > 0 && (
        <div className="card p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {swatches.map((swatch) => (
              <div key={swatch.hex} className="flex flex-col gap-1.5">
                <div
                  className="h-16 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: swatch.hex }}
                  onClick={() => copy(swatch.hex)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && copy(swatch.hex)}
                  aria-label={`Copy color ${swatch.hex}`}
                  title="Click to copy hex"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono font-medium text-gray-800 dark:text-gray-200">{swatch.hex.toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{swatch.percentage}%</p>
                  </div>
                  <button onClick={() => copy(swatch.hex)} className="p-1 text-gray-400 hover:text-brand-500 transition-colors" aria-label="Copy hex">
                    {copied === swatch.hex ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={copyAsCss} className="btn-secondary text-xs">Copy CSS variables</button>
            <button onClick={copyAsJson} className="btn-secondary text-xs">Copy JSON</button>
          </div>
        </div>
      )}
    </div>
  );
}
