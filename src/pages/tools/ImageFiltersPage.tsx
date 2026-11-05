import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Slider, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { applyImageFilters } from '@/services/imageService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const ImageFiltersPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);
  const [invert, setInvert] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await applyImageFilters(file, {
        grayscale,
        brightness,
        contrast,
        blur,
        sepia,
        invert,
      });
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'image-filters',
          toolName: 'Image Filters',
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
          title: 'Filters applied successfully',
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Filter failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<SlidersHorizontal className="w-6 h-6" />}
        name="Image Filters"
        description="Apply artistic adjustments: grayscale, brightness, contrast, blur, and sepia in real-time."
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
            onFiles={(files) => setFile(files[0] || null)}
            label="Drop image to apply filters"
          />
        </Card>
      ) : (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-color">
            <div>
              <p className="text-sm font-semibold text-main-white">{file.name}</p>
              <p className="text-xs text-muted-white">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }}>
              Change file
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Slider label="Grayscale" value={grayscale} min={0} max={100} unit="%" onChange={setGrayscale} />
            <Slider label="Brightness" value={brightness} min={-50} max={50} unit="%" onChange={setBrightness} />
            <Slider label="Contrast" value={contrast} min={-50} max={50} unit="%" onChange={setContrast} />
            <Slider label="Sepia" value={sepia} min={0} max={100} unit="%" onChange={setSepia} />
            <Slider label="Blur Radius" value={blur} min={0} max={15} unit=" px" onChange={setBlur} />

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-main-white">
                <input
                  type="checkbox"
                  checked={invert}
                  onChange={(e) => setInvert(e.target.checked)}
                  className="rounded text-arctic-mint focus:ring-0"
                />
                <span>Invert Colors (Negative)</span>
              </label>
            </div>
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={handleApply}
          >
            Apply Filters & Render
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

