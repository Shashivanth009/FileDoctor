import React, { useState } from 'react';
import { ScanText, Copy, Download, Check, Sparkles } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Select, ProgressBar, useToast } from '@/components/ui';
import { performOcr } from '@/services/aiService';
import { formatFileSize, downloadBlob } from '@/services/fileService';

export const OcrPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Initializing Tesseract OCR engine...');

    try {
      const res = await performOcr(file, language, (pct, status) => {
        setProgress(pct);
        setStatusMessage(status);
      });

      setExtractedText(res.text);
      setConfidence(res.confidence);

      toast({
        type: 'success',
        title: 'OCR completed successfully',
        description: `Recognized text with ${res.confidence}% confidence`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'OCR failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast({ type: 'success', title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'ocr_result';
    downloadBlob(blob, `${baseName}_ocr.txt`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<ScanText className="w-6 h-6" />}
        name="OCR — Text Recognition"
        description="Extract printed or handwritten text from images, scanned receipts, and book pages using Tesseract.js directly inside your browser."
        category="AI Utilities"
        categoryRoute="/ai"
        categoryColor="#C4B5FD"
        formats={['.png', '.jpg', '.jpeg', '.webp']}
        privacyLevel="local"
      />

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="image/*"
            onFiles={(files) => { setFile(files[0] || null); setExtractedText(''); }}
            label="Drop scanned photo or screenshot for OCR"
          />
        </Card>
      ) : (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-color">
            <div>
              <p className="text-sm font-semibold text-main-white">{file.name}</p>
              <p className="text-xs text-muted-white">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setExtractedText(''); }}>
              Change file
            </Button>
          </div>

          <div className="max-w-xs">
            <Select
              label="Recognition Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={[
                { value: 'eng', label: 'English (Latin script)' },
                { value: 'spa', label: 'Spanish (Español)' },
                { value: 'fra', label: 'French (Français)' },
                { value: 'deu', label: 'German (Deutsch)' },
              ]}
            />
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<ScanText className="w-4 h-4" />}
            onClick={handleOcr}
          >
            Run OCR Character Recognition
          </Button>
        </Card>
      )}

      {isProcessing && (
        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-white">
            <span>{statusMessage || 'Processing OCR in web worker...'}</span>
            <span className="text-indigo-400 font-mono font-medium">{progress}%</span>
          </div>
          <ProgressBar value={progress} color="#C4B5FD" />
        </Card>
      )}

      {extractedText && (
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-main-white">Recognized Text Content</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                {confidence}% Confidence
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleDownload}>
                Download .txt
              </Button>
            </div>
          </div>

          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            className="w-full h-80 bg-elevated-navy border border-border-color rounded-xl p-4 text-xs font-mono text-main-white outline-none resize-y leading-relaxed"
          />
        </Card>
      )}
    </div>
  );
};

