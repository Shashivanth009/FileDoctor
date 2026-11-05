import React, { useState } from 'react';
import { Music, ArrowRightLeft } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Select, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { convertAudio } from '@/services/audioService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const AudioConverterPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await convertAudio(file);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'audio-convert',
          toolName: 'Audio Converter',
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
          title: 'Audio converted successfully',
          description: `Decoded and exported as ${res.outputFilename}`,
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
        icon={<Music className="w-6 h-6" />}
        name="Audio Converter"
        description="Decode, transcode, and normalize audio files (MP3, WAV, OGG, M4A) via the browser Web Audio API."
        category="Audio & Video"
        categoryRoute="/audio-video"
        categoryColor="#9B8AFF"
        formats={['.mp3', '.wav', '.ogg', '.m4a']}
        privacyLevel="local"
      />

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="audio/*"
            onFiles={(files) => setFile(files[0] || null)}
            label="Drop audio file to convert"
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

          <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-3">
            <span className="text-xs font-semibold text-main-white">Audio Player Preview</span>
            <audio controls src={URL.createObjectURL(file)} className="w-full" />
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<ArrowRightLeft className="w-4 h-4" />}
            onClick={handleConvert}
          >
            Transcode to Lossless WAV
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

