import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Select, Slider, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { convertImage } from '@/services/imageService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const ImageConverterPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp'>('image/webp');
  const [quality, setQuality] = useState<number>(92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await convertImage(file, targetFormat, quality / 100);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'image-convert',
          toolName: 'Image Converter',
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
          title: 'Image converted successfully',
          description: `Created ${res.outputFilename}`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Conversion failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<ArrowRightLeft className="w-6 h-6" />}
        name="Image Converter"
        description="Convert photos and graphics between PNG, JPEG, WebP, and BMP with genuine browser-side pixel re-encoding."
        category="Image Studio"
        categoryRoute="/image"
        categoryColor="#48DCC7"
        formats={['.png', '.jpg', '.jpeg', '.webp', '.bmp']}
        privacyLevel="local"
      />

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="image/*"
            onFiles={(files) => setFile(files[0] || null)}
            label="Drop image to convert"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Target Output Format"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as any)}
              options={[
                { value: 'image/webp', label: 'WebP (Smallest file size)' },
                { value: 'image/jpeg', label: 'JPEG (Universal compatibility)' },
                { value: 'image/png', label: 'PNG (Lossless transparency)' },
                { value: 'image/bmp', label: 'BMP (Bitmap uncompressed)' },
              ]}
            />
            {targetFormat !== 'image/png' && targetFormat !== 'image/bmp' && (
              <Slider
                label="Encoding Quality"
                value={quality}
                min={30}
                max={100}
                unit="%"
                onChange={setQuality}
              />
            )}
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<ArrowRightLeft className="w-4 h-4" />}
            onClick={handleConvert}
          >
            Convert Image
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

