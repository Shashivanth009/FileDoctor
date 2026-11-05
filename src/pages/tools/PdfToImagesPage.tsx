import React, { useState } from 'react';
import { ImageDown, Download, Check } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Select, ProgressBar, useToast } from '@/components/ui';
import { pdfToImages } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';

export const PdfToImagesPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [scale, setScale] = useState<number>(2.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedImages, setExtractedImages] = useState<{ blob: Blob; pageNumber: number; filename: string }[]>([]);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await pdfToImages(file, format, scale);
      setExtractedImages(res.images);
      toast({
        type: 'success',
        title: 'Pages converted to images',
        description: `Exported ${res.images.length} pages as high-res ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Conversion failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<ImageDown className="w-6 h-6" />}
        name="PDF to Images"
        description="Convert each page of your PDF into crisp PNG, JPEG, or WebP images with custom resolution scaling."
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
            onFiles={(files) => { setFile(files[0] || null); setExtractedImages([]); }}
            label="Drop a PDF to convert into images"
            description="Render pages as high-definition images locally"
          />
        </Card>
      ) : (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-color">
            <div>
              <p className="text-sm font-semibold text-main-white">{file.name}</p>
              <p className="text-xs text-muted-white">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setExtractedImages([]); }}>
              Change file
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Image Format"
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              options={[
                { value: 'png', label: 'PNG (Lossless & transparent)' },
                { value: 'jpeg', label: 'JPEG (Compact file size)' },
                { value: 'webp', label: 'WebP (Next-gen web format)' },
              ]}
            />
            <Select
              label="Render Scale / DPI"
              value={scale.toString()}
              onChange={(e) => setScale(Number(e.target.value))}
              options={[
                { value: '1.0', label: '1.0x (Standard 72 DPI)' },
                { value: '1.5', label: '1.5x (Crisp 108 DPI)' },
                { value: '2.0', label: '2.0x (Retina 144 DPI - Recommended)' },
                { value: '3.0', label: '3.0x (Ultra HD 216 DPI)' },
              ]}
            />
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<ImageDown className="w-4 h-4" />}
            onClick={handleConvert}
          >
            Convert All Pages to Images
          </Button>
        </Card>
      )}

      {isProcessing && <ProgressBar value={50} indeterminate />}

      {extractedImages.length > 0 && (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-main-white font-heading">
              Exported Pages ({extractedImages.length})
            </h3>
            <Button
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => {
                extractedImages.forEach((img) => downloadBlob(img.blob, img.filename));
              }}
            >
              Download All Images
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {extractedImages.map((img) => {
              const url = URL.createObjectURL(img.blob);
              return (
                <div
                  key={img.pageNumber}
                  className="rounded-xl border border-border-color bg-elevated-navy p-2 flex flex-col justify-between group"
                >
                  <div className="aspect-[3/4] bg-surface-navy rounded-lg overflow-hidden flex items-center justify-center mb-2">
                    <img
                      src={url}
                      alt={`Page ${img.pageNumber}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-white font-medium">Page {img.pageNumber}</span>
                    <button
                      type="button"
                      onClick={() => downloadBlob(img.blob, img.filename)}
                      className="p-1 rounded bg-surface-navy hover:bg-electric-blue text-muted-white hover:text-white transition-colors cursor-pointer"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

