import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, PenTool, Calendar, User, Briefcase } from 'lucide-react';

export interface SignatureData {
  signatureDataUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  dateSigned: string;
}

interface SignaturePadModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SignatureData) => void;
  initialName?: string;
  initialTitle?: string;
}

const PEN_COLORS = [
  { label: 'Navy', value: '#0F172A' },
  { label: 'Royal Blue', value: '#1D4ED8' },
  { label: 'Emerald', value: '#047857' },
  { label: 'Crimson', value: '#B91C1C' },
];

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  open,
  onClose,
  onSave,
  initialName = '',
  initialTitle = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#0F172A');
  const [penWidth, setPenWidth] = useState(3);
  const [signatoryName, setSignatoryName] = useState(initialName);
  const [signatoryTitle, setSignatoryTitle] = useState(initialTitle);
  const [dateSigned, setDateSigned] = useState(
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  useEffect(() => {
    if (open) {
      setSignatoryName(initialName);
      setSignatoryTitle(initialTitle);
      setTimeout(() => {
        clearCanvas();
      }, 50);
    }
  }, [open, initialName, initialTitle, clearCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    let signatureDataUrl = '';
    if (canvas && hasDrawn) {
      try {
        signatureDataUrl = canvas.toDataURL('image/png');
      } catch (err) {
        console.warn('Canvas toDataURL fallback:', err);
      }
    }

    onSave({
      signatureDataUrl,
      signatoryName: signatoryName.trim() || 'Authorized Representative',
      signatoryTitle: signatoryTitle.trim() || 'Verified Signatory',
      dateSigned,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-surface-navy border border-border-color rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-elevated-navy">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-electric-blue/10 flex items-center justify-center text-electric-blue">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-main-white font-heading">
                  Draw Handwritten Signature
                </h3>
                <p className="text-[11px] text-muted-white">
                  Sign directly with mouse, stylus, or fingertip. Vector-embedded.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-white hover:text-main-white hover:bg-surface-navy transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Color & Stroke Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-white">Pen Ink:</span>
                <div className="flex items-center gap-1.5">
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setPenColor(c.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        penColor === c.value ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-white">Thickness:</span>
                <div className="flex items-center gap-1 bg-elevated-navy p-0.5 rounded-lg border border-border-color">
                  {[2, 3.5, 5].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPenWidth(w)}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        penWidth === w ? 'bg-electric-blue text-white font-bold' : 'text-muted-white hover:text-white'
                      }`}
                    >
                      {w === 2 ? 'Fine' : w === 3.5 ? 'Normal' : 'Bold'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Signature Drawing Canvas */}
            <div className="relative rounded-xl border-2 border-dashed border-border-color bg-white overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 touch-none cursor-crosshair block"
              />

              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic select-none">
                  Sign your signature along this line...
                </div>
              )}

              <div className="absolute bottom-6 left-8 right-8 border-b border-slate-300 pointer-events-none" />

              <button
                type="button"
                onClick={clearCanvas}
                className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            {/* Signatory Metadata Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-muted-white mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-electric-blue" />
                  <span>Signatory Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Johnathan Doe"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-elevated-navy border border-border-color text-xs text-main-white focus-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-white mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-arctic-mint" />
                  <span>Title / Role</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Managing Partner / CEO"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-elevated-navy border border-border-color text-xs text-main-white focus-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-white mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber" />
                <span>Signature Date</span>
              </label>
              <input
                type="text"
                value={dateSigned}
                onChange={(e) => setDateSigned(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-elevated-navy border border-border-color text-xs text-main-white focus-ring"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-color bg-elevated-navy">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-white hover:text-main-white hover:bg-surface-navy transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-electric-blue text-white text-xs font-bold hover:bg-electric-blue/90 transition-all shadow-md shadow-electric-blue/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Embed Signature</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

