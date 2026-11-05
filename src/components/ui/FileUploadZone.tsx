import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File as FileIcon, Camera } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { formatFileSize } from '@/services/fileService';
import { CameraCaptureModal } from '@/components/shared/CameraCaptureModal';

interface FileUploadZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  label?: string;
  description?: string;
  files?: File[];
  onRemoveFile?: (index: number) => void;
  allowCamera?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFiles,
  accept,
  multiple = false,
  maxSize,
  label = 'Drop files here or click to browse',
  description,
  files = [],
  onRemoveFile,
  allowCamera = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) {
        onFiles(multiple ? dropped : [dropped[0]]);
      }
    },
    [onFiles, multiple]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) {
        onFiles(selected);
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFiles]
  );

  const handleCameraCapture = async (capturedFile: File) => {
    const isPdfExpected = accept && accept.toLowerCase().includes('pdf') && !accept.toLowerCase().includes('image');

    if (isPdfExpected) {
      try {
        const pdfDoc = await PDFDocument.create();
        const imgBytes = new Uint8Array(await capturedFile.arrayBuffer());
        const img = await pdfDoc.embedJpg(imgBytes);
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        const pdfBytes = await pdfDoc.save();
        const pdfFile = new File(
          [pdfBytes as unknown as BlobPart],
          `camera_scan_${Date.now()}.pdf`,
          { type: 'application/pdf' }
        );
        onFiles(multiple ? [...files, pdfFile] : [pdfFile]);
        return;
      } catch (err) {
        console.warn('Auto image-to-PDF conversion fallback:', err);
      }
    }

    onFiles(multiple ? [...files, capturedFile] : [capturedFile]);
  };

  return (
    <div className="space-y-3">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: isDragging ? '#496BFF' : '#2A3953',
          backgroundColor: isDragging ? 'rgba(73, 107, 255, 0.05)' : 'transparent',
        }}
        className="relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-electric-blue/50 hover:bg-electric-blue/5"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <motion.div
          animate={{ y: isDragging ? -4 : 0 }}
          className="w-12 h-12 rounded-xl bg-electric-blue/10 flex items-center justify-center"
        >
          <Upload className="w-6 h-6 text-electric-blue" />
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-medium text-main-white">{label}</p>
          {description && <p className="text-xs text-muted-white mt-1">{description}</p>}
          {maxSize && (
            <p className="text-xs text-muted-white mt-1">Max size: {formatFileSize(maxSize)}</p>
          )}
        </div>

        {allowCamera && (
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setCameraModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-semibold hover:border-arctic-mint hover:text-arctic-mint transition-colors cursor-pointer shadow-sm hover:shadow-arctic-mint/20"
            >
              <Camera className="w-3.5 h-3.5 text-arctic-mint" />
              <span>Snap Photo with Camera</span>
            </button>
          </div>
        )}
      </motion.div>

      <CameraCaptureModal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-elevated-navy rounded-lg border border-border-color"
              >
                <FileIcon className="w-4 h-4 text-muted-white flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-main-white truncate">{file.name}</p>
                  <p className="text-xs text-muted-white">{formatFileSize(file.size)}</p>
                </div>
                {onRemoveFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(i);
                    }}
                    className="p-1 rounded hover:bg-coral/10 text-muted-white hover:text-coral transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

