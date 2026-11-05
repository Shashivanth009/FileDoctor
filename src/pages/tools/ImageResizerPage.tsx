import React, { useState, useEffect } from 'react';
import { Maximize2, Lock, Unlock } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Input, Slider, Select, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { resizeImage, loadImage } from '@/services/imageService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const ImageResizerPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  const [mode, setMode] = useState<'dimensions' | 'percentage'>('dimensions');
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [percentage, setPercentage] = useState<number>(50);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleFile = async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setResult(null);
      try {
        const img = await loadImage(f);
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      } catch (e) {}
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockRatio && naturalWidth > 0) {
      setHeight(Math.round((naturalHeight * val) / naturalWidth));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockRatio && naturalHeight > 0) {
      setWidth(Math.round((naturalWidth * val) / naturalHeight));
    }
  };

  const handleResize = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await resizeImage(file, {
        mode,
        width,
        height,
        percentage,
        maintainAspectRatio: lockRatio,
      });
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'image-resize',
          toolName: 'Image Resizer',
          inputFilename: file.name,
          originalSize: file.size,
          outputFilename: res.outputFilename,
          outputSize: res.outputSize,
          timestamp: Date.now(),
          status: 'success',
          hasRetainedOutput: true,
        });
        await saveOutput(id, res.outputBlob, res.outputFilename);

        toast({
          type: 'success',
          title: 'Image resized successfully',
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Resize failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Maximize2 className="w-6 h-6" />}
        name="Image Resizer"
        description="Scale dimensions by exact pixels or percentage while maintaining crisp aspect ratio."
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
            label="Drop image to resize"
          />
        </Card>
      ) : (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-color">
            <div>
              <p className="text-sm font-semibold text-main-white">{file.name}</p>
              <p className="text-xs text-muted-white">
                Original Dimensions: <span className="font-mono text-main-white">{naturalWidth} × {naturalHeight} px</span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }}>
              Change file
            </Button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('dimensions')}
              className={`py-2 px-4 rounded-xl border text-xs font-semibold cursor-pointer ${
                mode === 'dimensions'
                  ? 'bg-arctic-mint text-ink-navy border-arctic-mint'
                  : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white'
              }`}
            >
              Exact Dimensions (px)
            </button>
            <button
              type="button"
              onClick={() => setMode('percentage')}
              className={`py-2 px-4 rounded-xl border text-xs font-semibold cursor-pointer ${
                mode === 'percentage'
                  ? 'bg-arctic-mint text-ink-navy border-arctic-mint'
                  : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white'
              }`}
            >
              Percentage Scale
            </button>
          </div>

          {mode === 'dimensions' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    label="Width (px)"
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLockRatio(!lockRatio)}
                  className={`mt-5 p-2 rounded-lg border transition-colors ${
                    lockRatio ? 'bg-arctic-mint/15 text-arctic-mint border-arctic-mint' : 'bg-elevated-navy text-muted-white border-border-color'
                  }`}
                  title={lockRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                >
                  {lockRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <div className="flex-1">
                  <Input
                    label="Height (px)"
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Quick dimension presets */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-muted-white py-1">Presets:</span>
                {[
                  { label: '1920 × 1080 (FHD)', w: 1920, h: 1080 },
                  { label: '1280 × 720 (HD)', w: 1280, h: 720 },
                  { label: '1080 × 1080 (Square)', w: 1080, h: 1080 },
                  { label: '800 × 600', w: 800, h: 600 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setWidth(item.w);
                      setHeight(item.h);
                      setLockRatio(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-elevated-navy border border-border-color text-muted-white hover:text-main-white cursor-pointer font-mono"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Slider
              label="Scale Percentage"
              value={percentage}
              min={10}
              max={200}
              unit="%"
              onChange={setPercentage}
            />
          )}

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<Maximize2 className="w-4 h-4" />}
            onClick={handleResize}
          >
            Resize Image
          </Button>
        </Card>
      )}

      {isProcessing && <ProgressBar value={50} indeterminate />}

      {result && result.success && result.outputBlob && result.outputFilename && (
        <ResultPanel
          originalSize={result.originalSize}
          outputSize={result.outputSize || 0}
          outputFilename={result.outputFilename}
          processingTime={result.processingTime}
          onDownload={() => downloadBlob(result.outputBlob!, result.outputFilename!)}
          onProcessAnother={() => {
            setFile(null);
            setResult(null);
          }}
        />
      )}
    </div>
  );
};

