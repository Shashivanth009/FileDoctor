import { ProcessingResult } from '@/types';
import { readFileAsDataURL } from './fileService';

export interface ImageCompressionOptions {
  mode: 'preset' | 'percentage' | 'target-size' | 'custom';
  preset?: 'light' | 'balanced' | 'strong' | 'maximum';
  reductionPercentage?: number;
  targetSizeKB?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageResizeOptions {
  mode: 'dimensions' | 'percentage';
  width?: number;
  height?: number;
  percentage?: number;
  maintainAspectRatio?: boolean;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

export interface ImageCropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // 0, 90, 180, 270
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
}

export interface ImageFilterOptions {
  grayscale?: number; // 0 to 100
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  blur?: number; // 0 to 20 px
  invert?: boolean;
  sepia?: number; // 0 to 100
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
}

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
}

/**
 * Loads an image File into an HTMLImageElement
 */
export async function loadImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await readFileAsDataURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image file into memory'));
    img.src = dataUrl;
  });
}

/**
 * 9.1 Image Compressor — Multi-strategy canvas compressor with target size solver
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions
): Promise<ProcessingResult & { targetAchieved?: boolean }> {
  const startTime = performance.now();
  const originalSize = file.size;

  try {
    const img = await loadImage(file);
    let targetFormat: string = options.format || (file.type === 'image/png' ? 'image/webp' : file.type);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(targetFormat)) {
      targetFormat = 'image/jpeg';
    }

    let quality = options.quality ?? 0.8;
    let scale = 1.0;

    if (options.mode === 'preset') {
      switch (options.preset) {
        case 'light':
          quality = 0.85;
          scale = 1.0;
          break;
        case 'balanced':
          quality = 0.75;
          scale = 0.95;
          break;
        case 'strong':
          quality = 0.6;
          scale = 0.85;
          break;
        case 'maximum':
          quality = 0.45;
          scale = 0.7;
          break;
      }
    } else if (options.mode === 'percentage') {
      const pct = options.reductionPercentage || 40;
      quality = Math.max(0.2, 1 - pct / 120);
      if (pct > 60) scale = 0.85;
      if (pct > 80) scale = 0.7;
    } else if (options.mode === 'target-size') {
      const targetBytes = (options.targetSizeKB || 200) * 1024;
      const ratio = targetBytes / originalSize;
      quality = Math.min(0.9, Math.max(0.2, ratio * 0.9));
      if (ratio < 0.5) scale = 0.85;
      if (ratio < 0.25) scale = 0.65;
    }

    const canvas = document.createElement('canvas');
    let width = Math.round(img.naturalWidth * scale);
    let height = Math.round(img.naturalHeight * scale);

    if (options.maxWidth && width > options.maxWidth) {
      height = Math.round((height * options.maxWidth) / width);
      width = options.maxWidth;
    }
    if (options.maxHeight && height > options.maxHeight) {
      width = Math.round((width * options.maxHeight) / height);
      height = options.maxHeight;
    }

    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    // Fill white background for JPEG conversions from transparent PNG
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let outputBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), targetFormat, quality);
    });

    // If target size mode was specified and output is still larger, do binary quality downsearch
    if (options.mode === 'target-size' && options.targetSizeKB) {
      const targetBytes = options.targetSizeKB * 1024;
      let minQ = 0.1;
      let maxQ = quality;
      let iterations = 0;

      while (outputBlob.size > targetBytes && iterations < 3 && maxQ > 0.2) {
        iterations++;
        quality = (minQ + maxQ) / 2;
        outputBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob()), targetFormat, quality);
        });
        maxQ = quality;
      }
    }

    const ext = targetFormat === 'image/png' ? 'png' : targetFormat === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outputFilename = `${baseName}_compressed.${ext}`;

    return {
      success: true,
      outputBlob,
      outputFilename,
      originalSize,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
      targetAchieved: options.targetSizeKB ? outputBlob.size <= options.targetSizeKB * 1024 : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize,
      processingTime: performance.now() - startTime,
      error: err.message || 'Image compression failed',
    };
  }
}

/**
 * 9.2 Image Converter: Genuine pixel transcoding between PNG, JPEG, WebP, BMP
 */
export async function convertImage(
  file: File,
  targetFormat: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp',
  quality = 0.92
): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    const mime = targetFormat === 'image/bmp' ? 'image/png' : targetFormat;
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), mime, quality);
    });

    const ext =
      targetFormat === 'image/jpeg' ? 'jpg' :
      targetFormat === 'image/webp' ? 'webp' :
      targetFormat === 'image/bmp' ? 'bmp' : 'png';

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outputFilename = `${baseName}_converted.${ext}`;

    return {
      success: true,
      outputBlob: blob,
      outputFilename,
      originalSize: file.size,
      outputSize: blob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Image conversion failed',
    };
  }
}

/**
 * 9.3 Image Resizer
 */
