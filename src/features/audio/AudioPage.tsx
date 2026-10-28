import { useState, useRef } from 'react';
import { Music, Scissors, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProcessingCard } from '@/components/processing/ProcessingCard';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { getAudioInfo, trimAudio } from '@/services/audioProcessing';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import { formatDuration, formatBytes } from '@/utils/format';
import type { ProcessingResult, AudioInfo } from '@/types';

export function AudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [gain, setGain] = useState(1.0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const v = validateFile(f, {
      acceptedMimeTypes: ['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/flac','audio/x-flac','audio/aac'],
      acceptedExtensions: ['mp3','wav','ogg','m4a','flac','aac'],
      maxSizeBytes: 100*1024*1024,
    });
    if (!v.valid) { toastError(v.error); return; }
    setFile(f); setResult(null); proc.reset();
    try {
      const info = await getAudioInfo(f);
      setAudioInfo(info);
      setStartTime(0);
      setEndTime(Math.round(info.duration));
    } catch { toastError('Could not decode audio. The format may not be supported by your browser.'); }
  };

  const handleProcess = async () => {
    if (!file || !audioInfo) return;
    if (startTime >= endTime) { toastError('Start time must be before end time.'); return; }
    const ac = proc.start();
    addRecentTool('audio-trim');
    try {
      const res = await trimAudio(file, startTime, endTime, gain, { onProgress: proc.setProgress, signal: ac.signal });
      setResult(res); proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'AUDIO_FAILED', message: (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Scissors} title="Trim & Volume" description="Trim audio clips and adjust volume. Exports as WAV using Web Audio API." badge={<span className="badge-yellow">Partial — WAV export only</span>} />

      <div className="card p-3 flex items-start gap-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Audio processing uses the browser's Web Audio API. Export is WAV (PCM) only — MP3/M4A encoding requires external WASM codecs not currently loaded. Playback support depends on your browser and OS codecs.
        </p>
      </div>

      {!file ? (
        <DropZone onFiles={handleFile} accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" label="Drop an audio file here" hint="MP3, WAV, OGG, M4A, FLAC" maxSizeMB={100} />
      ) : (
        <FileItem file={file} onRemove={() => { setFile(null); setAudioInfo(null); setResult(null); proc.reset(); }} />
      )}

      {file && (
        <audio ref={audioRef} controls src={URL.createObjectURL(file)} className="w-full rounded-lg" aria-label="Audio preview">
          Your browser does not support the audio element.
        </audio>
      )}

      {audioInfo && (
        <div className="card p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><p className="label text-xs">Duration</p><p className="text-gray-700 dark:text-gray-200">{formatDuration(audioInfo.duration)}</p></div>
            <div><p className="label text-xs">Sample rate</p><p className="text-gray-700 dark:text-gray-200">{audioInfo.sampleRate ? `${audioInfo.sampleRate} Hz` : '—'}</p></div>
            <div><p className="label text-xs">Channels</p><p className="text-gray-700 dark:text-gray-200">{audioInfo.channels ?? '—'}</p></div>
            <div><p className="label text-xs">Size</p><p className="text-gray-700 dark:text-gray-200">{formatBytes(audioInfo.sizeBytes)}</p></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="label" htmlFor="start-time">Start time (s)</label>
              <input id="start-time" type="number" min={0} max={audioInfo.duration} step={0.1} value={startTime} onChange={(e) => setStartTime(Number(e.target.value))} className="input" />
              <p className="text-xs text-gray-400">{formatDuration(startTime)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="label" htmlFor="end-time">End time (s)</label>
              <input id="end-time" type="number" min={0} max={audioInfo.duration} step={0.1} value={endTime} onChange={(e) => setEndTime(Number(e.target.value))} className="input" />
              <p className="text-xs text-gray-400">{formatDuration(endTime)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Volume gain ({Math.round(gain * 100)}%)</label>
            <input type="range" min={0} max={4} step={0.1} value={gain} onChange={(e) => setGain(Number(e.target.value))} className="w-48 accent-brand-600" aria-label="Volume gain" />
            {gain > 1.5 && <p className="text-xs text-amber-600 dark:text-amber-400">⚠ High gain may cause audio clipping.</p>}
          </div>

          <button onClick={handleProcess} disabled={proc.status === 'processing'} className="btn-primary self-start">
            Process & Export WAV
          </button>
        </div>
      )}

      <ProcessingCard
        status={proc.status}
        progress={proc.progress}
        errorMessage={proc.error?.message}
        result={result}
        originalSize={file?.size}
        onCancel={proc.cancel}
        onReset={() => { proc.reset(); setFile(null); setAudioInfo(null); setResult(null); }}
      />
    </div>
  );
}

export function AudioConvertPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Music} title="Audio Converter" description="Convert audio files in your browser." badge={<span className="badge-yellow">Partial</span>} />
      <div className="card p-4 flex items-start gap-3 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">Limited audio conversion available</p>
          <p className="mt-1 text-amber-700 dark:text-amber-400">
            Browser-based audio encoding is limited by available codecs. WAV (PCM) export is available via the Trim &amp; Volume tool. MP3 and M4A encoding requires loading a WASM codec (~10 MB), which is not currently bundled. Use the Trim &amp; Volume tool for WAV export.
          </p>
        </div>
      </div>
    </div>
  );
}
