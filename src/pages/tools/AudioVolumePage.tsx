import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Slider, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { adjustAudioVolume } from '@/services/audioService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const AudioVolumePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(150); // %
  const [normalize, setNormalize] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleAdjust = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await adjustAudioVolume(file, {
        volumeMultiplier: volumeMultiplier / 100,
        normalize,
      });
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'audio-volume',
          toolName: 'Volume Adjuster',
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
          title: 'Audio adjusted successfully',
          description: normalize ? 'Peak normalization applied' : `Boosted by ${volumeMultiplier}%`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Adjustment failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Volume2 className="w-6 h-6" />}
        name="Volume Adjuster & Normalizer"
        description="Boost quiet audio tracks or apply broadcast peak normalization without distortion."
        category="Audio & Video"
        categoryRoute="/audio-video"
        categoryColor="#9B8AFF"
        formats={['.mp3', '.wav', '.ogg']}
        privacyLevel="local"
      />

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="audio/*"
            onFiles={(files) => setFile(files[0] || null)}
            label="Drop audio to boost or normalize"
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

          <div className="space-y-4">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-elevated-navy border border-border-color cursor-pointer">
              <input
                type="checkbox"
                checked={normalize}
                onChange={(e) => setNormalize(e.target.checked)}
                className="rounded text-purple-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-main-white block">Auto Peak Normalization (Recommended)</span>
                <span className="text-[11px] text-muted-white">Analyzes entire waveform to bring loudest peak to 0 dBFS safely.</span>
              </div>
            </label>

            {!normalize && (
              <Slider
                label="Manual Gain Multiplier"
                value={volumeMultiplier}
                min={25}
                max={300}
                unit="%"
                onChange={setVolumeMultiplier}
              />
            )}

            <Button
              size="lg"
              fullWidth
              loading={isProcessing}
              icon={<Volume2 className="w-4 h-4" />}
              onClick={handleAdjust}
            >
              Adjust Audio & Export
            </Button>
          </div>
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

