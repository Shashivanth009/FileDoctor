import React, { useState } from 'react';
import { Merge, ArrowUp, ArrowDown, Trash2, Download, CheckCircle } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { mergePdfs } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const PdfMergePage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
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

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({ type: 'warning', title: 'At least 2 PDF files are required to merge' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await mergePdfs(files);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'pdf-merge',
          toolName: 'Merge PDFs',
          inputFilename: `${files.length} PDF documents`,
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
          title: 'PDFs merged successfully',
          description: `Created ${res.outputFilename} (${formatFileSize(res.outputSize || 0)})`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Merge failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Merge className="w-6 h-6" />}
        name="Merge PDFs"
        description="Combine multiple PDF documents into a single unified file. Reorder pages and files seamlessly inside your browser."
        category="PDF Clinic"
        categoryRoute="/pdf"
        categoryColor="#FF788C"
        formats={['.pdf', 'application/pdf']}
        privacyLevel="local"
      />

      <Card padding="lg">
        <FileUploadZone
          accept="application/pdf"
          multiple
          onFiles={handleFiles}
          label="Drop multiple PDF files here or browse"
          description="Drag to arrange order before merging. 100% processed locally."
        />
      </Card>

      {files.length > 0 && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <h3 className="text-sm font-semibold text-main-white">
              Documents to Combine ({files.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
              Clear all
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl bg-elevated-navy border border-border-color text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-surface-navy text-muted-white font-mono flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="text-main-white font-medium truncate">{file.name}</p>
                    <p className="text-muted-white text-[11px]">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveFile(idx, 'up')}
                    className="p-1 rounded hover:bg-surface-navy text-muted-white disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === files.length - 1}
                    onClick={() => moveFile(idx, 'down')}
                    className="p-1 rounded hover:bg-surface-navy text-muted-white disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 rounded hover:bg-coral/10 text-muted-white hover:text-coral cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            disabled={files.length < 2}
            icon={<Merge className="w-4 h-4" />}
            onClick={handleMerge}
          >
            {files.length < 2 ? 'Add at least 2 PDFs to Merge' : `Merge ${files.length} PDFs into One`}
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

