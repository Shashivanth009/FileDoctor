import React, { useState } from 'react';
import { Scissors, Play } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Slider, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { trimAudio } from '@/services/audioService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const AudioTrimmerPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(30);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setResult(null);

      // Detect duration using temporary audio element
      const audio = new Audio();
      audio.src = URL.createObjectURL(f);
      audio.onloadedmetadata = () => {
        const d = Math.round(audio.duration) || 30;
        setDuration(d);
        setStartTime(0);
        setEndTime(Math.min(d, 15));
      };
    }
  };

  const handleTrim = async () => {
    if (!file) return;
    if (endTime <= startTime) {
      toast({ type: 'warning', title: 'Invalid time bounds', description: 'End time must be greater than start time.' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await trimAudio(file, startTime, endTime);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'audio-trim',
          toolName: 'Audio Trimmer',
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
          title: 'Audio trimmed successfully',
          description: `Extracted ${startTime}s to ${endTime}s`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Trim failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Scissors className="w-6 h-6" />}
        name="Audio Trimmer"
        description="Cut clips, ringtones, and soundbites from audio files with sample-accurate offline rendering."
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
            onFiles={handleFile}
            label="Drop audio to trim"
          />
        </Card>
      ) : (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-color">
            <div>
              <p className="text-sm font-semibold text-main-white">{file.name}</p>
              <p className="text-xs text-muted-white">{formatFileSize(file.size)} · Duration: ~{duration}s</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }}>
              Change file
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-3">
            <span className="text-xs font-semibold text-main-white">Full Audio Player</span>
            <audio controls src={URL.createObjectURL(file)} className="w-full" />
          </div>

          <div className="space-y-4">
            <Slider
              label={`Start Time (${startTime}s)`}
              value={startTime}
              min={0}
              max={Math.max(1, duration - 1)}
              unit="s"
              onChange={setStartTime}
            />
            <Slider
              label={`End Time (${endTime}s)`}
              value={endTime}
              min={startTime + 1}
              max={duration}
              unit="s"
              onChange={setEndTime}
            />

            <div className="p-3 rounded-lg bg-surface-navy border border-border-color text-xs text-muted-white text-center">
              Selected segment: <strong className="text-purple-400 font-mono">{endTime - startTime} seconds</strong> (from {startTime}s to {endTime}s)
            </div>
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<Scissors className="w-4 h-4" />}
            onClick={handleTrim}
          >
            Trim and Export Clip
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

