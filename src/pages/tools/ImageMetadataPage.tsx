import React, { useState } from 'react';
import { ShieldOff, ShieldCheck, CheckCircle } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { removeImageMetadata } from '@/services/imageService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const ImageMetadataPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleClean = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await removeImageMetadata(file);
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'image-metadata',
          toolName: 'Metadata Remover',
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
          title: 'EXIF metadata stripped',
          description: 'GPS, device headers, and timestamps scrubbed clean.',
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Sanitization failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<ShieldOff className="w-6 h-6" />}
        name="Metadata Remover"
        description="Permanently strip EXIF tags, GPS coordinates, device serials, camera models, and timestamps from photos before publishing."
        category="Image Studio"
        categoryRoute="/image"
        categoryColor="#48DCC7"
        formats={['.png', '.jpg', '.jpeg', '.webp']}
        privacyLevel="local"
      />

      <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-start gap-3 text-xs text-success">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Zero-Trace Privacy: </span>
          Photos taken on modern smartphones store exact GPS latitude/longitude, lens information, and unique hardware IDs.
          FileDoctor decodes raw pixel data onto a sterile browser canvas and re-encodes a 100% metadata-free image.
        </div>
      </div>

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="image/*"
            onFiles={(files) => setFile(files[0] || null)}
            label="Drop photo to sanitize"
            description="Removes location and personal information"
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

          <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-2 text-xs">
            <p className="font-semibold text-main-white">Targeted Metadata for Removal:</p>
            <ul className="grid grid-cols-2 gap-2 text-muted-white">
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> GPS Coordinates (Lat/Long/Altitude)</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> Device Model & Manufacturer</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> Camera Serial Number & Lens ID</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> Timestamp & Timezone Offset</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> Photoshop & Software History</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> Embedded Thumbnails</li>
            </ul>
          </div>

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<ShieldOff className="w-4 h-4" />}
            onClick={handleClean}
          >
            Strip All Metadata & Sanitize Photo
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
          warnings={result.warnings}
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

