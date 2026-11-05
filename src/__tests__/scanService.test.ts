import { describe, it, expect } from 'vitest';
import {
  getDefaultCorners,
  applyScanFilter,
  rotateCanvas,
  generatePdfFromScannedPages,
  ScannedPageItem,
} from '@/services/scanService';

describe('scanService document camera pipeline', () => {
  it('calculates default corner points with inset margins', () => {
    const corners = getDefaultCorners(1000, 800);
    expect(corners).toHaveLength(4);
    // TL
    expect(corners[0].x).toBe(50);
    expect(corners[0].y).toBe(40);
    // TR
    expect(corners[1].x).toBe(950);
    expect(corners[1].y).toBe(40);
    // BR
    expect(corners[2].x).toBe(950);
    expect(corners[2].y).toBe(760);
    // BL
    expect(corners[3].x).toBe(50);
    expect(corners[3].y).toBe(760);
  });

  it('rotates canvas by 90, 180, and 270 degrees', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;

    const rotated90 = rotateCanvas(canvas, 90);
    expect(rotated90.width).toBe(100);
    expect(rotated90.height).toBe(200);

    const rotated180 = rotateCanvas(canvas, 180);
    expect(rotated180.width).toBe(200);
    expect(rotated180.height).toBe(100);
  });

  it('applies filters including magic color, bw, and grayscale', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 50, 50);
    }

    const magic = applyScanFilter(canvas, 'magic');
    expect(magic.width).toBe(50);

    const bw = applyScanFilter(canvas, 'bw');
    expect(bw.width).toBe(50);

    const gray = applyScanFilter(canvas, 'grayscale');
    expect(gray.width).toBe(50);
  });

  it('compiles multiple scanned pages into a multi-page PDF', async () => {
    const c1 = document.createElement('canvas');
    c1.width = 100;
    c1.height = 140;
    const c2 = document.createElement('canvas');
    c2.width = 100;
    c2.height = 140;

    const mockPages: ScannedPageItem[] = [
      {
        id: 'p1',
        originalCanvas: c1,
        corners: getDefaultCorners(100, 140),
        filter: 'magic',
        rotation: 0,
        processedCanvas: c1,
        thumbnailUrl: '',
      },
      {
        id: 'p2',
        originalCanvas: c2,
        corners: getDefaultCorners(100, 140),
        filter: 'bw',
        rotation: 0,
        processedCanvas: c2,
        thumbnailUrl: '',
      },
    ];

    const res = await generatePdfFromScannedPages(mockPages, {
      pageSize: 'a4',
      quality: 0.8,
      documentTitle: 'Test Scanned Document',
    });

    expect(res.success).toBe(true);
    expect(res.outputBlob).toBeDefined();
    expect(res.outputSize).toBeGreaterThan(0);
    expect(res.outputFilename).toContain('Test_Scanned_Document');
  });
});

