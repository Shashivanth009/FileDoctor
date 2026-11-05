import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, SwitchCamera, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (capturedFile: File) => void;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  open,
  onClose,
  onCapture,
  title = 'Capture Photo from Camera',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);
  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((t) => t.stop());
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
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setStreamActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  }, []);

  useEffect(() => {
    if (open && !capturedBlobUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, capturedBlobUrl, startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0) return;

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedBlobUrl(url);
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `camera_snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
    }
    setCapturedBlobUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-surface-navy border border-border-color rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Shutter visual flash overlay */}
        <AnimatePresence>
          {shutterFlash && (
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Modal Header */}
        <div className="p-4 border-b border-border-color flex items-center justify-between bg-deep-navy">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-arctic-mint/15 text-arctic-mint flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-main-white font-heading">{title}</h3>
              <p className="text-[11px] text-muted-white">100% private in-browser camera snapshot</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-lg text-muted-white hover:text-main-white hover:bg-surface-navy transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Captured Photo Area */}
        <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center overflow-hidden">
          {capturedBlobUrl ? (
            <img src={capturedBlobUrl} alt="Captured preview" className="w-full h-full object-contain" />
          ) : (
            <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
          )}

          {/* Guidelines when live stream is active */}
          {streamActive && !capturedBlobUrl && (
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-arctic-mint font-semibold border border-arctic-mint/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Live Camera Active
                </span>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors pointer-events-auto border border-white/20 cursor-pointer"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>

              {/* Center reticle */}
              <div className="relative mx-auto w-[75%] h-[75%] border border-white/25 rounded-xl pointer-events-none">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-arctic-mint" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-arctic-mint" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-arctic-mint" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-arctic-mint" />
              </div>

              <div className="text-center">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px]">
                  Frame object and tap Shutter to capture
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-deep-navy border-t border-border-color flex items-center justify-between gap-3">
          {capturedBlobUrl ? (
            <>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={handleReset}>
                Retake Photo
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => { handleReset(); onClose(); }}>
                  Cancel
                </Button>
                <Button size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={handleConfirm}>
                  Use This Photo
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-white">Hold steady for crisp resolution</span>
              <button
                type="button"
                onClick={handleSnap}
                disabled={!streamActive}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-electric-blue to-arctic-mint p-1 shadow-lg shadow-electric-blue/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-40"
                title="Capture Photo"
              >
                <div className="w-full h-full rounded-full bg-surface-navy flex items-center justify-center border-2 border-white/60">
                  <div className="w-8 h-8 rounded-full bg-white" />
                </div>
              </button>
              <Button variant="secondary" size="sm" onClick={() => { handleReset(); onClose(); }}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

