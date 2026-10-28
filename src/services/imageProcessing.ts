import imageCompression from 'browser-image-compression';
import type { ProcessingResult, ProcessingContext, ImageInfo, ImageOutputFormat } from '@/types';
import { withExtension, getBaseName } from '@/utils/sanitize';
import { extractColors, type ColorSwatch } from '@/utils/colors';

/**
 * Get image dimensions from a File.
 */
export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: file.type,
        sizeBytes: file.size,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions.'));
    };
    img.src = url;
  });
}

/**
 * Convert an image to a target format using Canvas.
 */
export async function convertImage(
  file: File,
  targetMime: ImageOutputFormat,
  quality = 0.9,
  ctx: ProcessingContext = {}
): Promise<ProcessingResult> {
  const { onProgress } = ctx;
  onProgress?.(10);

  const bitmap = await createImageBitmap(file);
  onProgress?.(40);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context.');
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  onProgress?.(70);

  const blob = await canvas.convertToBlob({ type: targetMime, quality });
  onProgress?.(100);

  const extMap: Record<ImageOutputFormat, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  const ext = extMap[targetMime];

  return {
    blob,
    fileName: withExtension(getBaseName(file.name), ext),
    mimeType: targetMime,
    metadata: { width: bitmap.width, height: bitmap.height },
  };
}

/**
 * Resize an image to specific dimensions.
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  targetMime: ImageOutputFormat = 'image/jpeg',
  quality = 0.9,
  ctx: ProcessingContext = {}
): Promise<ProcessingResult> {
  const { onProgress } = ctx;
  onProgress?.(10);

  const bitmap = await createImageBitmap(file);
  onProgress?.(40);

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context.');
  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();
  onProgress?.(70);

  const blob = await canvas.convertToBlob({ type: targetMime, quality });
  onProgress?.(100);

  const extMap: Record<ImageOutputFormat, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };

  return {
    blob,
    fileName: withExtension(getBaseName(file.name) + `_${targetWidth}x${targetHeight}`, extMap[targetMime]),
    mimeType: targetMime,
    metadata: { width: targetWidth, height: targetHeight },
  };
}

/**
 * Compress an image using browser-image-compression.
 */
export async function compressImage(
  file: File,
  maxSizeMB = 1,
  maxWidthOrHeight = 4096,
  quality = 0.8,
  ctx: ProcessingContext = {}
): Promise<ProcessingResult> {
  const { onProgress } = ctx;

  const compressed = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: quality,
    onProgress,
    fileType: file.type as ImageOutputFormat,
  });

  const ext = compressed.type === 'image/jpeg' ? 'jpg'
    : compressed.type === 'image/webp' ? 'webp'
    : 'png';

  return {
    blob: compressed,
    fileName: withExtension(getBaseName(file.name) + '_compressed', ext),
    mimeType: compressed.type,
    metadata: { originalSize: file.size, outputSize: compressed.size },
  };
}

/**
 * Strip metadata by re-encoding the image through canvas.
 * This removes EXIF, XMP, IPTC, and other metadata reliably for PNG/JPEG/WebP.
 */
export async function stripMetadata(
  file: File,
  quality = 0.92,
  ctx: ProcessingContext = {}
): Promise<ProcessingResult> {
  const { onProgress } = ctx;
  onProgress?.(10);

  const bitmap = await createImageBitmap(file);
  onProgress?.(50);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context.');
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  // Determine output mime — keep format the same for lossless PNG, use JPEG otherwise
  const outMime: ImageOutputFormat =
    file.type === 'image/png' ? 'image/png' :
    file.type === 'image/webp' ? 'image/webp' :
    'image/jpeg';

  const blob = await canvas.convertToBlob({ type: outMime, quality });
  onProgress?.(100);

  const extMap: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  const ext = extMap[outMime] ?? 'jpg';

  return {
    blob,
    fileName: withExtension(getBaseName(file.name) + '_clean', ext),
    mimeType: outMime,
    metadata: {
      strippedVia: 'canvas-reencode',
      note: 'Re-encoding through Canvas removes EXIF, XMP, and IPTC metadata for JPEG/PNG/WebP.',
    },
  };
}

/**
 * Extract color palette from an image.
 */
export async function extractImagePalette(
  file: File,
  maxColors = 8
): Promise<ColorSwatch[]> {
  const bitmap = await createImageBitmap(file, {
    resizeWidth: 200,
    resizeHeight: 200,
    resizeQuality: 'medium',
  });

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context.');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return extractColors(imageData, maxColors);
}
