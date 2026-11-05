import React, { useState } from 'react';
import { Minimize2, Check, Sparkles } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Slider, Select, Input, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { compressImage } from '@/services/imageService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const ImageCompressorPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'preset' | 'percentage' | 'target-size' | 'custom'>('preset');
  const [preset, setPreset] = useState<'light' | 'balanced' | 'strong' | 'maximum'>('balanced');
  const [reductionPercentage, setReductionPercentage] = useState<number>(40);
  const [targetSizeKB, setTargetSizeKB] = useState<number>(200);
  const [customQuality, setCustomQuality] = useState<number>(75);
  const [outputFormat, setOutputFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<(ProcessingResult & { targetAchieved?: boolean }) | null>(null);
  const { toast } = useToast();

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResult(null);
      const kb = Math.round(files[0].size / 1024);
      setTargetSizeKB(Math.max(50, Math.round(kb * 0.5)));
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await compressImage(file, {
        mode,
        preset,
        reductionPercentage,
        targetSizeKB,
        quality: customQuality / 100,
        format: outputFormat,
      });
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'image-compress',
          toolName: 'Image Compressor',
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
          title: 'Image compressed successfully',
          description: `Saved ${formatFileSize(file.size - (res.outputSize || 0))}`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Compression failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Minimize2 className="w-6 h-6" />}
        name="Image Compressor"
        description="Shrink PNG, JPEG, and WebP images using precision canvas quantization and modern format re-encoding."
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
            label="Drop image to compress"
            description="Supports PNG, JPG, JPEG, and WebP photos"
          />
        </Card>
      ) : (
        <div className="space-y-6">
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

            {/* Mode selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'preset', label: 'Presets' },
                { id: 'percentage', label: 'Percentage' },
                { id: 'target-size', label: 'Target KB' },
                { id: 'custom', label: 'Quality Slider' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    mode === m.id
                      ? 'bg-arctic-mint text-ink-navy border-arctic-mint'
                      : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Presets */}
            {mode === 'preset' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'light', label: 'Light', desc: '85% quality, imperceptible difference' },
                  { id: 'balanced', label: 'Balanced (Recommended)', desc: '75% quality, 30-50% size reduction' },
                  { id: 'strong', label: 'Strong', desc: '60% quality, 60-75% size reduction' },
                  { id: 'maximum', label: 'Maximum', desc: '45% quality, ultra small file size' },
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPreset(p.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      preset === p.id
                        ? 'bg-arctic-mint/15 border-arctic-mint text-main-white'
                        : 'bg-elevated-navy border-border-color text-muted-white hover:border-muted-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{p.label}</span>
                      {preset === p.id && <Check className="w-4 h-4 text-arctic-mint" />}
                    </div>
                    <p className="text-xs text-muted-white">{p.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Percentage */}
            {mode === 'percentage' && (
              <Slider
                label="Target Reduction Percentage"
                value={reductionPercentage}
                min={10}
                max={90}
                unit="%"
                onChange={setReductionPercentage}
              />
            )}

            {/* Target Size */}
            {mode === 'target-size' && (
              <Input
                label="Target File Size (KB)"
                type="number"
                min={10}
                value={targetSizeKB}
                onChange={(e) => setTargetSizeKB(Number(e.target.value))}
              />
            )}

            {/* Custom quality */}
            {mode === 'custom' && (
              <Slider
                label="Image Quality"
                value={customQuality}
                min={10}
                max={100}
                unit="%"
                onChange={setCustomQuality}
              />
            )}

            {/* Output format */}
            <Select
              label="Output Format"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              options={[
                { value: 'image/webp', label: 'WebP (Recommended - Smallest file size)' },
                { value: 'image/jpeg', label: 'JPEG (Universal compatibility)' },
                { value: 'image/png', label: 'PNG (Lossless transparency)' },
              ]}
            />

            <Button
              size="lg"
              fullWidth
              loading={isProcessing}
              icon={<Minimize2 className="w-4 h-4" />}
              onClick={handleCompress}
            >
              Compress Image Now
            </Button>
          </Card>

          {isProcessing && <ProgressBar value={50} indeterminate />}

          {result && result.success && result.outputBlob && result.outputFilename && (
            <ResultPanel
              originalSize={result.originalSize}
              outputSize={result.outputSize || 0}
              outputFilename={result.outputFilename}
              processingTime={result.processingTime}
              targetSize={mode === 'target-size' ? targetSizeKB * 1024 : undefined}
              onDownload={() => downloadBlob(result.outputBlob!, result.outputFilename!)}
              onProcessAnother={() => {
                setFile(null);
                setResult(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

