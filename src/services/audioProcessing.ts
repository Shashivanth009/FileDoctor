import type { ProcessingResult, ProcessingContext, AudioInfo } from '@/types';
import { withExtension, getBaseName } from '@/utils/sanitize';

/**
 * Decode an audio file using Web Audio API and return basic info.
 */
export async function getAudioInfo(file: File): Promise<AudioInfo> {
  const ab = await file.arrayBuffer();
  const ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  try {
    const buffer = await ac.decodeAudioData(ab);
    return {
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
      sizeBytes: file.size,
      format: file.type,
    };
  } finally {
    await ac.close();
  }
}

/**
 * Trim an audio file between start and end seconds and export as WAV.
 * Uses Web Audio API + a PCM WAV encoder.
 */
export async function trimAudio(
  file: File,
  startSeconds: number,
  endSeconds: number,
  gainFactor = 1.0,
  ctx: ProcessingContext = {}
): Promise<ProcessingResult> {
  const { onProgress } = ctx;
  onProgress?.(10);

  const ab = await file.arrayBuffer();
  const ac = new AudioContext();

  try {
    const buffer = await ac.decodeAudioData(ab);
    onProgress?.(40);

    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    const startSample = Math.floor(startSeconds * sampleRate);
    const endSample = Math.min(Math.floor(endSeconds * sampleRate), buffer.length);
    const frameCount = endSample - startSample;

    const offlineCtx = new OfflineAudioContext(channels, frameCount, sampleRate);
    const source = offlineCtx.createBufferSource();

    // Create a trimmed buffer
    const trimmedBuffer = offlineCtx.createBuffer(channels, frameCount, sampleRate);
    for (let ch = 0; ch < channels; ch++) {
      const srcData = buffer.getChannelData(ch).subarray(startSample, endSample);
      trimmedBuffer.getChannelData(ch).set(srcData);
    }

    // Apply gain
    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(gainFactor, 4));
    gainNode.connect(offlineCtx.destination);

    source.buffer = trimmedBuffer;
    source.connect(gainNode);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    onProgress?.(80);

    const wavBlob = audioBufferToWav(rendered);
    onProgress?.(100);

    return {
      blob: wavBlob,
      fileName: withExtension(getBaseName(file.name) + '_trimmed', 'wav'),
      mimeType: 'audio/wav',
      metadata: {
        duration: rendered.duration,
        sampleRate: rendered.sampleRate,
        channels: rendered.numberOfChannels,
      },
    };
  } finally {
    await ac.close();
  }
}

/**
 * Encode an AudioBuffer to a WAV Blob (PCM 16-bit).
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);

  function writeStr(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([ab], { type: 'audio/wav' });
}
