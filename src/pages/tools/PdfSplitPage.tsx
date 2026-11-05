import React, { useState } from 'react';
import { Scissors } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Input, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { splitPdf } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const PdfSplitPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rangeInput, setRangeInput] = useState<string>('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const parseRanges = (str: string): number[] => {
    const pages = new Set<number>();
    const parts = str.split(',').map((s) => s.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
            if (p > 0) pages.add(p);
          }
        }
      } else {
        const num = Number(part);
        if (!isNaN(num) && num > 0) pages.add(num);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file) return;
    const pages = parseRanges(rangeInput);
    if (pages.length === 0) {
      toast({ type: 'warning', title: 'Invalid range', description: 'Please enter page numbers like 1, 2-4' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await splitPdf(file, pages);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'pdf-split',
          toolName: 'Split PDF',
          inputFilename: file.name,
          originalSize: file.size,
          outputFilename: res.outputFilename,
          outputSize: res.outputSize,
          timestamp: Date.now(),
          status: 'success',
          hasRetainedOutput: true,
          settings: { pages: rangeInput },
        });
        await saveOutput(id, res.outputBlob, res.outputFilename);

        toast({
          type: 'success',
          title: 'PDF split successfully',
          description: `Extracted ${pages.length} pages`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Split failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Scissors className="w-6 h-6" />}
        name="Split PDF"
        description="Extract specific pages or page ranges from your document with zero server uploads."
        category="PDF Clinic"
        categoryRoute="/pdf"
        categoryColor="#FF788C"
        formats={['.pdf', 'application/pdf']}
        privacyLevel="local"
      />

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="application/pdf"
            onFiles={(files) => setFile(files[0] || null)}
            label="Drop a PDF to split"
            description="Extract pages, split chapters, or export individual sheets"
          />
        </Card>
      ) : (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-color">
            <div>
              <p className="text-sm font-semibold text-main-white">{file.name}</p>
              <p className="text-xs text-muted-white">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }}>
              Change file
            </Button>
          </div>

          <div className="space-y-4">
            <Input
              label="Page numbers and ranges (e.g. 1, 3-5, 8)"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="e.g. 1, 2-4, 7"
              helperText="Separate multiple pages with commas, or ranges with hyphens."
            />

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-muted-white py-1">Quick examples:</span>
              {['1', '1-2', '1-5', '2, 4, 6'].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setRangeInput(ex)}
                  className="px-2.5 py-1 rounded-lg bg-elevated-navy border border-border-color text-muted-white hover:text-main-white cursor-pointer font-mono"
                >
                  {ex}
                </button>
              ))}
            </div>

            <Button
              size="lg"
              fullWidth
              loading={isProcessing}
              icon={<Scissors className="w-4 h-4" />}
              onClick={handleSplit}
            >
              Split and Extract Pages
            </Button>
          </div>
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
            setFile(null);
            setResult(null);
          }}
        />
      )}
    </div>
  );
};

