import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/feedback/Toast';
import { useTheme } from '@/hooks/useTheme';

// Pages
import { HomePage } from '@/features/home/HomePage';
import { AllToolsPage } from '@/features/home/AllToolsPage';

// PDF
import { MergePdfPage } from '@/features/pdf/merge/MergePdfPage';
import { SplitPdfPage } from '@/features/pdf/split/SplitPdfPage';
import { CompressPdfPage } from '@/features/pdf/compress/CompressPdfPage';
import { PdfToImagesPage } from '@/features/pdf/to-images/PdfToImagesPage';
import { ImagesToPdfPage } from '@/features/pdf/from-images/ImagesToPdfPage';
import { SignPdfPage } from '@/features/pdf/sign/SignPdfPage';
import { PdfCategoryPage } from '@/features/pdf/PdfCategoryPage';

// Images
import { ImageConvertPage } from '@/features/images/convert/ImageConvertPage';
import { ImageResizePage } from '@/features/images/resize/ImageResizePage';
import { ImageCompressPage } from '@/features/images/compress/ImageCompressPage';
import { MetadataPage } from '@/features/images/metadata/MetadataPage';
import { PalettePage } from '@/features/images/palette/PalettePage';
import { ImageCategoryPage } from '@/features/images/ImageCategoryPage';

// Data & Text
import { TabularConvertPage } from '@/features/data-text/tabular-convert/TabularConvertPage';
import { CodeFormatPage } from '@/features/data-text/code-format/CodeFormatPage';
import { TextCleanerPage } from '@/features/data-text/text-cleaner/TextCleanerPage';
import { DataCategoryPage } from '@/features/data-text/DataCategoryPage';

// Audio
import { AudioPage, AudioConvertPage } from '@/features/audio/AudioPage';
import { AudioCategoryPage } from '@/features/audio/AudioCategoryPage';

// AI
import { SummarizePage, OcrPage } from '@/features/ai/AiPage';
import { AiCategoryPage } from '@/features/ai/AiCategoryPage';

// Other
import { HistoryPage } from '@/features/history/HistoryPage';
import { FavoritesPage } from '@/features/history/FavoritesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

function AppRoutes() {
  const { theme, setTheme } = useTheme();

  return (
    <Routes>
      <Route element={<AppLayout theme={theme} onThemeChange={setTheme} />}>
        <Route index element={<HomePage />} />
        <Route path="tools" element={<AllToolsPage />} />

        {/* PDF Clinic */}
        <Route path="pdf" element={<PdfCategoryPage />} />
        <Route path="pdf/merge" element={<MergePdfPage />} />
        <Route path="pdf/split" element={<SplitPdfPage />} />
        <Route path="pdf/compress" element={<CompressPdfPage />} />
        <Route path="pdf/to-images" element={<PdfToImagesPage />} />
        <Route path="pdf/from-images" element={<ImagesToPdfPage />} />
        <Route path="pdf/sign" element={<SignPdfPage />} />

        {/* Image Studio */}
        <Route path="images" element={<ImageCategoryPage />} />
        <Route path="images/convert" element={<ImageConvertPage />} />
        <Route path="images/resize" element={<ImageResizePage />} />
        <Route path="images/compress" element={<ImageCompressPage />} />
        <Route path="images/metadata" element={<MetadataPage />} />
        <Route path="images/palette" element={<PalettePage />} />

        {/* Data & Text */}
        <Route path="data" element={<DataCategoryPage />} />
        <Route path="data/tabular" element={<TabularConvertPage />} />
        <Route path="data/code" element={<CodeFormatPage />} />
        <Route path="data/text" element={<TextCleanerPage />} />

        {/* Audio */}
        <Route path="audio" element={<AudioCategoryPage />} />
        <Route path="audio/convert" element={<AudioConvertPage />} />
        <Route path="audio/trim" element={<AudioPage />} />

        {/* AI */}
        <Route path="ai" element={<AiCategoryPage />} />
        <Route path="ai/summarize" element={<SummarizePage />} />
        <Route path="ai/ocr" element={<OcrPage />} />

        {/* Other */}
        <Route path="history" element={<HistoryPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}
