import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Minimize2, AlertTriangle, ShieldCheck, Check, Sparkles, Clock, RefreshCw } from 'lucide-react';
import {
  ToolHeader,
  FileUploadZone,
  Button,
  Card,
  Slider,
  Input,
  Select,
  ProgressBar,
  ResultPanel,
  useToast,
} from '@/components/ui';
import { compressPdf, PdfCompressionOptions } from '@/services/pdfService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import {
  addHistoryEntry,
  saveOutput,
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
  getInput,
} from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const PdfCompressorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'preset' | 'percentage' | 'target-size' | 'advanced'>('preset');

  // Mode A: Presets
  const [preset, setPreset] = useState<'light' | 'balanced' | 'strong' | 'maximum'>('balanced');

  // Mode B: Percentage
  const [percentage, setPercentage] = useState<number>(40);

  // Mode C: Target Size
  const [targetSizeVal, setTargetSizeVal] = useState<number>(1);
  const [targetSizeUnit, setTargetSizeUnit] = useState<'MB' | 'KB'>('MB');

  // Mode D: Advanced
  const [imageQuality, setImageQuality] = useState<number>(75);
  const [scaleFactor, setScaleFactor] = useState<number>(120);
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [rasterize, setRasterize] = useState<boolean>(false);

  // State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Compressing PDF in browser...');
  const [result, setResult] = useState<(ProcessingResult & { strategyUsed: string; targetAchieved?: boolean }) | null>(null);
  const { toast } = useToast();

  const runIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Central compression executor with race-condition protection
  const handleProcessWithOptions = async (
    targetFile: File | null = file,
    override?: Partial<PdfCompressionOptions>
  ) => {
    const activeFile = targetFile || file;
    if (!activeFile) return;

    const currentRunId = ++runIdRef.current;
    setIsProcessing(true);

    const effectiveMode = override?.mode ?? mode;
    const effectivePreset = override?.preset ?? preset;
    const effectivePercentage = override?.reductionPercentage ?? percentage;
    const effectiveTargetSizeKB =
      override?.targetSizeKB ??
      (targetSizeUnit === 'MB' ? targetSizeVal * 1024 : targetSizeVal);
    const effectiveQuality = override?.imageQuality ?? imageQuality / 100;
    const effectiveScale = override?.scaleFactor ?? scaleFactor / 100;
    const effectiveRemoveMeta = override?.removeMetadata ?? removeMetadata;
    const effectiveGrayscale = override?.grayscale ?? grayscale;
    const effectiveRasterize = override?.rasterize ?? rasterize;

    let statusText = 'Compressing PDF in browser...';
    if (effectiveMode === 'preset') {
      statusText = `Applying ${effectivePreset.toUpperCase()} compression preset...`;
    } else if (effectiveMode === 'percentage') {
      statusText = `Compressing to target ${effectivePercentage}% reduction...`;
    } else if (effectiveMode === 'target-size') {
      statusText = `Optimizing PDF to fit ${targetSizeVal} ${targetSizeUnit}...`;
    } else {
      statusText = 'Applying custom advanced parameters...';
    }
    setProcessingStatus(statusText);

    const options: PdfCompressionOptions = {
      mode: effectiveMode,
      preset: effectivePreset,
      reductionPercentage: effectivePercentage,
      targetSizeKB: effectiveTargetSizeKB,
      imageQuality: effectiveQuality,
      scaleFactor: effectiveScale,
      removeMetadata: effectiveRemoveMeta,
      grayscale: effectiveGrayscale,
      rasterize: effectiveRasterize,
    };

    try {
      const res = await compressPdf(activeFile, options);
      if (runIdRef.current !== currentRunId) return;

      setResult(res);

      if (res.success && res.outputBlob) {
        const entryId = Math.random().toString(36).substring(2);
        await addHistoryEntry(
          {
            id: entryId,
            toolId: 'pdf-compress',
            toolName: 'PDF Compressor',
            inputFilename: activeFile.name,
            originalSize: activeFile.size,
            outputFilename: res.outputFilename,
            outputSize: res.outputSize,
            timestamp: Date.now(),
            status: 'success',
            hasRetainedOutput: true,
            hasRetainedInput: true,
            mimeType: activeFile.type || 'application/pdf',
            settings: {
              mode: effectiveMode,
              preset: effectivePreset,
              percentage: effectivePercentage,
              targetSizeVal,
              targetSizeUnit,
            },
          },
          activeFile,
          res.outputBlob
        );

        await saveActiveSession({
          toolId: 'pdf-compress',
          fileBlob: activeFile,
          filename: activeFile.name,
          mimeType: activeFile.type || 'application/pdf',
          lastModified: activeFile.lastModified,
          settings: {
            mode: effectiveMode,
            preset: effectivePreset,
            percentage: effectivePercentage,
            targetSizeVal,
            targetSizeUnit,
            imageQuality,
            scaleFactor,
            removeMetadata: effectiveRemoveMeta,
            grayscale: effectiveGrayscale,
            rasterize: effectiveRasterize,
          },
          result: res,
        });

        const savedBytes = activeFile.size - (res.outputSize || 0);
        const savedPct = ((savedBytes / activeFile.size) * 100).toFixed(1);
        toast({
          type: 'success',
          title: 'PDF compressed',
          description: `${res.strategyUsed} · Saved ${formatFileSize(savedBytes)} (${savedPct}% reduction)`,
        });
      } else {
        toast({
          type: 'error',
          title: 'Compression failed',
          description: res.error || 'Could not compress this document',
        });
      }
    } catch (err: any) {
      if (runIdRef.current !== currentRunId) return;
      toast({
        type: 'error',
        title: 'Error processing PDF',
        description: err.message,
      });
    } finally {
      if (runIdRef.current === currentRunId) {
        setIsProcessing(false);
      }
    }
  };

  // Restore file and state on page load / tab refresh or via ?historyId=...
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const historyId = searchParams.get('historyId');
        if (historyId) {
          const inputItem = await getInput(historyId);
          if (inputItem && isMounted) {
            const restored = new File([inputItem.blob], inputItem.filename, {
              type: inputItem.mimeType || 'application/pdf',
              lastModified: Date.now(),
            });
            setFile(restored);
            toast({
              type: 'info',
              title: 'Document loaded from vault',
              description: `Loaded ${inputItem.filename} for compression.`,
            });
            // Automatically run compression on loaded document
            handleProcessWithOptions(restored, { mode: 'preset', preset: 'balanced' });
            return;
          }
        }

        const session = await getActiveSession('pdf-compress');
        if (session && isMounted) {
          const restoredFile = new File([session.fileBlob], session.filename, {
            type: session.mimeType || 'application/pdf',
            lastModified: session.lastModified || Date.now(),
          });
          setFile(restoredFile);

          if (session.settings) {
            if (session.settings.mode) setMode(session.settings.mode);
            if (session.settings.preset) setPreset(session.settings.preset);
            if (typeof session.settings.percentage === 'number') setPercentage(session.settings.percentage);
            if (typeof session.settings.targetSizeVal === 'number') setTargetSizeVal(session.settings.targetSizeVal);
            if (session.settings.targetSizeUnit) setTargetSizeUnit(session.settings.targetSizeUnit);
            if (typeof session.settings.imageQuality === 'number') setImageQuality(session.settings.imageQuality);
            if (typeof session.settings.scaleFactor === 'number') setScaleFactor(session.settings.scaleFactor);
            if (typeof session.settings.removeMetadata === 'boolean') setRemoveMetadata(session.settings.removeMetadata);
            if (typeof session.settings.grayscale === 'boolean') setGrayscale(session.settings.grayscale);
            if (typeof session.settings.rasterize === 'boolean') setRasterize(session.settings.rasterize);
          }

          if (session.result) {
            setResult(session.result as any);
          }

          toast({
            type: 'info',
            title: 'Working document preserved',
            description: `Restored ${session.filename} from your active browser session.`,
          });
        }
      } catch (err) {
        console.error('Failed to restore active PDF session:', err);
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleFile = async (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setResult(null);

      // Auto set reasonable target size based on file size
      let initialTargetVal = 1;
      let initialTargetUnit: 'MB' | 'KB' = 'MB';

      const sizeMB = selected.size / (1024 * 1024);
      if (sizeMB > 2) {
        initialTargetVal = Math.max(1, Math.round(sizeMB * 0.6));
        initialTargetUnit = 'MB';
      } else {
        const sizeKB = Math.round(selected.size / 1024);
        initialTargetVal = Math.max(100, Math.round(sizeKB * 0.6));
        initialTargetUnit = 'KB';
      }

      setTargetSizeVal(initialTargetVal);
      setTargetSizeUnit(initialTargetUnit);

      // Immediately compress upon upload so results are immediately visible!
      handleProcessWithOptions(selected, { mode: 'preset', preset: 'balanced' });
    }
  };

  const handleClearFile = async () => {
    setFile(null);
    setResult(null);
    await clearActiveSession('pdf-compress');
  };

  // Interactive control handlers with instant re-compression
  const handleSelectMode = (newMode: 'preset' | 'percentage' | 'target-size' | 'advanced') => {
    setMode(newMode);
    if (file) {
      handleProcessWithOptions(file, { mode: newMode });
    }
  };

  const handleSelectPreset = (p: 'light' | 'balanced' | 'strong' | 'maximum') => {
    setPreset(p);
    if (file) {
      handleProcessWithOptions(file, { mode: 'preset', preset: p });
    }
  };

  const handleSelectPercentage = (pct: number) => {
    setPercentage(pct);
    if (file) {
      handleProcessWithOptions(file, { mode: 'percentage', reductionPercentage: pct });
    }
  };

  const handlePercentageSliderChange = (pct: number) => {
    setPercentage(pct);
    if (!file) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      handleProcessWithOptions(file, { mode: 'percentage', reductionPercentage: pct });
    }, 450);
  };

  const handleSelectTargetSize = (val: number, unit: 'MB' | 'KB') => {
    setTargetSizeVal(val);
    setTargetSizeUnit(unit);
    if (file) {
      const kb = unit === 'MB' ? val * 1024 : val;
      handleProcessWithOptions(file, { mode: 'target-size', targetSizeKB: kb });
    }
  };

  const handleTargetSizeValChange = (val: number) => {
    setTargetSizeVal(val);
    if (!file) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const kb = targetSizeUnit === 'MB' ? val * 1024 : val;
      handleProcessWithOptions(file, { mode: 'target-size', targetSizeKB: kb });
    }, 500);
  };

  const handleTargetSizeUnitChange = (unit: 'MB' | 'KB') => {
    setTargetSizeUnit(unit);
    if (!file) return;
    const kb = unit === 'MB' ? targetSizeVal * 1024 : targetSizeVal;
    handleProcessWithOptions(file, { mode: 'target-size', targetSizeKB: kb });
  };

  const handleImageQualityChange = (q: number) => {
    setImageQuality(q);
    if (!file) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      handleProcessWithOptions(file, { mode: 'advanced', imageQuality: q / 100 });
    }, 450);
  };

  const handleScaleFactorChange = (s: number) => {
    setScaleFactor(s);
    if (!file) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      handleProcessWithOptions(file, { mode: 'advanced', scaleFactor: s / 100 });
    }, 450);
  };

  const handleToggleMetadata = (checked: boolean) => {
    setRemoveMetadata(checked);
    if (file) {
      handleProcessWithOptions(file, { removeMetadata: checked });
    }
  };

  const handleToggleGrayscale = (checked: boolean) => {
    setGrayscale(checked);
    if (file) {
      handleProcessWithOptions(file, { grayscale: checked });
    }
  };

  const handleToggleRasterize = (checked: boolean) => {
    setRasterize(checked);
    if (file) {
      handleProcessWithOptions(file, { rasterize: checked });
    }
  };

  // Calculations for display
  const originalSize = file ? file.size : 0;
  const calculatedTargetBytesFromPct = originalSize * (1 - percentage / 100);
  const targetBytes = targetSizeUnit === 'MB' ? targetSizeVal * 1024 * 1024 : targetSizeVal * 1024;
  const calculatedReductionPctFromTarget = originalSize > 0
    ? Math.max(0, Math.min(99, ((originalSize - targetBytes) / originalSize) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Minimize2 className="w-6 h-6" />}
        name="PDF Compressor"
        description="Multi-strategy PDF compression. Optimize document streams, downsample embedded images, or target exact file sizes directly in your browser."
        category="PDF Clinic"
        categoryRoute="/pdf"
        categoryColor="#FF788C"
        formats={['.pdf', 'application/pdf']}
        privacyLevel="local"
      />

      {/* Main Workspace */}
      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept="application/pdf"
            onFiles={handleFile}
            label="Drop your PDF here or click to browse"
            description="Supports all PDF versions up to 100 MB. 100% processed client-side."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* File Overview Card */}
          <Card padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center font-bold text-xs shrink-0">
                PDF
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-main-white truncate max-w-[200px] xs:max-w-[260px] sm:max-w-xs md:max-w-md">{file.name}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-electric-blue/10 border border-electric-blue/20 text-electric-blue text-[10px] font-medium" title="This file is stored in your local browser IndexedDB and remains intact even if you refresh the page.">
                    <Clock className="w-3 h-3" />
                    Persists on refresh
                  </span>
                </div>
                <p className="text-xs text-muted-white">
                  Original Size: <span className="font-mono text-main-white font-medium">{formatFileSize(file.size)}</span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFile}
              className="self-end sm:self-auto shrink-0"
            >
              Change file
            </Button>
          </Card>

          {/* Strategy Mode Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'preset', label: 'A. Presets' },
              { id: 'percentage', label: 'B. Percentage' },
              { id: 'target-size', label: 'C. Target Size' },
              { id: 'advanced', label: 'D. Advanced' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMode(m.id as any)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  mode === m.id
                    ? 'bg-electric-blue text-white border-electric-blue shadow-sm'
                    : 'bg-surface-navy text-muted-white border-border-color hover:text-main-white hover:bg-elevated-navy'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Mode Configuration Card */}
          <Card padding="lg" className="space-y-6">
            {/* Mode A: Presets */}
            {mode === 'preset' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-main-white">Select Compression Preset</h3>
                  <span className="text-xs text-arctic-mint font-medium">Click any preset to apply instantly</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'light',
                      title: 'Light Compression (Studio Quality)',
                      reductionEst: '~20%',
                      desc: 'Maximum sharpness and studio fidelity. Preserves 100% crisp typography.',
                    },
                    {
                      id: 'balanced',
                      title: 'Balanced Compression (Recommended)',
                      reductionEst: '~40%',
                      desc: 'High-end balanced visual feel. Crisp Retina text and smooth graphics.',
                    },
                    {
                      id: 'strong',
                      title: 'Strong Compression (Crisp Compact)',
                      reductionEst: '~55%',
                      desc: 'Solid size savings while strictly preserving sharp text edges and legibility.',
                    },
                    {
                      id: 'maximum',
                      title: 'Maximum Practical Compression',
                      reductionEst: '~70%',
                      desc: 'Maximum bandwidth reduction with quality floor enforced. Zero blurry artifacts.',
                    },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id as any)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        preset === p.id
                          ? 'bg-electric-blue/15 border-electric-blue ring-1 ring-electric-blue shadow-md'
                          : 'bg-elevated-navy border-border-color hover:border-muted-white/40 hover:bg-elevated-navy/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-main-white">{p.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-navy text-arctic-mint border border-border-color font-semibold">
                            {p.reductionEst}
                          </span>
                          {preset === p.id && <Check className="w-4 h-4 text-electric-blue shrink-0" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-white">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode B: Percentage Slider */}
            {mode === 'percentage' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-main-white">Target Reduction Percentage</h3>
                  <p className="text-xs text-muted-white mt-0.5">
                    Adjust reduction percentage. Output recalculates automatically.
                  </p>
                </div>

                <div className="space-y-4">
                  <Slider
                    label="Desired reduction"
                    value={percentage}
                    min={5}
                    max={90}
                    unit="%"
                    onChange={handlePercentageSliderChange}
                  />

                  {/* Quick percentage buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[10, 25, 40, 50, 70, 80].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleSelectPercentage(pct)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                          percentage === pct
                            ? 'bg-electric-blue text-white border-electric-blue font-semibold'
                            : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white hover:bg-elevated-navy/80'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {/* Calculated target calculation summary */}
                  <div className="p-4 rounded-xl bg-elevated-navy border border-border-color grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                    <div>
                      <p className="text-muted-white text-[11px]">Original</p>
                      <p className="font-semibold text-main-white font-mono mt-0.5">{formatFileSize(originalSize)}</p>
                    </div>
                    <div>
                      <p className="text-muted-white text-[11px]">Target Reduction</p>
                      <p className="font-semibold text-electric-blue font-mono mt-0.5">{percentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-white text-[11px]">Target Output Size</p>
                      <p className="font-semibold text-arctic-mint font-mono mt-0.5">
                        ~{formatFileSize(calculatedTargetBytesFromPct)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode C: Target Output Size */}
            {mode === 'target-size' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-main-white">Specify Desired Output File Size</h3>
                  <p className="text-xs text-muted-white mt-0.5">
                    FileDoctor will calibrate the compression pipeline to match your target file size.
                  </p>
                </div>

                <div className="flex items-center gap-3 max-w-sm">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min={1}
                      value={targetSizeVal}
                      onChange={(e) => handleTargetSizeValChange(Math.max(1, Number(e.target.value)))}
                      label="Target size"
                    />
                  </div>
                  <div className="w-28 pt-5">
                    <Select
                      options={[
                        { value: 'MB', label: 'MB' },
                        { value: 'KB', label: 'KB' },
                      ]}
                      value={targetSizeUnit}
                      onChange={(e) => handleTargetSizeUnitChange(e.target.value as any)}
                    />
                  </div>
                </div>

                {/* Quick Presets for Target Size */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-white">Quick size presets:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: 10, unit: 'MB' as const },
                      { val: 5, unit: 'MB' as const },
                      { val: 2, unit: 'MB' as const },
                      { val: 1, unit: 'MB' as const },
                      { val: 500, unit: 'KB' as const },
                      { val: 250, unit: 'KB' as const },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTargetSize(p.val, p.unit)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                          targetSizeVal === p.val && targetSizeUnit === p.unit
                            ? 'bg-electric-blue text-white border-electric-blue font-semibold'
                            : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white'
                        }`}
                      >
                        {p.val} {p.unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculated summary */}
                <div className="p-4 rounded-xl bg-elevated-navy border border-border-color grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <p className="text-muted-white text-[11px]">Original</p>
                    <p className="font-semibold text-main-white font-mono mt-0.5">{formatFileSize(originalSize)}</p>
                  </div>
                  <div>
                    <p className="text-muted-white text-[11px]">Target Ceiling</p>
                    <p className="font-semibold text-arctic-mint font-mono mt-0.5">{targetSizeVal} {targetSizeUnit}</p>
                  </div>
                  <div>
                    <p className="text-muted-white text-[11px]">Calculated Reduction</p>
                    <p className="font-semibold text-electric-blue font-mono mt-0.5">
                      ~{calculatedReductionPctFromTarget.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mode D: Advanced Compression */}
            {mode === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-main-white">Advanced Compression Parameters</h3>
                  <p className="text-xs text-muted-white mt-0.5">
                    Fine-tune downsampling, image quantization, and color stream conversions.
                  </p>
                </div>

                <div className="space-y-5">
                  <Slider
                    label="Image Quality"
                    value={imageQuality}
                    min={20}
                    max={100}
                    unit="%"
                    onChange={handleImageQualityChange}
                  />

                  <Slider
                    label="Resolution / Scale Factor"
                    value={scaleFactor}
                    min={50}
                    max={150}
                    unit="%"
                    onChange={handleScaleFactorChange}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-elevated-navy border border-border-color cursor-pointer">
                      <input
                        type="checkbox"
                        checked={removeMetadata}
                        onChange={(e) => handleToggleMetadata(e.target.checked)}
                        className="rounded text-electric-blue focus:ring-0"
                      />
                      <span className="text-xs text-main-white">Strip Document Metadata & Keywords</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-elevated-navy border border-border-color cursor-pointer">
                      <input
                        type="checkbox"
                        checked={grayscale}
                        onChange={(e) => handleToggleGrayscale(e.target.checked)}
                        className="rounded text-electric-blue focus:ring-0"
                      />
                      <span className="text-xs text-main-white">Convert Document to Grayscale</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-elevated-navy border border-border-color cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rasterize}
                        onChange={(e) => handleToggleRasterize(e.target.checked)}
                        className="rounded text-electric-blue focus:ring-0"
                      />
                      <span className="text-xs text-main-white">Flatten & Rasterize (Image-based)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <div className="pt-2">
              <Button
                size="lg"
                loading={isProcessing}
                fullWidth
                icon={<Minimize2 className="w-4 h-4" />}
                onClick={() => handleProcessWithOptions()}
              >
                {isProcessing
                  ? processingStatus
                  : `Re-compress with ${mode === 'preset' ? preset.toUpperCase() : mode.toUpperCase()}`}
              </Button>
            </div>
          </Card>

          {/* Processing Indeterminate Progress */}
          {isProcessing && (
            <Card padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-white">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-electric-blue" />
                  {processingStatus}
                </span>
                <span className="text-electric-blue font-medium">Processing locally</span>
              </div>
              <ProgressBar value={50} indeterminate />
            </Card>
          )}

          {/* Verified Results Panel */}
          {result && result.success && result.outputSize && (
            <div className="space-y-4">
              <ResultPanel
                originalSize={result.originalSize}
                outputSize={result.outputSize}
                outputFilename={result.outputFilename || 'compressed.pdf'}
                processingTime={result.processingTime}
                targetSize={mode === 'target-size' ? targetBytes : mode === 'percentage' ? calculatedTargetBytesFromPct : undefined}
                warnings={result.warnings}
                onDownload={() => {
                  if (result.outputBlob && result.outputFilename) {
                    downloadBlob(result.outputBlob, result.outputFilename);
                  }
                }}
                onProcessAnother={handleClearFile}
              />

              <div className="p-4 rounded-xl bg-elevated-navy border border-border-color text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-main-white">Applied Strategy:</p>
                  <span className="flex items-center gap-1 text-[11px] text-arctic-mint font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> High-Fidelity Guarantee
                  </span>
                </div>
                <p className="text-muted-white font-mono text-[11px]">{result.strategyUsed}</p>
              </div>
            </div>
          )}

          {result && !result.success && (
            <div className="p-4 rounded-xl bg-coral/10 border border-coral/30 text-xs text-coral">
              <p className="font-semibold mb-1">Compression Error</p>
              <p>{result.error || 'An error occurred during compression.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