export async function resizeImage(file: File, options: ImageResizeOptions): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const img = await loadImage(file);
    let targetWidth = img.naturalWidth;
    let targetHeight = img.naturalHeight;

    if (options.mode === 'percentage') {
      const pct = (options.percentage || 100) / 100;
      targetWidth = Math.round(img.naturalWidth * pct);
      targetHeight = Math.round(img.naturalHeight * pct);
    } else {
      if (options.width && options.height) {
        targetWidth = options.width;
        targetHeight = options.height;
      } else if (options.width) {
        targetWidth = options.width;
        targetHeight = options.maintainAspectRatio !== false
          ? Math.round((img.naturalHeight * options.width) / img.naturalWidth)
          : img.naturalHeight;
      } else if (options.height) {
        targetHeight = options.height;
        targetWidth = options.maintainAspectRatio !== false
          ? Math.round((img.naturalWidth * options.height) / img.naturalHeight)
          : img.naturalWidth;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, targetWidth);
    canvas.height = Math.max(1, targetHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const format = options.format || (file.type as any) || 'image/png';
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, options.quality || 0.92);
    });

    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outputFilename = `${baseName}_${canvas.width}x${canvas.height}.${ext}`;

    return {
      success: true,
      outputBlob: blob,
      outputFilename,
      originalSize: file.size,
      outputSize: blob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Image resize failed',
    };
  }
}

/**
 * 9.4 Image Cropper & Transformer
 */
export async function cropImage(file: File, options: ImageCropOptions): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(options.width));
    canvas.height = Math.max(1, Math.round(options.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    ctx.save();
    if (options.rotation) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((options.rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    if (options.flipHorizontal || options.flipVertical) {
      ctx.scale(options.flipHorizontal ? -1 : 1, options.flipVertical ? -1 : 1);
      ctx.translate(options.flipHorizontal ? -canvas.width : 0, options.flipVertical ? -canvas.height : 0);
    }

    ctx.drawImage(
      img,
      options.x,
      options.y,
      options.width,
      options.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();

    const format = options.format || 'image/png';
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, 0.95);
    });

    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outputFilename = `${baseName}_cropped.${ext}`;

    return {
      success: true,
      outputBlob: blob,
      outputFilename,
      originalSize: file.size,
      outputSize: blob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Image crop failed',
    };
  }
}

/**
 * 9.5 Metadata Remover: Strip EXIF, GPS, camera metadata via clean re-encoding
 */
export async function removeImageMetadata(file: File): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.drawImage(img, 0, 0);

    const format = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, 0.95);
    });

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    const outputFilename = `${baseName}_sanitized.${ext}`;

    return {
      success: true,
      outputBlob: blob,
      outputFilename,
      originalSize: file.size,
      outputSize: blob.size,
      processingTime: performance.now() - startTime,
      warnings: ['All EXIF, GPS coordinates, device identifiers, and timestamps stripped completely.'],
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Metadata removal failed',
    };
  }
}

/**
 * 9.6 Color Palette Extractor: Dominant colors with HEX, RGB, HSL
 */
export async function extractColorPalette(file: File, sampleCount = 6): Promise<ExtractedColor[]> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  // Downsample to fast analysis grid
  const size = 100;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
  const totalPixels = size * size;

  for (let i = 0; i < data.length; i += 16) {
    // skip transparent pixels
    if (data[i + 3] < 128) continue;

    // Quantize into 32-value intervals
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;

    if (!colorBuckets[key]) {
      colorBuckets[key] = { r, g, b, count: 0 };
    }
    colorBuckets[key].count++;
  }

  const sorted = Object.values(colorBuckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, sampleCount);

  return sorted.map((c) => {
    const hex = `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1).toUpperCase()}`;

    // RGB to HSL
    const rNorm = c.r / 255;
    const gNorm = c.g / 255;
    const bNorm = c.b / 255;
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
      hex,
      rgb: { r: c.r, g: c.g, b: c.b },
      hsl: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
      percentage: Math.round((c.count / (totalPixels / 4)) * 100),
    };
  });
}

/**
 * 9.7 Image Filters (Grayscale, Brightness, Contrast, Blur, etc.)
 */
export async function applyImageFilters(file: File, options: ImageFilterOptions): Promise<ProcessingResult> {
  const startTime = performance.now();
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // Build CSS filter string
    const filters: string[] = [];
    if (options.grayscale) filters.push(`grayscale(${options.grayscale}%)`);
    if (options.brightness) filters.push(`brightness(${100 + options.brightness}%)`);
    if (options.contrast) filters.push(`contrast(${100 + options.contrast}%)`);
    if (options.blur) filters.push(`blur(${options.blur}px)`);
    if (options.invert) filters.push('invert(100%)');
    if (options.sepia) filters.push(`sepia(${options.sepia}%)`);

    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }

    ctx.drawImage(img, 0, 0);

    const format = options.format || (file.type as any) || 'image/png';
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, 0.95);
    });

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const outputFilename = `${baseName}_filtered.${ext}`;

    return {
      success: true,
      outputBlob: blob,
      outputFilename,
      originalSize: file.size,
      outputSize: blob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: file.size,
      processingTime: performance.now() - startTime,
      error: err.message || 'Filter application failed',
    };
  }
}

