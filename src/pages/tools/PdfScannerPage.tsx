import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RotateCw,
  Trash2,
  Download,
  Plus,
  Wand2,
  Sparkles,
  FileText,
  Layers,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Check,
  RefreshCw,
  Sliders,
  ShieldCheck,
  SwitchCamera,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolHeader, Button, Card, useToast, ResultPanel } from '@/components/ui';
import {
  ScannedPageItem,
  ScanPoint,
  ScanFilterType,
  getDefaultCorners,
  renderProcessedPage,
  generatePdfFromScannedPages,
} from '@/services/scanService';
import { downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const PdfScannerPage: React.FC = () => {
  const { toast } = useToast();

  // Mode: 'camera' | 'edit-crop' | 'reel' | 'result'
  const [viewMode, setViewMode] = useState<'camera' | 'edit-crop' | 'reel' | 'result'>('camera');
  const [pages, setPages] = useState<ScannedPageItem[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);

  // Active page editing state
  const [activeCorners, setActiveCorners] = useState<[ScanPoint, ScanPoint, ScanPoint, ScanPoint] | null>(null);
  const [draggingCornerIndex, setDraggingCornerIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<ScanFilterType>('magic');
  const [activeRotation, setActiveRotation] = useState<number>(0);

  // PDF Export settings
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [pdfQuality, setPdfQuality] = useState<number>(0.85);
  const [docTitle, setDocTitle] = useState<string>('Scanned_Document');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<ProcessingResult | null>(null);

  // Canvas refs for corner drag overlay
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Start Camera Stream
  const startCamera = useCallback(async (facing: 'environment' | 'user' = cameraFacing) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setHasCamera(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unsupported:', err);
      setHasCamera(false);
      setStreamActive(false);
      toast({
        type: 'info',
        title: 'Camera unavailable',
        description: 'You can upload photos directly from your device using the button below.',
      });
    }
  }, [cameraFacing, toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [viewMode, startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture snapshot from camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Trigger visual shutter flash
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 220);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    processNewCanvas(canvas);
  };

  // Upload photo from disk or gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        processNewCanvas(canvas);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const processNewCanvas = (canvas: HTMLCanvasElement) => {
    const corners = getDefaultCorners(canvas.width, canvas.height);
    const initialProcessed = renderProcessedPage(canvas, corners, 'magic', 0);
    const thumbUrl = initialProcessed.toDataURL('image/jpeg', 0.6);

    const newPage: ScannedPageItem = {
      id: Math.random().toString(36).substring(2),
      originalCanvas: canvas,
      corners,
      filter: 'magic',
      rotation: 0,
      processedCanvas: initialProcessed,
      thumbnailUrl: thumbUrl,
    };

    const nextPages = [...pages, newPage];
    setPages(nextPages);
    setActivePageIndex(nextPages.length - 1);
    setActiveCorners(corners);
    setActiveFilter('magic');
    setActiveRotation(0);
    setViewMode('edit-crop');
  };

  // Apply changes to currently edited page
  const handleSavePageEdits = () => {
    if (pages.length === 0 || !activeCorners) return;
    const page = pages[activePageIndex];
    if (!page) return;

    const processed = renderProcessedPage(
      page.originalCanvas,
      activeCorners,
      activeFilter,
      activeRotation
    );
    const thumbUrl = processed.toDataURL('image/jpeg', 0.6);

    const updatedPages = [...pages];
    updatedPages[activePageIndex] = {
      ...page,
      corners: activeCorners,
      filter: activeFilter,
      rotation: activeRotation,
      processedCanvas: processed,
      thumbnailUrl: thumbUrl,
    };

    setPages(updatedPages);
    setViewMode('reel');
    toast({
      type: 'success',
      title: `Page ${activePageIndex + 1} Enhanced`,
      description: 'Document perspective and filter applied.',
    });
  };

  // Re-render preview canvas during interactive corner / filter adjustments
  const getInteractivePreviewUrl = () => {
    if (pages.length === 0 || !activeCorners) return '';
    const page = pages[activePageIndex];
    if (!page) return '';
    const preview = renderProcessedPage(
      page.originalCanvas,
      activeCorners,
      activeFilter,
      activeRotation
    );
    return preview.toDataURL('image/jpeg', 0.85);
  };

  // Generate Multi-Page PDF
  const handleExportPdf = async () => {
    if (pages.length === 0) return;
    setIsExporting(true);

    try {
      const res = await generatePdfFromScannedPages(pages, {
        pageSize,
        quality: pdfQuality,
        documentTitle: docTitle,
      });

      setExportResult(res);
      setViewMode('result');

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'pdf-scan',
          toolName: 'Camera Document Scanner',
          inputFilename: `${docTitle}.pdf`,
          originalSize: res.originalSize,
          outputFilename: res.outputFilename,
          outputSize: res.outputSize,
          timestamp: Date.now(),
          status: 'success',
          hasRetainedOutput: true,
        });
        await saveOutput(id, res.outputBlob, res.outputFilename);

        toast({
          type: 'success',
          title: 'Document PDF Created!',
          description: `Compiled ${pages.length} scanned pages into a crisp PDF document.`,
        });
      }
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Export Failed',
        description: err.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Move page in reel
  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    const reordered = [...pages];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setPages(reordered);
  };

  // Delete page
  const handleDeletePage = (index: number) => {
    const updated = pages.filter((_, i) => i !== index);
    setPages(updated);
    if (updated.length === 0) {
      setViewMode('camera');
    } else {
      setActivePageIndex(Math.max(0, index - 1));
    }
  };

  // Edit existing page from reel
  const handleEditPage = (index: number) => {
    setActivePageIndex(index);
    const page = pages[index];
    setActiveCorners([...page.corners]);
    setActiveFilter(page.filter);
    setActiveRotation(page.rotation);
    setViewMode('edit-crop');
  };

  // Corner drag logic
  const handlePointerDown = (index: number) => {
    setDraggingCornerIndex(index);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingCornerIndex === null || !activeCorners || !cropContainerRef.current) return;
    const page = pages[activePageIndex];
    if (!page) return;

    const rect = cropContainerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert client coordinates back to canvas pixel coordinates
    const scaleX = page.originalCanvas.width / rect.width;
    const scaleY = page.originalCanvas.height / rect.height;

    const clampedX = Math.max(0, Math.min(page.originalCanvas.width, clientX * scaleX));
    const clampedY = Math.max(0, Math.min(page.originalCanvas.height, clientY * scaleY));

    const nextCorners = [...activeCorners] as [ScanPoint, ScanPoint, ScanPoint, ScanPoint];
    nextCorners[draggingCornerIndex] = { x: clampedX, y: clampedY };
    setActiveCorners(nextCorners);
  };

  const handlePointerUp = () => {
    setDraggingCornerIndex(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <ToolHeader
        icon={<Camera className="w-6 h-6 text-arctic-mint" />}
        name="Camera Document Scanner"
        description="Capture paper documents, receipts, certificates, or IDs with your camera. Auto-perspective warp, shadow-clearing filters, and multi-page PDF compilation."
        category="PDF Clinic"
        categoryRoute="/pdf"
        categoryColor="#FF788C"
        privacyLevel="local"
        formats={['Camera', '.png', '.jpg', '.pdf']}
      />

      {/* Shutter visual flash overlay */}
      <AnimatePresence>
        {shutterFlash && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* MODE 1: LIVE CAMERA VIEWFINDER */}
      {viewMode === 'camera' && (
        <Card padding="none" className="relative overflow-hidden bg-black rounded-2xl border border-border-color shadow-2xl">
          <div className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[70vh] w-full flex items-center justify-center overflow-hidden bg-ink-navy">
            {hasCamera ? (
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-navy border border-border-color flex items-center justify-center mx-auto text-muted-white">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-main-white font-heading">Camera Access Offline</h3>
                  <p className="text-xs text-muted-white mt-1 max-w-sm mx-auto">
                    Take high-resolution photos with your device camera or choose images from your gallery to scan into a PDF.
                  </p>
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-electric-blue text-white font-semibold text-xs cursor-pointer hover:bg-bright-blue transition-colors shadow-lg shadow-electric-blue/20">
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Document Image</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* Viewfinder Overlays & Reticle */}
            {streamActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                {/* Header Status Bar */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-arctic-mint border border-arctic-mint/30 shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Private In-Browser Scanner
                  </span>
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors pointer-events-auto border border-white/20 shadow-lg"
                    title="Switch Camera (Front / Back)"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                </div>

                {/* Alignment Guideline Box */}
                <div className="relative mx-auto w-[82%] h-[72%] border border-white/30 rounded-xl">
                  {/* Glowing Corner Brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-arctic-mint rounded-tl-lg shadow-[0_0_10px_#48DCC7]" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-arctic-mint rounded-tr-lg shadow-[0_0_10px_#48DCC7]" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-arctic-mint rounded-bl-lg shadow-[0_0_10px_#48DCC7]" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-arctic-mint rounded-br-lg shadow-[0_0_10px_#48DCC7]" />
                  
                  {/* Subtle pulsing grid */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>
                </div>

                {/* Hint Bar */}
                <div className="text-center">
                  <span className="px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-xs font-medium">
                    Align document edges within the frame
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Camera Action Bottom Toolbar */}
          <div className="p-4 sm:p-6 bg-surface-navy border-t border-border-color flex items-center justify-between gap-4">
            {/* Gallery Upload Option */}
            <label className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-elevated-navy border border-border-color text-main-white text-xs font-medium hover:bg-elevated-navy/80 cursor-pointer transition-colors shrink-0">
              <ImageIcon className="w-4 h-4 text-arctic-mint" />
              <span className="hidden sm:inline">Choose Photo</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Tactile Capture Shutter Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={!streamActive}
                className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-electric-blue to-arctic-mint p-1 shadow-lg shadow-electric-blue/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Capture Document Page"
              >
                <div className="w-full h-full rounded-full bg-surface-navy flex items-center justify-center border-2 border-white/60 group-hover:bg-transparent transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white group-hover:scale-90 transition-transform" />
                </div>
              </button>
            </div>

            {/* Scanned Pages Tray Button */}
            {pages.length > 0 ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setViewMode('reel')}
                icon={<Layers className="w-4 h-4 text-electric-blue" />}
              >
                View Scans ({pages.length})
              </Button>
            ) : (
              <div className="w-24 shrink-0" />
            )}
          </div>
        </Card>
      )}

      {/* MODE 2: INTERACTIVE CORNER CROP & FILTER ENHANCER */}
      {viewMode === 'edit-crop' && pages[activePageIndex] && activeCorners && (
        <Card padding="md" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-color pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-electric-blue/15 text-electric-blue font-semibold text-xs border border-electric-blue/30">
                  Page {activePageIndex + 1} of {pages.length}
                </span>
                <h3 className="text-base font-bold text-main-white font-heading">
                  Perspective Crop & Filter Clinic
                </h3>
              </div>
              <p className="text-xs text-muted-white mt-0.5">
                Drag the 4 corner handles to align document boundaries, then select an enhancement filter.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => {
                  const page = pages[activePageIndex];
                  setActiveCorners(getDefaultCorners(page.originalCanvas.width, page.originalCanvas.height));
                }}
              >
                Reset Corners
              </Button>
              <Button
                size="sm"
                icon={<Check className="w-3.5 h-3.5" />}
                onClick={handleSavePageEdits}
              >
                Confirm Page
              </Button>
            </div>
          </div>

          {/* Interactive Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: Interactive 4-Point Quad Crop Canvas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-main-white">
                <span>1. Drag Corner Pins to Align Paper</span>
                <span className="text-[11px] text-arctic-mint font-normal">Active homography perspective</span>
              </div>

              <div
                ref={cropContainerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black select-none touch-none border border-border-color shadow-inner cursor-crosshair"
              >
                {/* Background Original Canvas Snapshot */}
                <img
                  src={pages[activePageIndex].originalCanvas.toDataURL()}
                  alt="Original Capture"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* SVG Polygon Overlay showing quadrilateral boundary */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {(() => {
                    const rect = cropContainerRef.current?.getBoundingClientRect();
                    const page = pages[activePageIndex];
                    if (!rect || !page) return null;

                    const sx = rect.width / page.originalCanvas.width;
                    const sy = rect.height / page.originalCanvas.height;

                    const pts = activeCorners.map((p) => `${p.x * sx},${p.y * sy}`).join(' ');

                    return (
                      <>
                        <polygon
                          points={pts}
                          fill="rgba(73, 107, 255, 0.18)"
                          stroke="#48DCC7"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                        />
                      </>
                    );
                  })()}
                </svg>

                {/* 4 Draggable Corner Handles */}
                {activeCorners.map((corner, idx) => {
                  const rect = cropContainerRef.current?.getBoundingClientRect();
                  const page = pages[activePageIndex];
                  if (!rect || !page) return null;

                  const sx = rect.width / page.originalCanvas.width;
                  const sy = rect.height / page.originalCanvas.height;
                  const left = corner.x * sx;
                  const top = corner.y * sy;

                  return (
                    <div
                      key={idx}
                      onPointerDown={() => handlePointerDown(idx)}
                      style={{ transform: `translate(${left - 16}px, ${top - 16}px)` }}
                      className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
                    >
                      <div className="w-6 h-6 rounded-full bg-arctic-mint border-2 border-white shadow-[0_0_12px_#48DCC7] flex items-center justify-center transition-transform hover:scale-125">
                        <div className="w-2 h-2 rounded-full bg-ink-navy" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Real-time Rectified & Filtered Document Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-main-white">
                <span>2. Live Rectified Document Preview</span>
                <button
                  type="button"
                  onClick={() => setActiveRotation((r) => (r + 90) % 360)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated-navy border border-border-color text-main-white hover:bg-elevated-navy/80 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-electric-blue" />
                  Rotate 90°
                </button>
              </div>

              {/* Flattened Document Preview Container */}
              <div className="relative aspect-[3/4] max-h-[380px] w-full rounded-xl overflow-hidden bg-elevated-navy border border-border-color flex items-center justify-center p-3 shadow-inner">
                <img
                  src={getInteractivePreviewUrl()}
                  alt="Flattened Scan Preview"
                  className="max-h-full max-w-full object-contain rounded shadow-lg border border-border-color/40"
                />
              </div>

              {/* Filters Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-main-white flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-electric-blue" />
                  Scanner Enhancement Filter
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'magic', label: 'Magic Color', icon: Sparkles, desc: 'Auto-clean paper' },
                    { id: 'bw', label: 'B&W Document', icon: FileText, desc: 'Crisp black & white' },
                    { id: 'grayscale', label: 'Grayscale', icon: Sliders, desc: 'Smooth gray tones' },
                    { id: 'photo', label: 'Vibrant Photo', icon: ImageIcon, desc: 'Enhanced contrast' },
                    { id: 'original', label: 'Original', icon: Camera, desc: 'Raw camera image' },
                  ].map((f) => {
                    const Icon = f.icon;
                    const isSelected = activeFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setActiveFilter(f.id as ScanFilterType)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-electric-blue/15 border-electric-blue text-main-white shadow-md shadow-electric-blue/10 ring-1 ring-electric-blue/30'
                            : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white hover:bg-elevated-navy/80'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-electric-blue' : 'text-muted-white'}`} />
                          <span className="text-xs font-bold truncate">{f.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-white/80 truncate">{f.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <Button
                  size="lg"
                  fullWidth
                  icon={<Check className="w-4 h-4" />}
                  onClick={handleSavePageEdits}
                >
                  Save & Add to Document
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setViewMode('reel')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* MODE 3: MULTI-PAGE DOCUMENT REEL & PDF COMPILATION */}
      {viewMode === 'reel' && (
        <div className="space-y-6">
          <Card padding="md" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-main-white font-heading">
                    Document Reel ({pages.length} {pages.length === 1 ? 'Page' : 'Pages'})
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-arctic-mint/15 text-arctic-mint font-semibold text-xs border border-arctic-mint/30">
                    Ready to Compile
                  </span>
                </div>
                <p className="text-xs text-muted-white mt-1">
                  Reorder, re-crop, or add more pages before generating your final PDF.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Camera className="w-4 h-4 text-arctic-mint" />}
                  onClick={() => setViewMode('camera')}
                >
                  Scan Next Page
                </Button>
                <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-elevated-navy border border-border-color text-main-white text-xs font-semibold hover:bg-elevated-navy/80 transition-colors cursor-pointer shrink-0">
                  <Plus className="w-4 h-4 text-electric-blue" />
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Scanned Pages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className="group relative rounded-xl bg-elevated-navy border border-border-color overflow-hidden flex flex-col p-2.5 space-y-2 hover:border-electric-blue/50 transition-all shadow-sm"
                >
                  {/* Thumbnail Preview */}
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-black/40 flex items-center justify-center border border-border-color/30">
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${index + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />

                    {/* Page Index Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                      Page {index + 1}
                    </div>

                    {/* Hover Quick Edit Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditPage(index)}
                        className="p-2 rounded-lg bg-electric-blue text-white hover:bg-bright-blue transition-colors cursor-pointer shadow-md"
                        title="Re-crop or change filter"
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePage(index)}
                        className="p-2 rounded-lg bg-coral/90 text-white hover:bg-coral transition-colors cursor-pointer shadow-md"
                        title="Delete Page"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Reorder and Action Buttons */}
                  <div className="flex items-center justify-between text-xs text-muted-white pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMovePage(index, index - 1)}
                        className="p-1.5 rounded bg-surface-navy border border-border-color text-main-white hover:bg-border-color/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === pages.length - 1}
                        onClick={() => handleMovePage(index, index + 1)}
                        className="p-1.5 rounded bg-surface-navy border border-border-color text-main-white hover:bg-border-color/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-[10px] uppercase font-mono text-arctic-mint font-medium">
                      {page.filter}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Compilation Settings Panel */}
            <div className="p-5 rounded-2xl bg-surface-navy border border-border-color space-y-4">
              <h4 className="text-sm font-bold text-main-white font-heading flex items-center gap-2">
                <FileText className="w-4 h-4 text-electric-blue" />
                PDF Document Compilation Options
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-main-white block mb-1.5">Document Name</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Document Title"
                    className="w-full px-3 py-2 rounded-xl bg-elevated-navy border border-border-color text-main-white text-xs focus-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-main-white block mb-1.5">Page Format</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-elevated-navy border border-border-color text-main-white text-xs focus-ring cursor-pointer"
                  >
                    <option value="a4">Standard A4 (595 × 842 pt)</option>
                    <option value="letter">US Letter (612 × 792 pt)</option>
                    <option value="fit">Fit to Document Aspect Ratio</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-main-white block mb-1.5">Quality / Compression</label>
                  <select
                    value={pdfQuality}
                    onChange={(e) => setPdfQuality(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-elevated-navy border border-border-color text-main-white text-xs focus-ring cursor-pointer"
                  >
                    <option value="0.92">Studio High-Fidelity (300 DPI feel)</option>
                    <option value="0.82">Balanced Crisp (Recommended)</option>
                    <option value="0.68">Compact Size (Email friendly)</option>
                  </select>
                </div>
              </div>

              {/* Generate PDF CTA */}
              <div className="pt-2">
                <Button
                  size="lg"
                  fullWidth
                  loading={isExporting}
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleExportPdf}
                >
                  {isExporting ? 'Compiling Multi-Page PDF in Browser...' : `Generate PDF (${pages.length} Pages)`}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODE 4: RESULT PANEL */}
      {viewMode === 'result' && exportResult && exportResult.success && (
        <div className="space-y-6">
          <ResultPanel
            originalSize={exportResult.originalSize}
            outputSize={exportResult.outputSize || 0}
            outputFilename={exportResult.outputFilename || 'Scanned_Document.pdf'}
            processingTime={exportResult.processingTime}
            onDownload={() => {
              if (exportResult.outputBlob && exportResult.outputFilename) {
                downloadBlob(exportResult.outputBlob, exportResult.outputFilename);
              }
            }}
            onProcessAnother={() => {
              setPages([]);
              setExportResult(null);
              setViewMode('camera');
            }}
          />

          <Card padding="md" className="space-y-3">
            <h4 className="text-sm font-bold text-main-white">Export Options</h4>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                icon={<Layers className="w-4 h-4 text-electric-blue" />}
                onClick={() => setViewMode('reel')}
              >
                Back to Document Reel
              </Button>
              <Button
                variant="secondary"
                icon={<Camera className="w-4 h-4 text-arctic-mint" />}
                onClick={() => setViewMode('camera')}
              >
                Scan More Pages
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
