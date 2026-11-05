import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { Layout } from '@/components/layout';
import { useThemeStore } from '@/stores/themeStore';

// Main Pages
import { Overview } from '@/pages/Overview';
import { AllTools } from '@/pages/AllTools';
import { RecentOperations } from '@/pages/RecentOperations';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { PrivacyCenter } from '@/pages/PrivacyCenter';
import { SettingsPage } from '@/pages/SettingsPage';
import { CreationStudio } from '@/pages/CreationStudio';

// Category Hub Pages
import { PdfClinic } from '@/pages/categories/PdfClinic';
import { ImageStudio } from '@/pages/categories/ImageStudio';
import { AudioVideoStudio } from '@/pages/categories/AudioVideoStudio';
import { DataTextLab } from '@/pages/categories/DataTextLab';
import { AiUtilities } from '@/pages/categories/AiUtilities';
import { CompressionCenter } from '@/pages/categories/CompressionCenter';

// PDF Tools
import { PdfScannerPage } from '@/pages/tools/PdfScannerPage';
import { PdfOrganizePage } from '@/pages/tools/PdfOrganizePage';
import { PdfCompressorPage } from '@/pages/tools/PdfCompressorPage';
import { PdfMergePage } from '@/pages/tools/PdfMergePage';
import { PdfSplitPage } from '@/pages/tools/PdfSplitPage';
import { PdfToImagesPage } from '@/pages/tools/PdfToImagesPage';
import { ImagesToPdfPage } from '@/pages/tools/ImagesToPdfPage';
import { PdfSignerPage } from '@/pages/tools/PdfSignerPage';
import { PdfRotatePage } from '@/pages/tools/PdfRotatePage';
import { PdfWatermarkPage } from '@/pages/tools/PdfWatermarkPage';
import { PdfToTextPage } from '@/pages/tools/PdfToTextPage';
import { PdfFlattenPage } from '@/pages/tools/PdfFlattenPage';

// Image Tools
import { ImageCompressorPage } from '@/pages/tools/ImageCompressorPage';
import { ImageConverterPage } from '@/pages/tools/ImageConverterPage';
import { ImageResizerPage } from '@/pages/tools/ImageResizerPage';
import { ImageMetadataPage } from '@/pages/tools/ImageMetadataPage';
import { ImagePalettePage } from '@/pages/tools/ImagePalettePage';
import { ImageFiltersPage } from '@/pages/tools/ImageFiltersPage';

// Data & Text Tools
import { DataConverterPage } from '@/pages/tools/DataConverterPage';
import { CodeFormatterPage } from '@/pages/tools/CodeFormatterPage';
import { TextCleanerPage } from '@/pages/tools/TextCleanerPage';
import { DeveloperUtilitiesPage } from '@/pages/tools/DeveloperUtilitiesPage';

// Audio Tools
import { AudioConverterPage } from '@/pages/tools/AudioConverterPage';
import { AudioTrimmerPage } from '@/pages/tools/AudioTrimmerPage';
import { AudioVolumePage } from '@/pages/tools/AudioVolumePage';

// AI Tools
import { OcrPage } from '@/pages/tools/OcrPage';
import { DocumentSummarizerPage } from '@/pages/tools/DocumentSummarizerPage';

