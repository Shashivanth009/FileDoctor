import React, { useState } from 'react';
import { FileText, Copy, Download, Check } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, ProgressBar, useToast } from '@/components/ui';
import { extractPdfText } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';

export const PdfToTextPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await extractPdfText(file);
      setExtractedText(res.text);
      setPageCount(res.pageCount);
      toast({
        type: 'success',
        title: 'Text extracted successfully',
        description: `Parsed ${res.pageCount} pages (${res.text.length} characters)`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Extraction failed', description: err.message });
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
    const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'document';
    downloadBlob(blob, `${baseName}_extracted.txt`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<FileText className="w-6 h-6" />}
        name="PDF to Text"
        description="Extract raw readable text content from PDF pages directly in your browser."
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
            onFiles={(files) => { setFile(files[0] || null); setExtractedText(''); }}
            label="Drop PDF to extract text"
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

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<FileText className="w-4 h-4" />}
            onClick={handleExtract}
          >
            Extract Text Content
          </Button>
        </Card>
      )}

      {isProcessing && <ProgressBar value={50} indeterminate />}

      {extractedText && (
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <h3 className="text-sm font-semibold text-main-white">
              Extracted Text ({pageCount} pages, {extractedText.length} characters)
            </h3>
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
            readOnly
            value={extractedText}
            className="w-full h-80 bg-elevated-navy border border-border-color rounded-xl p-4 text-xs font-mono text-main-white outline-none resize-y leading-relaxed"
          />
        </Card>
      )}
    </div>
  );
};

