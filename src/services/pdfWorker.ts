import * as pdfjsLib from 'pdfjs-dist';

// Configure local worker to guarantee 100% offline privacy and prevent CDN fetch errors
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      '/pdf.worker.min.mjs',
      window.location.origin
    ).href;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
}

export { pdfjsLib };
