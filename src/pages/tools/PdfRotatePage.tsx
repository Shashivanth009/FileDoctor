import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { rotatePdf } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const PdfRotatePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleRotate = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await rotatePdf(file, angle);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'pdf-rotate',
          toolName: 'Rotate PDF',
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
          title: 'PDF rotated successfully',
          description: `Rotated by ${angle}°`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Rotate failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<RotateCw className="w-6 h-6" />}
        name="Rotate PDF"
        description="Permanently change orientation of PDF pages (90°, 180°, or 270°)."
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
            label="Drop PDF to rotate"
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
            <label className="text-xs font-semibold text-muted-white">Rotation Angle</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '90° Clockwise', val: 90 },
                { label: '180° Upside Down', val: 180 },
                { label: '270° Counter-Clockwise', val: 270 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setAngle(item.val)}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    angle === item.val
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Button
              size="lg"
              fullWidth
              loading={isProcessing}
              icon={<RotateCw className="w-4 h-4" />}
              onClick={handleRotate}
            >
              Rotate All Pages ({angle}°)
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