export const App: React.FC = () => {
  const resolved = useThemeStore((s) => s.resolved);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  }, [resolved]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (useThemeStore.getState().mode === 'system') {
        useThemeStore.getState().setMode('system');
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Primary Hubs */}
            <Route index element={<Overview />} />
            <Route path="create" element={<CreationStudio />} />
            <Route path="tools" element={<AllTools />} />
            <Route path="pdf" element={<PdfClinic />} />
            <Route path="image" element={<ImageStudio />} />
            <Route path="audio-video" element={<AudioVideoStudio />} />
            <Route path="data-text" element={<DataTextLab />} />
            <Route path="ai" element={<AiUtilities />} />
            <Route path="compression" element={<CompressionCenter />} />
            <Route path="recent" element={<RecentOperations />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="privacy" element={<PrivacyCenter />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Functional PDF Tool Routes */}
            <Route path="tools/pdf-scan" element={<PdfScannerPage />} />
            <Route path="tools/image-scan" element={<PdfScannerPage />} />
            <Route path="tools/pdf-compress" element={<PdfCompressorPage />} />
            <Route path="tools/pdf-merge" element={<PdfMergePage />} />
            <Route path="tools/pdf-split" element={<PdfSplitPage />} />
            <Route path="tools/pdf-organize" element={<PdfOrganizePage />} />
            <Route path="tools/pdf-to-images" element={<PdfToImagesPage />} />
            <Route path="tools/images-to-pdf" element={<ImagesToPdfPage />} />
            <Route path="tools/pdf-sign" element={<PdfSignerPage />} />
            <Route path="tools/pdf-rotate" element={<PdfRotatePage />} />
            <Route path="tools/pdf-watermark" element={<PdfWatermarkPage />} />
            <Route path="tools/pdf-page-numbers" element={<PdfWatermarkPage />} />
            <Route path="tools/pdf-metadata" element={<PdfFlattenPage />} />
            <Route path="tools/pdf-protect" element={<PdfCompressorPage />} />
            <Route path="tools/pdf-to-text" element={<PdfToTextPage />} />
            <Route path="tools/pdf-flatten" element={<PdfFlattenPage />} />

            {/* Functional Image Tool Routes */}
            <Route path="tools/image-compress" element={<ImageCompressorPage />} />
            <Route path="tools/image-convert" element={<ImageConverterPage />} />
            <Route path="tools/image-resize" element={<ImageResizerPage />} />
            <Route path="tools/image-crop" element={<ImageResizerPage />} />
            <Route path="tools/image-metadata" element={<ImageMetadataPage />} />
            <Route path="tools/image-palette" element={<ImagePalettePage />} />
            <Route path="tools/image-rotate" element={<ImageFiltersPage />} />
            <Route path="tools/image-filters" element={<ImageFiltersPage />} />
            <Route path="tools/image-watermark" element={<ImageFiltersPage />} />

            {/* Functional Data & Code Routes */}
            <Route path="tools/csv-to-json" element={<DataConverterPage />} />
            <Route path="tools/json-to-csv" element={<DataConverterPage />} />
            <Route path="tools/csv-to-xlsx" element={<DataConverterPage />} />
            <Route path="tools/xlsx-to-csv" element={<DataConverterPage />} />
            <Route path="tools/json-to-xlsx" element={<DataConverterPage />} />
            <Route path="tools/xlsx-to-json" element={<DataConverterPage />} />
            <Route path="tools/json-formatter" element={<CodeFormatterPage />} />
            <Route path="tools/json-minifier" element={<CodeFormatterPage />} />
            <Route path="tools/js-beautifier" element={<CodeFormatterPage />} />
            <Route path="tools/js-minifier" element={<CodeFormatterPage />} />
            <Route path="tools/html-formatter" element={<CodeFormatterPage />} />
            <Route path="tools/css-formatter" element={<CodeFormatterPage />} />
            <Route path="tools/json-validator" element={<CodeFormatterPage />} />

            {/* Functional Text Routes */}
            <Route path="tools/text-cleaner" element={<TextCleanerPage />} />
            <Route path="tools/case-converter" element={<TextCleanerPage />} />
            <Route path="tools/word-counter" element={<TextCleanerPage />} />
            <Route path="tools/dedup-lines" element={<TextCleanerPage />} />
            <Route path="tools/find-replace" element={<TextCleanerPage />} />
            <Route path="tools/base64" element={<DeveloperUtilitiesPage />} />
            <Route path="tools/url-encoder" element={<DeveloperUtilitiesPage />} />
            <Route path="tools/hash-generator" element={<TextCleanerPage />} />

            {/* Developer Utilities */}
            <Route path="tools/uuid-generator" element={<DeveloperUtilitiesPage />} />
            <Route path="tools/jwt-decoder" element={<DeveloperUtilitiesPage />} />
            <Route path="tools/regex-tester" element={<DeveloperUtilitiesPage />} />
            <Route path="tools/timestamp-converter" element={<DeveloperUtilitiesPage />} />
            <Route path="tools/color-converter" element={<DeveloperUtilitiesPage />} />
            <Route path="tools/slug-generator" element={<TextCleanerPage />} />
            <Route path="tools/qr-generate" element={<DeveloperUtilitiesPage />} />

            {/* Audio Tools */}
            <Route path="tools/audio-convert" element={<AudioConverterPage />} />
            <Route path="tools/audio-trim" element={<AudioTrimmerPage />} />
            <Route path="tools/audio-volume" element={<AudioVolumePage />} />
            <Route path="tools/video-compress" element={<AudioTrimmerPage />} />
            <Route path="tools/video-convert" element={<AudioConverterPage />} />
            <Route path="tools/video-to-gif" element={<ImageConverterPage />} />

            {/* AI Tools */}
            <Route path="tools/ocr" element={<OcrPage />} />
            <Route path="tools/document-summarizer" element={<DocumentSummarizerPage />} />
            <Route path="tools/compress-all" element={<PdfCompressorPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
