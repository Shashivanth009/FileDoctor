import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Type, Upload as UploadIcon, Trash2, CheckCircle, Info } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Input, Select, Slider, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import { signPdf } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const PdfSignerPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sigType, setSigType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState<string>('');
  const [uploadedSigUrl, setUploadedSigUrl] = useState<string>('');

  // Signature placement settings
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [xPosPct, setXPosPct] = useState<number>(65); // 0 to 100%
  const [yPosPct, setYPosPct] = useState<number>(80); // 0 to 100%
  const [widthPct, setWidthPct] = useState<number>(25); // 10 to 50%

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  // Drawing canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#10172A';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getSignatureDataUrl = (): string | null => {
    if (sigType === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    } else if (sigType === 'type') {
      if (!typedName.trim()) return null;
      const offscreen = document.createElement('canvas');
      offscreen.width = 400;
      offscreen.height = 150;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return null;
      ctx.font = 'italic bold 42px "Brush Script MT", "Caveat", cursive, sans-serif';
      ctx.fillStyle = '#10172A';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(typedName, 200, 75);
      return offscreen.toDataURL('image/png');
    } else if (sigType === 'upload') {
      return uploadedSigUrl || null;
    }
    return null;
  };

  const handleSign = async () => {
    if (!file) return;
    const sigUrl = getSignatureDataUrl();
    if (!sigUrl) {
      toast({ type: 'warning', title: 'Signature required', description: 'Please draw, type, or upload a signature.' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await signPdf(
        file,
        sigUrl,
        pageIndex,
        xPosPct / 100,
        yPosPct / 100,
        widthPct / 100
      );
      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'pdf-sign',
          toolName: 'Sign PDF',
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
          title: 'Signature placed on PDF',
          description: `Generated ${res.outputFilename}`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Signing failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<PenTool className="w-6 h-6" />}
        name="Sign PDF"
        description="Add visual signatures to contracts, agreements, and forms right from your browser."
        category="PDF Clinic"
        categoryRoute="/pdf"
        categoryColor="#FF788C"
        formats={['.pdf', 'application/pdf']}
        privacyLevel="local"
      />

      {/* Legal & Cryptographic Disclaimer Alert */}
      <div className="p-4 rounded-xl bg-amber/10 border border-amber/25 flex items-start gap-3 text-xs text-amber">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Privacy & Legal Notice: </span>
          Visual signature insertion renders a signature graphic onto document pages.
          This differs from a cryptographic PKI digital certificate (such as Adobe Approved Trust List).
          Your signature data is processed entirely in local memory and never leaves your machine.
        </div>
      </div>

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="application/pdf"
            onFiles={(files) => setFile(files[0] || null)}
            label="Drop PDF document to sign"
            description="Supports agreements, NDAs, invoices, and letterheads"
          />
        </Card>
      ) : (
        <div className="space-y-6">
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

            {/* Signature Creation Method */}
            <div className="space-y-4">
              <div className="flex gap-2">
                {[
                  { id: 'draw', label: 'Draw Signature', icon: PenTool },
                  { id: 'type', label: 'Type Signature', icon: Type },
                  { id: 'upload', label: 'Upload Image', icon: UploadIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSigType(item.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        sigType === item.id
                          ? 'bg-electric-blue text-white border-electric-blue'
                          : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Draw Pad */}
              {sigType === 'draw' && (
                <div className="space-y-2">
                  <div className="border border-border-color rounded-xl bg-white overflow-hidden relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={180}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-44 cursor-crosshair touch-none"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <Button size="sm" variant="secondary" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={clearCanvas}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-white text-center">Use your mouse, trackpad, or finger to draw your signature</p>
                </div>
              )}

              {/* Type Pad */}
              {sigType === 'type' && (
                <div className="space-y-3">
                  <Input
                    label="Type Full Name"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="e.g. Johnathan Doe"
                  />
                  {typedName && (
                    <div className="p-6 rounded-xl bg-white text-ink-navy text-center font-bold text-3xl font-serif italic border border-border-color">
                      {typedName}
                    </div>
                  )}
                </div>
              )}

              {/* Upload Pad */}
              {sigType === 'upload' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => setUploadedSigUrl(reader.result as string);
                        reader.readAsDataURL(f);
                      }
                    }}
                    className="text-xs text-muted-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-electric-blue file:text-white cursor-pointer"
                  />
                  {uploadedSigUrl && (
                    <div className="p-4 bg-white rounded-xl flex items-center justify-center max-h-36">
                      <img src={uploadedSigUrl} alt="Signature Preview" className="max-h-24 object-contain" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Placement Controls */}
            <div className="pt-4 border-t border-border-color space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-white">
                Signature Placement
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Slider label="Horizontal Position (X)" value={xPosPct} min={5} max={85} unit="%" onChange={setXPosPct} />
                <Slider label="Vertical Position (Y)" value={yPosPct} min={5} max={90} unit="%" onChange={setYPosPct} />
                <Slider label="Signature Width" value={widthPct} min={10} max={50} unit="%" onChange={setWidthPct} />
              </div>
            </div>

            <Button
              size="lg"
              fullWidth
              loading={isProcessing}
              icon={<PenTool className="w-4 h-4" />}
              onClick={handleSign}
            >
              Sign PDF & Export
            </Button>
          </Card>

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
      )}
    </div>
  );
};

