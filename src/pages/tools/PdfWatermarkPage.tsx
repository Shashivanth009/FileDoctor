import React, { useState } from 'react';
import { Stamp } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Input, Slider, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { watermarkPdf } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const PdfWatermarkPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [opacity, setOpacity] = useState<number>(30);
  const [fontSize, setFontSize] = useState<number>(48);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleWatermark = async () => {
    if (!file || !watermarkText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await watermarkPdf(file, watermarkText, opacity / 100, fontSize);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'pdf-watermark',
          toolName: 'PDF Watermark',
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
          title: 'Watermark applied',
          description: `Applied "${watermarkText}" across all pages`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Watermark failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Stamp className="w-6 h-6" />}
        name="PDF Watermark"
        description="Overlay translucent security stamps, draft warnings, or copyright notices diagonally across all pages."
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
            label="Drop PDF to watermark"
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
              label="Watermark Text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="CONFIDENTIAL, DRAFT, PRIVATE..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Slider label="Opacity" value={opacity} min={10} max={90} unit="%" onChange={setOpacity} />
              <Slider label="Font Size" value={fontSize} min={24} max={96} unit=" pt" onChange={setFontSize} />
            </div>

            <Button
              size="lg"
              fullWidth
              loading={isProcessing}
              icon={<Stamp className="w-4 h-4" />}
              onClick={handleWatermark}
            >
              Apply Diagonal Watermark
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

