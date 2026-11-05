import React, { useState, useEffect } from 'react';
import {
  Layers,
  RotateCw,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  RefreshCw,
  Download,
  FileText,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { pdfjsLib } from '@/services/pdfWorker';
import { organizePdf, renderPdfPageToCanvas } from '@/services/pdfService';
import { downloadBlob, formatFileSize } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

interface PageCardItem {
  id: string;
  originalIndex: number; // 0-based
  displayNumber: number;
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl: string;
  width: number;
  height: number;
}

export const PdfOrganizePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageCardItem[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [previewPage, setPreviewPage] = useState<PageCardItem | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResult(null);
    await loadPdfPages(selected);
  };

  const loadPdfPages = async (targetFile: File) => {
    setIsLoadingPages(true);
    setLoadingProgress(5);
    try {
      const buffer = await targetFile.arrayBuffer();
      const pdfProxy = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      const count = pdfProxy.numPages;

      const loadedPages: PageCardItem[] = [];

      for (let p = 1; p <= count; p++) {
        const { canvas, width, height } = await renderPdfPageToCanvas(pdfProxy, p, 0.45);
        const thumbUrl = canvas.toDataURL('image/jpeg', 0.65);

        loadedPages.push({
          id: `${p}-${Math.random().toString(36).substring(2)}`,
          originalIndex: p - 1,
          displayNumber: p,
          rotation: 0,
          thumbnailUrl: thumbUrl,
          width,
          height,
        });

        setLoadingProgress(Math.round((p / count) * 95));
      }

      setPages(loadedPages);
      setLoadingProgress(100);
      toast({
        type: 'success',
        title: 'Pages Loaded',
        description: `Loaded ${count} pages for visual reorganization.`,
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to load PDF',
        description: err.message || 'Could not parse document pages.',
      });
    } finally {
      setIsLoadingPages(false);
    }
  };

  // Reorder pages
  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    const updated = [...pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPages(updated);
  };

  // Rotate individual page
  const rotatePage = (index: number) => {
    const updated = [...pages];
    updated[index].rotation = (updated[index].rotation + 90) % 360;
    setPages(updated);
  };

  // Duplicate page
  const duplicatePage = (index: number) => {
    const target = pages[index];
    const newPage: PageCardItem = {
      ...target,
      id: `${target.originalIndex}-${Math.random().toString(36).substring(2)}`,
    };
    const updated = [...pages];
    updated.splice(index + 1, 0, newPage);
    setPages(updated);
    toast({
      type: 'info',
      title: 'Page Duplicated',
      description: `Copied page ${index + 1}`,
    });
  };

  // Delete page
  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      toast({
        type: 'warning',
        title: 'Cannot delete',
        description: 'Document must contain at least 1 page.',
      });
      return;
    }
    const updated = pages.filter((_, i) => i !== index);
    setPages(updated);
  };

  // Global batch rotation
  const rotateAllPages = () => {
    const updated = pages.map((p) => ({
      ...p,
      rotation: (p.rotation + 90) % 360,
    }));
    setPages(updated);
  };

  // Reverse page order
  const reversePages = () => {
    setPages([...pages].reverse());
  };

  // Reset order
  const resetPages = () => {
    if (file) {
      loadPdfPages(file);
    }
  };

  // Execute and Save Reorganized PDF
  const handleSaveOrganizedPdf = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);

    try {
      const actions = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const res = await organizePdf(file, actions);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'pdf-organize',
          toolName: 'Organize PDF Pages',
          inputFilename: file.name,
          originalSize: file.size,
          outputFilename: res.outputFilename,
          outputSize: res.outputSize,
          timestamp: Date.now(),
          status: 'success',
          hasRetainedOutput: true,
        });
        await saveOutput(id, res.outputBlob, res.outputFilename);

        toast({
          type: 'success',
          title: 'PDF Reorganized Successfully',
          description: `Compiled ${pages.length} pages in new custom order.`,
        });
      }
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Reorganization Failed',
        description: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <ToolHeader
        icon={<Layers className="w-6 h-6 text-electric-blue" />}
        name="Organize & Rearrange PDF Pages"
        description="Visually reorder, rotate, duplicate, or remove pages from any PDF document with live visual thumbnails."
        category="PDF Clinic"
        categoryRoute="/pdf"
        categoryColor="#FF788C"
        privacyLevel="local"
        formats={['.pdf']}
      />

      {!file && (
        <Card padding="md">
          <FileUploadZone
            accept=".pdf"
            onFiles={handleFileSelect}
            label="Upload PDF to organize pages"
            description="Drag & drop your document to view interactive page cards"
          />
        </Card>
      )}

      {/* Loading PDF Pages Progress */}
      {isLoadingPages && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-white">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-electric-blue" />
              Rendering page thumbnails in browser...
            </span>
            <span className="font-mono text-electric-blue">{loadingProgress}%</span>
          </div>
          <ProgressBar value={loadingProgress} />
        </Card>
      )}

      {/* Interactive Page Organization Grid */}
      {file && !isLoadingPages && pages.length > 0 && !result && (
        <div className="space-y-6">
          <Card padding="md" className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-main-white font-heading">
                    {file.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-electric-blue/15 text-electric-blue text-xs font-semibold border border-electric-blue/30">
                    {pages.length} Pages
                  </span>
                </div>
                <p className="text-xs text-muted-white mt-0.5">
                  Original: {formatFileSize(file.size)} · Use arrows to reorder, or rotate and duplicate cards.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCw className="w-3.5 h-3.5 text-arctic-mint" />}
                  onClick={rotateAllPages}
                >
                  Rotate All 90°
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5 text-amber" />}
                  onClick={reversePages}
                >
                  Reverse Order
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetPages}
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((p, index) => (
                <div
                  key={p.id}
                  className="group relative rounded-xl bg-elevated-navy border border-border-color flex flex-col p-2.5 space-y-2 hover:border-electric-blue/60 transition-all shadow-sm"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-black/40 flex items-center justify-center border border-border-color/30">
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${index + 1}`}
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="max-h-full max-w-full object-contain transition-transform duration-200"
                    />

                    {/* Page Number Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                      #{index + 1}
                    </div>

                    {/* Rotation indicator if rotated */}
                    {p.rotation !== 0 && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-arctic-mint/90 text-ink-navy text-[9px] font-bold">
                        {p.rotation}°
                      </div>
                    )}

                    {/* Quick View Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewPage(p)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                      title="Enlarge Preview"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Card Controls */}
                  <div className="flex items-center justify-between text-xs text-muted-white pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => movePage(index, index - 1)}
                        className="p-1.5 rounded bg-surface-navy border border-border-color text-main-white hover:bg-border-color/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move Page Backward"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === pages.length - 1}
                        onClick={() => movePage(index, index + 1)}
                        className="p-1.5 rounded bg-surface-navy border border-border-color text-main-white hover:bg-border-color/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move Page Forward"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => rotatePage(index)}
                        className="p-1.5 rounded bg-surface-navy border border-border-color text-arctic-mint hover:bg-arctic-mint/20 cursor-pointer"
                        title="Rotate Page 90° Clockwise"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicatePage(index)}
                        className="p-1.5 rounded bg-surface-navy border border-border-color text-electric-blue hover:bg-electric-blue/20 cursor-pointer"
                        title="Duplicate Page"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePage(index)}
                        className="p-1.5 rounded bg-surface-navy border border-border-color text-coral hover:bg-coral/20 cursor-pointer"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Execute Button */}
            <div className="pt-4 border-t border-border-color flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setFile(null);
                  setPages([]);
                  setResult(null);
                }}
              >
                Choose Different PDF
              </Button>

              <Button
                size="lg"
                loading={isProcessing}
                icon={<Download className="w-4 h-4" />}
                onClick={handleSaveOrganizedPdf}
              >
                {isProcessing ? 'Compiling Reorganized PDF...' : `Export Reorganized PDF (${pages.length} Pages)`}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Result Panel */}
      {result && result.success && (
        <ResultPanel
          originalSize={result.originalSize}
          outputSize={result.outputSize || 0}
          outputFilename={result.outputFilename || 'organized.pdf'}
          processingTime={result.processingTime}
          onDownload={() => {
            if (result.outputBlob && result.outputFilename) {
              downloadBlob(result.outputBlob, result.outputFilename);
            }
          }}
          onProcessAnother={() => {
            setFile(null);
            setPages([]);
            setResult(null);
          }}
        />
      )}

      {/* Modal Preview */}
      {previewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewPage(null)}>
          <div className="relative max-w-2xl w-full bg-deep-navy border border-border-color rounded-2xl p-4 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-main-white">Previewing Page #{previewPage.displayNumber}</h4>
              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="px-2.5 py-1 rounded-lg bg-elevated-navy text-muted-white hover:text-main-white text-xs"
              >
                Close
              </button>
            </div>
            <div className="flex items-center justify-center bg-black/50 rounded-xl p-4 max-h-[70vh]">
              <img
                src={previewPage.thumbnailUrl}
                alt={`Page ${previewPage.displayNumber}`}
                style={{ transform: `rotate(${previewPage.rotation}deg)` }}
                className="max-h-[60vh] max-w-full object-contain shadow-2xl rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
