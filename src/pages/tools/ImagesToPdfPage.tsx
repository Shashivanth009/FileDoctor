import React, { useState } from 'react';
import { FileUp, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Select, Slider, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { imagesToPdf } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const ImagesToPdfPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setFiles(updated);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await imagesToPdf(files, { pageSize, orientation, margin });
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'images-to-pdf',
          toolName: 'Images to PDF',
          inputFilename: `${files.length} images`,
          originalSize: res.originalSize,
          outputFilename: res.outputFilename,
          outputSize: res.outputSize,
          timestamp: Date.now(),
          status: 'success',
          hasRetainedOutput: true,
        });
        await saveOutput(id, res.outputBlob, res.outputFilename);

        toast({
          type: 'success',
          title: 'PDF generated successfully',
          description: `Combined ${files.length} images into a PDF document`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Conversion failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<FileUp className="w-6 h-6" />}
        name="Images to PDF"
        description="Convert photos, screenshots, and scans (PNG, JPEG, WebP) into a high-quality PDF document."
        category="PDF Clinic"
        categoryRoute="/pdf"
        categoryColor="#FF788C"
        formats={['.png', '.jpg', '.jpeg', '.webp']}
        privacyLevel="local"
      />

      <Card padding="lg">
        <FileUploadZone
          accept="image/*"
          multiple
          onFiles={handleFiles}
          label="Drop images here or click to browse"
          description="Supports PNG, JPG, JPEG, WebP. Reorder images to set page order."
        />
      </Card>

      {files.length > 0 && (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <h3 className="text-sm font-semibold text-main-white">Selected Images ({files.length})</h3>
            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>Clear</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Page Size"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as any)}
              options={[
                { value: 'a4', label: 'A4 Standard (595 x 842 pt)' },
                { value: 'letter', label: 'US Letter (612 x 792 pt)' },
                { value: 'fit', label: 'Fit to Image dimensions' },
              ]}
            />
            <Select
              label="Page Orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              options={[
                { value: 'portrait', label: 'Portrait' },
                { value: 'landscape', label: 'Landscape' },
              ]}
            />
          </div>

          <Slider
            label="Page Margins"
            value={margin}
            min={0}
            max={60}
            unit=" pt"
            onChange={setMargin}
          />

          {/* List of images */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-elevated-navy border border-border-color text-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="w-5 h-5 rounded-full bg-surface-navy text-muted-white font-mono flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-main-white truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveFile(idx, 'up')}
                    className="p-1 hover:bg-surface-navy rounded text-muted-white disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === files.length - 1}
                    onClick={() => moveFile(idx, 'down')}
                    className="p-1 hover:bg-surface-navy rounded text-muted-white disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 hover:bg-coral/10 rounded text-muted-white hover:text-coral"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<FileUp className="w-4 h-4" />}
            onClick={handleConvert}
          >
            Generate PDF Document
          </Button>
        </Card>
      )}

      {isProcessing && <ProgressBar value={50} indeterminate />}

      {result && result.success && result.outputBlob && result.outputFilename && (
        <ResultPanel
          originalSize={result.originalSize}
          outputSize={result.outputSize || 0}
          outputFilename={result.outputFilename}
          processingTime={result.processingTime}
          onDownload={() => downloadBlob(result.outputBlob!, result.outputFilename!)}
          onProcessAnother={() => {
            setFiles([]);
            setResult(null);
          }}
        />
      )}
    </div>
  );
};

