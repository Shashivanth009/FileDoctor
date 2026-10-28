/**
 * Extract dominant colors from an ImageData using a simple median-cut–style approach.
 */
export type ColorSwatch = {
  hex: string;
  rgb: [number, number, number];
  count: number;
  percentage: number;
};

export function extractColors(imageData: ImageData, maxColors = 8): ColorSwatch[] {
  const pixels = imageData.data;
  const colorMap: Map<string, number> = new Map();
  const step = Math.max(1, Math.floor(pixels.length / 4 / 10_000)); // sample at most 10k pixels

  for (let i = 0; i < pixels.length; i += 4 * step) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    if (a < 128) continue; // skip transparent pixels

    // Quantize to reduce noise (bucket to nearest 16)
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const key = `${qr},${qg},${qb}`;
    colorMap.set(key, (colorMap.get(key) ?? 0) + 1);
  }

  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors * 3); // take top candidates before deduplication

  const totalSampled = sorted.reduce((s, [, c]) => s + c, 0);

  // Filter out perceptually close duplicates
  const result: ColorSwatch[] = [];
  for (const [key, count] of sorted) {
    const [r, g, b] = key.split(',').map(Number) as [number, number, number];
    const tooClose = result.some(({ rgb }) => colorDistance(rgb, [r, g, b]) < 40);
    if (!tooClose) {
      result.push({
        hex: rgbToHex(r, g, b),
        rgb: [r, g, b],
        count,
        percentage: Math.round((count / totalSampled) * 100),
      });
    }
    if (result.length >= maxColors) break;
  }

  return result;
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}
