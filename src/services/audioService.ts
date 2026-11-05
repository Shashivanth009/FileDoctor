import { ProcessingResult } from '@/types';
import { readFileAsArrayBuffer } from './fileService';

/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataLength, true);

  // Write interleaved PCM samples
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channelData[c][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * 10.1 Audio Converter: Decode source audio and export as clean WAV/compressed audio
 */
export async function convertAudio(file: File, targetFormat = 'audio/wav'): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const arrayBuf = await readFileAsArrayBuffer(file);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuf);

    const wavBlob = audioBufferToWav(decodedBuffer);
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob: wavBlob,
      outputFilename: `${baseName}_converted.wav`,
      originalSize: file.size,
      outputSize: wavBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Audio conversion failed',
    };
  }
}

/**
 * 10.2 Audio Trimmer
 */
export async function trimAudio(
  file: File,
  startTimeSec: number,
  endTimeSec: number
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const arrayBuf = await readFileAsArrayBuffer(file);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(arrayBuf);

    const sampleRate = decoded.sampleRate;
    const startSample = Math.max(0, Math.floor(startTimeSec * sampleRate));
    const endSample = Math.min(decoded.length, Math.floor(endTimeSec * sampleRate));
    const frameCount = Math.max(1, endSample - startSample);

    const offlineCtx = new OfflineAudioContext(decoded.numberOfChannels, frameCount, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0, startTimeSec, endTimeSec - startTimeSec);

    const rendered = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWav(rendered);
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob: wavBlob,
      outputFilename: `${baseName}_trimmed.wav`,
      originalSize: file.size,
      outputSize: wavBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Audio trimming failed',
    };
  }
}

/**
 * 10.3 Audio Volume & Normalization
 */
export async function adjustAudioVolume(
  file: File,
  options: { volumeMultiplier?: number; normalize?: boolean }
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const arrayBuf = await readFileAsArrayBuffer(file);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(arrayBuf);

    const offlineCtx = new OfflineAudioContext(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;

    let gainValue = options.volumeMultiplier ?? 1.0;

    // Normalization calculation: find peak amplitude
    if (options.normalize) {
      let maxPeak = 0;
      for (let c = 0; c < decoded.numberOfChannels; c++) {
        const data = decoded.getChannelData(c);
        for (let i = 0; i < data.length; i++) {
          const abs = Math.abs(data[i]);
          if (abs > maxPeak) maxPeak = abs;
        }
      }
      if (maxPeak > 0) {
        gainValue = 0.98 / maxPeak; // Target near 0 dBFS without clipping
      }
    }

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = gainValue;

    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWav(rendered);
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return {
      success: true,
      outputBlob: wavBlob,
      outputFilename: `${baseName}_processed.wav`,
      originalSize: file.size,
      outputSize: wavBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Audio adjustment failed',
    };
  }
}

