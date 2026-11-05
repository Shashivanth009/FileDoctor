import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { flattenPdf } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const PdfFlattenPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleFlatten = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await flattenPdf(file);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'pdf-flatten',
          toolName: 'Flatten PDF',
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
          title: 'PDF flattened successfully',
          description: 'All form fields locked permanently into page graphics',
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Flatten failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Layers className="w-6 h-6" />}
        name="Flatten PDF"
        description="Permanently lock fillable form fields, checkboxes, and annotations into the document canvas."
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
            label="Drop PDF form to flatten"
            description="Locks interactive form entries from being edited"
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

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<Layers className="w-4 h-4" />}
            onClick={handleFlatten}
          >
            Flatten Form Fields & Annotations
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
            setFile(null);
            setResult(null);
          }}
        />
      )}
    </div>
  );
};

