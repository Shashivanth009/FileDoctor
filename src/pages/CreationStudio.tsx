import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PenTool,
  FileText,
  Image as ImageIcon,
  Mic,
  Database,
  Download,
  Plus,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Layers,
  Type,
  Palette,
  Volume2,
  CheckCircle2,
  Copy,
  Table as TableIcon,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolHeader, Card, Button, useToast, ResultPanel } from '@/components/ui';
import {
  DocumentModel,
  DocSection,
  buildPdfFromDocument,
  exportDocumentAsMarkdown,
} from '@/services/docBuilderService';
import { audioBufferToWav } from '@/services/audioService';
import { downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import * as XLSX from 'xlsx';

type StudioTab = 'doc' | 'image' | 'audio' | 'data';

export const CreationStudio: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as StudioTab) || 'doc';
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);
  const { toast } = useToast();

  const handleTabChange = (tab: StudioTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // -------------------------------------------------------------
  // LAB 1: DOCUMENT & PDF BUILDER STATE
  // -------------------------------------------------------------
  const [docModel, setDocModel] = useState<DocumentModel>({
    title: 'Executive Project Brief',
    subtitle: 'Confidential strategic overview and deliverables',
    author: 'FileDoctor Workspace',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    organization: 'Acme Corporation',
    pageSize: 'a4',
    watermarkText: '',
    showPageNumbers: true,
    sections: [
      {
        id: '1',
        type: 'heading',
        text: '1. Executive Summary',
      },
      {
        id: '2',
        type: 'paragraph',
        text: 'This document was compiled directly in your browser using the privacy-first FileDoctor engine. Zero data leaves your device, guaranteeing total data sovereignty and confidentiality.',
      },
      {
        id: '3',
        type: 'callout',
        text: 'Privacy Notice: All typography, tables, and vector layout streams are computed locally.',
      },
      {
        id: '4',
        type: 'heading',
        text: '2. Key Deliverables',
      },
      {
        id: '5',
        type: 'bullet',
        bullets: [
          'High-fidelity vector PDF generation with custom layout geometry.',
          'Built-in support for multi-column tables, callout blocks, and custom headers.',
          'Instant export to PDF, Markdown (.md), and Plain Text (.txt).',
        ],
      },
      {
        id: '6',
        type: 'table',
        tableHeaders: ['Deliverable', 'Owner', 'Status', 'Target'],
        tableRows: [
          ['Architecture Specification', 'Engineering', 'Completed', 'Q1'],
          ['Security & Privacy Audit', 'SecOps', 'Verified', 'Q1'],
          ['Client Rollout', 'Operations', 'Ready', 'Q2'],
        ],
      },
    ],
  });

  const [isCompilingPdf, setIsCompilingPdf] = useState(false);

  const handleAddSection = (type: DocSection['type']) => {
    const newSec: DocSection = {
      id: Math.random().toString(36).substring(2),
      type,
      text: type === 'heading' ? 'New Section Heading' : type === 'paragraph' ? 'Enter paragraph description here...' : 'Important informational note.',
      bullets: type === 'bullet' ? ['First bullet point', 'Second bullet point'] : undefined,
      tableHeaders: type === 'table' ? ['Item', 'Description', 'Qty', 'Total'] : undefined,
      tableRows: type === 'table' ? [['Item A', 'Standard License', '1', '$150'], ['Item B', 'Support Plan', '1', '$50']] : undefined,
    };
    setDocModel((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
  };

  const handleRemoveSection = (id: string) => {
    setDocModel((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
  };

  const handleExportDocPdf = async () => {
    setIsCompilingPdf(true);
    try {
      const res = await buildPdfFromDocument(docModel);
      if (res.success && res.outputBlob && res.outputFilename) {
        downloadBlob(res.outputBlob, res.outputFilename);
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: 'create-doc',
          toolName: 'Document & PDF Creator',
          inputFilename: `${docModel.title}.pdf`,
          originalSize: 0,
          outputFilename: res.outputFilename,
          outputSize: res.outputSize,
          timestamp: Date.now(),
          status: 'success',
          hasRetainedOutput: true,
        });
        await saveOutput(id, res.outputBlob, res.outputFilename);
        toast({ type: 'success', title: 'Document PDF Created!', description: 'Downloaded directly in your browser.' });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Export Failed', description: err.message });
    } finally {
      setIsCompilingPdf(false);
    }
  };

  const handleExportDocMarkdown = () => {
    const md = exportDocumentAsMarkdown(docModel);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${docModel.title.replace(/\s+/g, '_')}.md`);
    toast({ type: 'success', title: 'Markdown Exported', description: 'Saved as .md file.' });
  };

  // -------------------------------------------------------------
  // LAB 2: IMAGE & GRAPHIC CANVAS STUDIO STATE
  // -------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(1080);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [canvasBgType, setCanvasBgType] = useState<'solid' | 'gradient' | 'transparent'>('gradient');
  const [canvasBgColor, setCanvasBgColor] = useState('#10172A');
  const [canvasGradient, setCanvasGradient] = useState<string>('arctic-pulse');
  const [overlayText, setOverlayText] = useState('FileDoctor Studio');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(64);
  const [textFont, setTextFont] = useState<'Manrope' | 'Inter' | 'JetBrains Mono' | 'Georgia'>('Manrope');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#48DCC7');
  const [brushSize, setBrushSize] = useState(8);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    if (canvasBgType === 'transparent') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (canvasBgType === 'solid') {
      ctx.fillStyle = canvasBgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (canvasGradient === 'arctic-pulse') {
        grad.addColorStop(0, '#10172A');
        grad.addColorStop(0.5, '#1B2942');
        grad.addColorStop(1, '#15253F');
      } else if (canvasGradient === 'electric') {
        grad.addColorStop(0, '#3D5FE8');
        grad.addColorStop(1, '#139F99');
      } else if (canvasGradient === 'sunset') {
        grad.addColorStop(0, '#FF788C');
        grad.addColorStop(1, '#FFBF69');
      } else {
        grad.addColorStop(0, '#0F172A');
        grad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Text Overlay
    if (overlayText) {
      ctx.save();
      ctx.font = `bold ${textSize}px ${textFont}, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;
      ctx.fillText(overlayText, canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  };

  useEffect(() => {
    if (activeTab === 'image') {
      drawCanvas();
    }
  }, [activeTab, canvasWidth, canvasHeight, canvasBgType, canvasBgColor, canvasGradient, overlayText, textColor, textSize, textFont]);

  const handleExportCanvas = (format: 'image/png' | 'image/jpeg' | 'image/webp') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `artwork_${Date.now()}.${ext}`);
        toast({ type: 'success', title: 'Image Exported', description: `Saved as ${ext.toUpperCase()}` });
      }
    }, format, 0.92);
  };

  // -------------------------------------------------------------
  // LAB 3: AUDIO & VOICE RECORDER STUDIO STATE
  // -------------------------------------------------------------
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBuffer, setRecordedAudioBuffer] = useState<AudioBuffer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      // Realtime Audio Waveform Visualizer
      const canvas = visualizerCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const renderVisualizer = () => {
        if (!canvas || !ctx) return;
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / dataArray.length) * 1.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, '#496BFF');
          grad.addColorStop(1, '#48DCC7');
          ctx.fillStyle = grad;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }

        animFrameRef.current = requestAnimationFrame(renderVisualizer);
      };
      renderVisualizer();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        stream.getTracks().forEach((t) => t.stop());

        const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(webmBlob);
        setRecordedAudioUrl(url);

        try {
          const arrayBuf = await webmBlob.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(arrayBuf);
          setRecordedAudioBuffer(decoded);
        } catch {
          // If decode fails, webm playback still works
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordTimer(0);
      timerIntervalRef.current = setInterval(() => setRecordTimer((t) => t + 1), 1000);
      toast({ type: 'info', title: 'Recording Started', description: 'Speak into your microphone.' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Microphone Offline', description: err.message });
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleExportWav = () => {
    if (!recordedAudioBuffer) {
      toast({ type: 'warning', title: 'Audio processing', description: 'Audio buffer is being encoded.' });
      return;
    }
    const wavBlob = audioBufferToWav(recordedAudioBuffer);
    downloadBlob(wavBlob, `recording_${Date.now()}.wav`);
    toast({ type: 'success', title: 'Studio WAV Exported', description: 'High-fidelity 16-bit PCM WAV saved.' });
  };

  // -------------------------------------------------------------
  // LAB 4: DATA & TABLE GENERATOR STATE
  // -------------------------------------------------------------
  const [dataHeaders, setDataHeaders] = useState<string[]>(['ID', 'Full Name', 'Department', 'Role', 'Status']);
  const [dataRows, setDataRows] = useState<string[][]>([
    ['101', 'Alex Mercer', 'Product', 'Lead Architect', 'Active'],
    ['102', 'Sophia Chen', 'Security', 'Principal Analyst', 'Active'],
    ['103', 'Liam Vance', 'Design', 'UI/UX Specialist', 'Active'],
    ['104', 'Elena Rostova', 'Operations', 'Release Manager', 'On Leave'],
  ]);

  const handleAddRow = () => {
    setDataRows([...dataRows, new Array(dataHeaders.length).fill('')]);
  };

  const handleAddColumn = () => {
    const colName = `Col_${dataHeaders.length + 1}`;
    setDataHeaders([...dataHeaders, colName]);
    setDataRows(dataRows.map((r) => [...r, '']));
  };

  const handleExportCsv = () => {
    const csvContent = [dataHeaders.join(','), ...dataRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `dataset_${Date.now()}.csv`);
    toast({ type: 'success', title: 'CSV Table Exported', description: 'Saved as .csv file.' });
  };

  const handleExportXlsx = () => {
    const sheetData = [dataHeaders, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DataSheet');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `spreadsheet_${Date.now()}.xlsx`);
    toast({ type: 'success', title: 'Excel Workbook Exported', description: 'Saved as .xlsx file.' });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <ToolHeader
        icon={<Sparkles className="w-6 h-6 text-arctic-mint" />}
        name="Creation Studio"
        description="Build rich documents & PDFs, design images, record studio audio, and generate structured datasets — all 100% inside your browser."
        category="Creation Studio"
        categoryRoute="/create"
        categoryColor="#48DCC7"
        privacyLevel="local"
        formats={['.pdf', '.png', '.wav', '.xlsx', '.csv']}
      />

      {/* Primary Studio Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: 'doc', label: 'PDF & Document', icon: FileText, desc: 'Rich formatted documents' },
          { id: 'image', label: 'Image & Graphic', icon: ImageIcon, desc: 'Canvas designer & social' },
          { id: 'audio', label: 'Voice & Audio', icon: Mic, desc: 'Microphone & WAV recorder' },
          { id: 'data', label: 'Spreadsheet & Table', icon: Database, desc: 'CSV, Excel & datasets' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as StudioTab)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-surface-navy border-electric-blue text-main-white shadow-lg shadow-electric-blue/10 ring-1 ring-electric-blue/30'
                  : 'bg-surface-navy/60 border-border-color text-muted-white hover:text-main-white hover:bg-surface-navy'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-electric-blue text-white' : 'bg-elevated-navy text-muted-white'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold font-heading">{tab.label}</span>
              </div>
              <p className="text-[11px] text-muted-white truncate">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PDF & DOCUMENT BUILDER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'doc' && (
        <Card padding="md" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-5">
            <div>
              <h3 className="text-base font-bold text-main-white font-heading">Document & PDF Builder</h3>
              <p className="text-xs text-muted-white mt-0.5">
                Design formal reports, invoices, proposals, and briefs with vector typographic layout.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={handleExportDocMarkdown}
              >
                Export .MD
              </Button>
              <Button
                size="sm"
                loading={isCompilingPdf}
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportDocPdf}
              >
                Download PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-3">
                <h4 className="text-xs font-bold text-main-white uppercase tracking-wider">Document Settings</h4>
                <div>
                  <label className="text-[11px] text-muted-white block mb-1">Document Title</label>
                  <input
                    type="text"
                    value={docModel.title}
                    onChange={(e) => setDocModel({ ...docModel, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-white block mb-1">Subtitle / Purpose</label>
                  <input
                    type="text"
                    value={docModel.subtitle || ''}
                    onChange={(e) => setDocModel({ ...docModel, subtitle: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-white block mb-1">Author</label>
                    <input
                      type="text"
                      value={docModel.author || ''}
                      onChange={(e) => setDocModel({ ...docModel, author: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-white block mb-1">Organization</label>
                    <input
                      type="text"
                      value={docModel.organization || ''}
                      onChange={(e) => setDocModel({ ...docModel, organization: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Add Elements Bar */}
              <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-2.5">
                <h4 className="text-xs font-bold text-main-white uppercase tracking-wider">Insert Section</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSection('heading')}
                    className="p-2 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-electric-blue transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 text-electric-blue" />
                    <span>Heading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('paragraph')}
                    className="p-2 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-electric-blue transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-arctic-mint" />
                    <span>Paragraph</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('bullet')}
                    className="p-2 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-electric-blue transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber" />
                    <span>Bullets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('table')}
                    className="p-2 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-electric-blue transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <TableIcon className="w-3.5 h-3.5 text-coral" />
                    <span>Table</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Sheet Preview */}
            <div className="lg:col-span-2">
              <div className="p-6 sm:p-10 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 min-h-[550px] space-y-5">
                {docModel.organization && (
                  <p className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
                    {docModel.organization}
                  </p>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {docModel.title}
                  </h1>
                  {docModel.subtitle && (
                    <p className="text-sm text-slate-500 mt-1 italic">{docModel.subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 border-b border-slate-200 pb-3">
                  {docModel.author && <span>By {docModel.author}</span>}
                  {docModel.date && <span>· {docModel.date}</span>}
                </div>

                {/* Sections Render */}
                <div className="space-y-4 pt-1">
                  {docModel.sections.map((sec) => (
                    <div key={sec.id} className="relative group/sec p-2 rounded hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sec.id)}
                        className="absolute -top-1 -right-1 p-1 rounded bg-rose-100 text-rose-600 opacity-0 group-hover/sec:opacity-100 transition-opacity"
                        title="Remove Section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      {sec.type === 'heading' && (
                        <h2 className="text-base font-bold text-slate-800">{sec.text}</h2>
                      )}

                      {sec.type === 'paragraph' && (
                        <p className="text-xs text-slate-700 leading-relaxed">{sec.text}</p>
                      )}

                      {sec.type === 'bullet' && (
                        <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                          {sec.bullets?.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}

                      {sec.type === 'callout' && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
                          {sec.text}
                        </div>
                      )}

                      {sec.type === 'table' && (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                {sec.tableHeaders?.map((th, thi) => (
                                  <th key={thi} className="p-2">{th}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sec.tableRows?.map((tr, tri) => (
                                <tr key={tri} className="border-b border-slate-100 last:border-0">
                                  {tr.map((td, tdi) => (
                                    <td key={tdi} className="p-2 text-slate-600">{td}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                  <span>Generated with FileDoctor Privacy Engine</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: IMAGE & GRAPHIC STUDIO */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'image' && (
        <Card padding="md" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-5">
            <div>
              <h3 className="text-base font-bold text-main-white font-heading">Image & Graphic Studio</h3>
              <p className="text-xs text-muted-white mt-0.5">
                Create graphics, banners, and social posts with text, backgrounds, and presets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => handleExportCanvas('image/png')}>
                Export PNG
              </Button>
              <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => handleExportCanvas('image/jpeg')}>
                Export JPEG
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-3">
                <h4 className="text-xs font-bold text-main-white uppercase tracking-wider">Canvas Dimensions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setCanvasWidth(1080); setCanvasHeight(1080); }}
                    className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer ${canvasWidth === 1080 && canvasHeight === 1080 ? 'bg-electric-blue text-white border-electric-blue' : 'bg-surface-navy border-border-color text-main-white'}`}
                  >
                    1:1 Square (1080px)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCanvasWidth(1200); setCanvasHeight(630); }}
                    className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer ${canvasWidth === 1200 && canvasHeight === 630 ? 'bg-electric-blue text-white border-electric-blue' : 'bg-surface-navy border-border-color text-main-white'}`}
                  >
                    Banner (1200×630)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCanvasWidth(1280); setCanvasHeight(720); }}
                    className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer ${canvasWidth === 1280 && canvasHeight === 720 ? 'bg-electric-blue text-white border-electric-blue' : 'bg-surface-navy border-border-color text-main-white'}`}
                  >
                    Thumbnail (720p)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCanvasWidth(1080); setCanvasHeight(1920); }}
                    className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer ${canvasWidth === 1080 && canvasHeight === 1920 ? 'bg-electric-blue text-white border-electric-blue' : 'bg-surface-navy border-border-color text-main-white'}`}
                  >
                    Story (9:16)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-3">
                <h4 className="text-xs font-bold text-main-white uppercase tracking-wider">Styling & Text</h4>
                <div>
                  <label className="text-[11px] text-muted-white block mb-1">Center Text</label>
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-white block mb-1">Text Color</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-8 rounded border border-border-color cursor-pointer bg-surface-navy"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-white block mb-1">Font Size ({textSize}px)</label>
                    <input
                      type="range"
                      min={24}
                      max={120}
                      value={textSize}
                      onChange={(e) => setTextSize(parseInt(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex items-center justify-center bg-black/40 rounded-2xl p-4 border border-border-color overflow-hidden">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="max-h-[480px] max-w-full object-contain rounded-xl shadow-2xl border border-border-color/50"
              />
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: AUDIO & VOICE RECORDER STUDIO */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audio' && (
        <Card padding="md" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-5">
            <div>
              <h3 className="text-base font-bold text-main-white font-heading">Voice & Audio Recording Studio</h3>
              <p className="text-xs text-muted-white mt-0.5">
                Record high-fidelity voice notes, podcasts, and audio directly from your microphone into studio WAV format.
              </p>
            </div>
            {recordedAudioUrl && (
              <Button
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportWav}
              >
                Download Studio WAV
              </Button>
            )}
          </div>

          <div className="max-w-xl mx-auto space-y-6 py-6 text-center">
            {/* Realtime Waveform Visualizer */}
            <div className="relative aspect-[3/1] w-full rounded-2xl bg-black/60 border border-border-color overflow-hidden flex items-center justify-center p-4">
              <canvas
                ref={visualizerCanvasRef}
                width={400}
                height={120}
                className="w-full h-full object-contain"
              />
              {!isRecording && !recordedAudioUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-white pointer-events-none">
                  Press Record to activate live audio visualizer
                </div>
              )}
            </div>

            {/* Timer Counter */}
            <div className="font-mono text-3xl font-extrabold text-main-white">
              {String(Math.floor(recordTimer / 60)).padStart(2, '0')}:
              {String(recordTimer % 60).padStart(2, '0')}
            </div>

            {/* Record Action Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-coral to-amber text-white font-bold text-sm shadow-xl shadow-coral/25 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopAudioRecording}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-surface-navy border-2 border-coral text-coral font-bold text-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-coral" />
                  <span>Stop & Process</span>
                </button>
              )}
            </div>

            {/* Playback Container if recorded */}
            {recordedAudioUrl && (
              <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-3">
                <p className="text-xs font-semibold text-main-white text-left">Playback Preview</p>
                <audio src={recordedAudioUrl} controls className="w-full" />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: SPREADSHEET & TABLE GENERATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'data' && (
        <Card padding="md" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-5">
            <div>
              <h3 className="text-base font-bold text-main-white font-heading">Spreadsheet & Table Generator</h3>
              <p className="text-xs text-muted-white mt-0.5">
                Generate datasets, populate rows, and export directly to CSV or Excel (.xlsx).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExportXlsx}>
                Export Excel (.xlsx)
              </Button>
              <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExportCsv}>
                Export CSV
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddRow}>
                Add Row
              </Button>
              <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddColumn}>
                Add Column
              </Button>
            </div>

            <div className="overflow-x-auto border border-border-color rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-elevated-navy text-main-white font-bold border-b border-border-color">
                  <tr>
                    {dataHeaders.map((h, i) => (
                      <th key={i} className="p-2.5">
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => {
                            const updated = [...dataHeaders];
                            updated[i] = e.target.value;
                            setDataHeaders(updated);
                          }}
                          className="bg-transparent font-bold text-xs text-main-white focus:outline-none border-b border-transparent focus:border-electric-blue w-full"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                  {dataRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-elevated-navy/40">
                      {row.map((cell, ci) => (
                        <td key={ci} className="p-2">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const updated = [...dataRows];
                              updated[ri][ci] = e.target.value;
                              setDataRows(updated);
                            }}
                            className="bg-transparent text-xs text-main-white focus:outline-none focus:bg-elevated-navy px-1 py-0.5 rounded w-full"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
