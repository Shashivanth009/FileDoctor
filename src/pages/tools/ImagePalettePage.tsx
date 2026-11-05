import React, { useState } from 'react';
import { Palette, Copy, Check } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, ProgressBar, useToast } from '@/components/ui';
import { extractColorPalette, ExtractedColor } from '@/services/imageService';
import { formatFileSize } from '@/services/fileService';

export const ImagePalettePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setIsProcessing(true);
    try {
      const extracted = await extractColorPalette(f, 8);
      setColors(extracted);
      toast({ type: 'success', title: 'Color palette extracted', description: `Found ${extracted.length} dominant colors` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Extraction failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    toast({ type: 'success', title: `Copied ${label}`, description: text });
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const exportCss = () => {
    const css = `:root {\n` + colors.map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.percentage}% */`).join('\n') + `\n}`;
    copyToClipboard(css, 'CSS Variables');
  };

  const exportJson = () => {
    const json = JSON.stringify(colors, null, 2);
    copyToClipboard(json, 'JSON Palette');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Palette className="w-6 h-6" />}
        name="Color Palette Extractor"
        description="Extract dominant color schemes, HEX, RGB, and HSL values from graphics and photos."
        category="Image Studio"
        categoryRoute="/image"
        categoryColor="#48DCC7"
        formats={['.png', '.jpg', '.jpeg', '.webp']}
        privacyLevel="local"
      />

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="image/*"
            onFiles={handleFile}
            label="Drop image to extract color palette"
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card padding="md" className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-main-white">{file.name}</p>
              <p className="text-xs text-muted-white">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setColors([]); }}>
              Change file
            </Button>
          </Card>

          {isProcessing && <ProgressBar value={50} indeterminate />}

          {colors.length > 0 && (
            <Card padding="lg" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-main-white font-heading">
                  Dominant Swatches ({colors.length})
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={exportCss}>
                    Copy CSS Variables
                  </Button>
                  <Button size="sm" variant="secondary" onClick={exportJson}>
                    Copy JSON
                  </Button>
                </div>
              </div>

              {/* Connected palette strip */}
              <div className="h-16 rounded-xl overflow-hidden flex shadow-lg">
                {colors.map((c, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: c.hex, width: `${c.percentage}%` }}
                    className="h-full relative group cursor-pointer transition-transform hover:scale-105"
                    title={`${c.hex} (${c.percentage}%)`}
                    onClick={() => copyToClipboard(c.hex, c.hex)}
                  />
                ))}
              </div>

              {/* Detailed color cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {colors.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => copyToClipboard(c.hex, c.hex)}
                    className="p-3 rounded-xl bg-elevated-navy border border-border-color space-y-2 cursor-pointer hover:border-arctic-mint/40 transition-colors group"
                  >
                    <div className="h-16 rounded-lg w-full shadow-inner" style={{ backgroundColor: c.hex }} />
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-main-white">{c.hex}</span>
                      <button className="text-muted-white group-hover:text-arctic-mint p-1">
                        {copiedHex === c.hex ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="text-[10px] text-muted-white font-mono space-y-0.5">
                      <p>RGB: {c.rgb.r}, {c.rgb.g}, {c.rgb.b}</p>
                      <p>HSL: {c.hsl.h}°, {c.hsl.s}%, {c.hsl.l}%</p>
                      <p className="text-arctic-mint">{c.percentage}% coverage</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

