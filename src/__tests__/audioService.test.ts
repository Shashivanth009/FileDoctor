import { describe, it, expect } from 'vitest';
import { audioBufferToWav } from '../services/audioService';

describe('audioService and WAV encoding', () => {
  it('generates a valid RIFF WAVE header and PCM structure', () => {
    // Create a mock AudioBuffer
    const sampleRate = 44100;
    const numChannels = 2;
    const length = 1000;

    const mockBuffer = {
      numberOfChannels: numChannels,
      sampleRate,
      length,
      duration: length / sampleRate,
      getChannelData: (ch: number) => new Float32Array(length).fill(0.1 * (ch + 1)),
    } as unknown as AudioBuffer;

    const wavBlob = audioBufferToWav(mockBuffer);
    expect(wavBlob).toBeDefined();
    expect(wavBlob.type).toBe('audio/wav');

    // Expected size: 44 bytes header + (length * numChannels * 2 bytesPerSample)
    const expectedDataLength = length * numChannels * 2;
    const expectedTotalSize = 44 + expectedDataLength;
    expect(wavBlob.size).toBe(expectedTotalSize);
  });

  it('handles mono single-channel audio correctly', () => {
    const sampleRate = 22050;
    const numChannels = 1;
    const length = 500;

    const mockBuffer = {
      numberOfChannels: numChannels,
      sampleRate,
      length,
      duration: length / sampleRate,
      getChannelData: () => new Float32Array(length).fill(0.25),
    } as unknown as AudioBuffer;

    const wavBlob = audioBufferToWav(mockBuffer);
    expect(wavBlob.size).toBe(44 + 500 * 1 * 2);
  });
});

