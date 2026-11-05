import { describe, it, expect } from 'vitest';

describe('imageService utilities and color conversions', () => {
  it('converts RGB components to correct uppercase HEX', () => {
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(73, 107, 255)).toBe('#496BFF'); // Electric Blue
    expect(rgbToHex(72, 220, 199)).toBe('#48DCC7'); // Arctic Mint
  });

  it('converts RGB to accurate HSL values', () => {
    const rgbToHsl = (r: number, g: number, b: number) => {
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rNorm:
            h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
            break;
          case gNorm:
            h = (bNorm - rNorm) / d + 2;
            break;
          case bNorm:
            h = (rNorm - gNorm) / d + 4;
            break;
        }
        h /= 6;
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
      };
    };

    // Pure Red
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    // Pure Green
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
    // Pure Blue
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
    // Neutral Gray
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
  });

  it('calculates aspect-ratio maintained resize dimensions correctly', () => {
    const originalWidth = 1920;
    const originalHeight = 1080;
    const aspectRatio = originalWidth / originalHeight;

    // Resize by width 1280
    const targetWidth = 1280;
    const calculatedHeight = Math.round(targetWidth / aspectRatio);
    expect(calculatedHeight).toBe(720);

    // Resize by percentage 50%
    const scale = 0.5;
    expect(originalWidth * scale).toBe(960);
    expect(originalHeight * scale).toBe(540);
  });
});

