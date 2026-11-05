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
  Camera,
  ArrowUp,
  ArrowDown,
  Printer,
  FileCheck,
  Award,
  Stamp,
  Sliders,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolHeader, Card, Button, useToast, ResultPanel } from '@/components/ui';
import {
  DocumentModel,
  DocSection,
  DocStat,
  buildPdfFromDocument,
  exportDocumentAsMarkdown,
  exportDocumentAsWordDoc,
  DOCUMENT_TEMPLATES,
} from '@/services/docBuilderService';
import { CameraCaptureModal } from '@/components/shared/CameraCaptureModal';
import { SignaturePadModal, SignatureData } from '@/components/shared/SignaturePadModal';
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
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [docCameraModalOpen, setDocCameraModalOpen] = useState(false);
  const [canvasCameraOpen, setCanvasCameraOpen] = useState(false);
  const docImageUploadRef = useRef<HTMLInputElement>(null);

  const handleApplyTemplate = (key: string) => {
    const tpl = DOCUMENT_TEMPLATES[key];
    if (tpl) {
      setDocModel(JSON.parse(JSON.stringify(tpl.model)));
      toast({
        type: 'success',
        title: `Template Loaded: ${tpl.label}`,
        description: tpl.description,
      });
    }
  };

  const handleAddSection = (type: DocSection['type']) => {
    const newSec: DocSection = {
      id: Math.random().toString(36).substring(2),
      type,
      text:
        type === 'heading'
          ? 'New Section Heading'
          : type === 'paragraph'
          ? 'Enter descriptive paragraph text here...'
          : type === 'callout'
          ? 'Important notice or strategic advisory note.'
          : undefined,
      bullets: type === 'bullet' ? ['Key action item or priority objective', 'Deliverable specification'] : undefined,
      tableHeaders: type === 'table' ? ['Item', 'Description', 'Quantity', 'Amount'] : undefined,
      tableRows:
        type === 'table'
          ? [
              ['Item 01', 'Standard Service Deliverable', '1', '$150.00'],
              ['Item 02', 'Professional Consulting Support', '2', '$300.00'],
            ]
          : undefined,
      stats:
        type === 'stat-grid'
          ? [
              { label: 'Subtotal', value: '$450.00' },
              { label: 'Status', value: 'Approved' },
            ]
          : undefined,
      signatoryName: type === 'signature' ? 'Authorized Representative' : undefined,
      signatoryTitle: type === 'signature' ? 'Verified Officer' : undefined,
      dateSigned: type === 'signature' ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
    };
    setDocModel((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
  };

  const handleRemoveSection = (id: string) => {
    setDocModel((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= docModel.sections.length) return;
    const updated = [...docModel.sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setDocModel((prev) => ({ ...prev, sections: updated }));
  };

  const handleUpdateSection = (id: string, updates: Partial<DocSection>) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const handleUpdateTableCell = (secId: string, rowIndex: number, colIndex: number, val: string) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId || !s.tableRows) return s;
        const newRows = s.tableRows.map((r, ri) =>
          ri === rowIndex ? r.map((c, ci) => (ci === colIndex ? val : c)) : r
        );
        return { ...s, tableRows: newRows };
      }),
    }));
  };

  const handleAddTableRow = (secId: string) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        const colCount = s.tableHeaders ? s.tableHeaders.length : 4;
        const blankRow = new Array(colCount).fill('—');
        return { ...s, tableRows: [...(s.tableRows || []), blankRow] };
      }),
    }));
  };

  const handleAddBulletItem = (secId: string) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        return { ...s, bullets: [...(s.bullets || []), 'New priority item'] };
      }),
    }));
  };

  const handleRemoveBulletItem = (secId: string, bulletIdx: number) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        return { ...s, bullets: (s.bullets || []).filter((_, bi) => bi !== bulletIdx) };
      }),
    }));
  };

  const handleUpdateBulletItem = (secId: string, bulletIdx: number, val: string) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        return {
          ...s,
          bullets: (s.bullets || []).map((b, bi) => (bi === bulletIdx ? val : b)),
        };
      }),
    }));
  };

  const handleAddStat = (secId: string) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        return { ...s, stats: [...(s.stats || []), { label: 'Metric', value: '100%' }] };
      }),
    }));
  };

  const handleUpdateStat = (secId: string, statIdx: number, label: string, val: string) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        return {
          ...s,
          stats: (s.stats || []).map((st, si) => (si === statIdx ? { label, value: val } : st)),
        };
      }),
    }));
  };

  const handleRemoveStat = (secId: string, statIdx: number) => {
    setDocModel((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        return { ...s, stats: (s.stats || []).filter((_, si) => si !== statIdx) };
      }),
    }));
  };

  const handleSaveSignature = (sig: SignatureData) => {
    const newSec: DocSection = {
      id: Math.random().toString(36).substring(2),
      type: 'signature',
      signatureDataUrl: sig.signatureDataUrl,
      signatoryName: sig.signatoryName,
      signatoryTitle: sig.signatoryTitle,
      dateSigned: sig.dateSigned,
    };
    setDocModel((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
    toast({
      type: 'success',
      title: 'Handwritten Signature Embedded',
      description: `Signed by ${sig.signatoryName}`,
    });
  };

  const handleDocCameraCapture = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newSec: DocSection = {
        id: Math.random().toString(36).substring(2),
        type: 'image',
        imageUrl: dataUrl,
        imageCaption: `Captured document snapshot (${new Date().toLocaleTimeString()})`,
      };
      setDocModel((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
      toast({
        type: 'success',
        title: 'Photo Embedded into Document',
        description: 'Captured directly from camera.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDocImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const newSec: DocSection = {
        id: Math.random().toString(36).substring(2),
        type: 'image',
        imageUrl: dataUrl,
        imageCaption: file.name,
      };
      setDocModel((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
      toast({
        type: 'success',
        title: 'Image Inserted',
        description: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
        toast({
          type: 'success',
          title: 'High-Fidelity PDF Created!',
          description: 'Vector-compiled and downloaded directly.',
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Export Failed', description: err.message });
    } finally {
      setIsCompilingPdf(false);
    }
  };

  const handleExportDocWord = () => {
    try {
      const wordBlob = exportDocumentAsWordDoc(docModel);
      const filename = `${docModel.title.replace(/\s+/g, '_')}.doc`;
      downloadBlob(wordBlob, filename);
      toast({
        type: 'success',
        title: 'Word Document Exported!',
        description: 'Saved as .doc format (MS Word & Docs compatible).',
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Word Export Failed', description: err.message });
    }
  };

  const handleExportDocMarkdown = () => {
    const md = exportDocumentAsMarkdown(docModel);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${docModel.title.replace(/\s+/g, '_')}.md`);
    toast({ type: 'success', title: 'Markdown Exported', description: 'Saved as .md file.' });
  };

  const handlePrintDoc = () => {
    window.print();
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

  const handleCanvasCameraCapture = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      setCanvasWidth(img.naturalWidth || 1080);
      setCanvasHeight(img.naturalHeight || 1080);
      setCanvasBgType('solid');
      setTimeout(() => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        toast({
          type: 'success',
          title: 'Photo Placed on Canvas',
          description: 'Ready to annotate, draw, or add text overlay.',
        });
      }, 50);
    };
    img.src = URL.createObjectURL(file);
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
      {/* TAB 1: PDF & DOCUMENT BUILDER (GOD-LEVEL WYSIWYG STUDIO) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'doc' && (
        <Card padding="md" className="space-y-6">
          {/* Top Actions & Multi-Format Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border-color pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-main-white font-heading">
                  Interactive Document & PDF Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-electric-blue/15 text-electric-blue border border-electric-blue/30 uppercase tracking-wider">
                  God-Level WYSIWYG
                </span>
              </div>
              <p className="text-xs text-muted-white mt-1">
                Design formal invoices, proposals, certificates, and reports with live editing, handwritten signatures, camera scans, and vector export.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={handlePrintDoc}
                title="Print document or use browser PDF driver"
              >
                Print
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={handleExportDocMarkdown}
              >
                Markdown (.md)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<FileText className="w-3.5 h-3.5 text-electric-blue" />}
                onClick={handleExportDocWord}
              >
                Word (.doc)
              </Button>
              <Button
                size="sm"
                loading={isCompilingPdf}
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportDocPdf}
                className="bg-electric-blue hover:bg-electric-blue/90"
              >
                Download Vector PDF
              </Button>
            </div>
          </div>

          {/* Quick Template Switcher Bar */}
          <div className="p-3.5 rounded-xl bg-elevated-navy border border-border-color space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-main-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-electric-blue" />
                <span>Instant High-Fidelity Templates</span>
              </span>
              <span className="text-[10px] text-muted-white">1-Click Auto-Layout</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(DOCUMENT_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyTemplate(key)}
                  className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-left hover:border-electric-blue/60 transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-main-white group-hover:text-electric-blue transition-colors truncate">
                    {tpl.label}
                  </div>
                  <div className="text-[10px] text-muted-white truncate mt-0.5">
                    {tpl.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Controls Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              {/* Insert Elements Palette */}
              <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-3">
                <h4 className="text-xs font-bold text-main-white uppercase tracking-wider flex items-center justify-between">
                  <span>Insert Content Block</span>
                  <span className="text-[10px] text-muted-white font-normal">Click to add</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSection('heading')}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-electric-blue transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <Type className="w-4 h-4 text-electric-blue" />
                    <span>Heading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('paragraph')}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-arctic-mint transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-arctic-mint" />
                    <span>Paragraph</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('bullet')}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-amber transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-amber" />
                    <span>Bullets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('table')}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-coral transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <TableIcon className="w-4 h-4 text-coral" />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('callout')}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-electric-blue transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-electric-blue" />
                    <span>Callout Box</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('stat-grid')}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-arctic-mint transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-arctic-mint" />
                    <span>KPI Stat Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection('divider')}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-slate-500 transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-4 h-0.5 bg-slate-400 rounded" />
                    <span>Divider Rule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureModalOpen(true)}
                    className="p-2.5 rounded-lg bg-electric-blue/10 border border-electric-blue/40 text-electric-blue text-xs font-bold hover:bg-electric-blue/20 transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <PenTool className="w-4 h-4 text-electric-blue" />
                    <span>Draw Signature</span>
                  </button>
                </div>

                {/* Media Inserters */}
                <div className="pt-2 border-t border-border-color grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocCameraModalOpen(true)}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-arctic-mint hover:text-arctic-mint transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-arctic-mint" />
                    <span>Snap Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => docImageUploadRef.current?.click()}
                    className="p-2.5 rounded-lg bg-surface-navy border border-border-color text-main-white text-xs font-medium hover:border-electric-blue transition-colors text-left flex items-center gap-2 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-electric-blue" />
                    <span>Upload Image</span>
                  </button>
                  <input
                    ref={docImageUploadRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDocImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Document Stamp & Typography Settings */}
              <div className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-3">
                <h4 className="text-xs font-bold text-main-white uppercase tracking-wider flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5 text-amber" />
                  <span>Stamps & Typography</span>
                </h4>

                <div>
                  <label className="text-[11px] text-muted-white block mb-1">Official Status Stamp Badge</label>
                  <select
                    value={docModel.stampBadge || 'NONE'}
                    onChange={(e) => setDocModel({ ...docModel, stampBadge: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                  >
                    <option value="NONE">None (Clean Header)</option>
                    <option value="PAID">PAID (Green Stamp)</option>
                    <option value="APPROVED">APPROVED (Verified Blue)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL (Red Stamp)</option>
                    <option value="DRAFT">DRAFT (Amber Stamp)</option>
                    <option value="ORIGINAL">ORIGINAL (Official Blue)</option>
                    <option value="VERIFIED">VERIFIED (Accredited)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-white block mb-1">Font Theme</label>
                    <select
                      value={docModel.fontTheme || 'sans'}
                      onChange={(e) => setDocModel({ ...docModel, fontTheme: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                    >
                      <option value="sans">Modern Sans (Helvetica)</option>
                      <option value="serif">Executive Serif (Times)</option>
                      <option value="mono">Developer Mono (Courier)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-white block mb-1">Paper Size</label>
                    <select
                      value={docModel.pageSize}
                      onChange={(e) => setDocModel({ ...docModel, pageSize: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                    >
                      <option value="a4">A4 (595 × 842 pt)</option>
                      <option value="letter">US Letter (612 × 792 pt)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-muted-white block mb-1">Watermark Stamp (Diagonal)</label>
                  <input
                    type="text"
                    placeholder="e.g. CONFIDENTIAL or DRAFT"
                    value={docModel.watermarkText || ''}
                    onChange={(e) => setDocModel({ ...docModel, watermarkText: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-navy border border-border-color text-xs text-main-white focus-ring"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-white">Show Page Numbers</span>
                  <input
                    type="checkbox"
                    checked={docModel.showPageNumbers !== false}
                    onChange={(e) => setDocModel({ ...docModel, showPageNumbers: e.target.checked })}
                    className="rounded border-border-color text-electric-blue focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Live Sheet Preview & Direct WYSIWYG Editor */}
            <div className="lg:col-span-8">
              <div
                className={`p-6 sm:p-12 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 min-h-[650px] space-y-6 relative overflow-hidden transition-all ${
                  docModel.fontTheme === 'serif'
                    ? 'font-serif'
                    : docModel.fontTheme === 'mono'
                    ? 'font-mono'
                    : 'font-sans'
                }`}
              >
                {/* Background Watermark Rendering */}
                {docModel.watermarkText && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                    <span className="text-6xl sm:text-7xl font-extrabold text-slate-200/60 uppercase tracking-widest transform -rotate-45">
                      {docModel.watermarkText}
                    </span>
                  </div>
                )}

                {/* Top Header Row with Stamp Badge & Organization */}
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="ORGANIZATION / COMPANY NAME"
                      value={docModel.organization || ''}
                      onChange={(e) => setDocModel({ ...docModel, organization: e.target.value })}
                      className="text-xs font-bold text-blue-600 tracking-wider uppercase w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Stamp Badge */}
                  {docModel.stampBadge && docModel.stampBadge !== 'NONE' && (
                    <div
                      className={`px-3 py-1 border-2 rounded font-extrabold text-xs uppercase tracking-wider transform rotate-3 select-none shadow-sm ${
                        docModel.stampBadge === 'PAID' || docModel.stampBadge === 'APPROVED' || docModel.stampBadge === 'VERIFIED'
                          ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70'
                          : docModel.stampBadge === 'CONFIDENTIAL'
                          ? 'border-rose-600 text-rose-700 bg-rose-50/70'
                          : 'border-amber-600 text-amber-700 bg-amber-50/70'
                      }`}
                    >
                      {docModel.stampBadge}
                    </div>
                  )}
                </div>

                {/* Document Title & Subtitle */}
                <div className="relative z-10 space-y-1">
                  <input
                    type="text"
                    value={docModel.title}
                    onChange={(e) => setDocModel({ ...docModel, title: e.target.value })}
                    className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle or document scope description..."
                    value={docModel.subtitle || ''}
                    onChange={(e) => setDocModel({ ...docModel, subtitle: e.target.value })}
                    className="text-sm text-slate-500 italic w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Metadata Row */}
                <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span>Author:</span>
                    <input
                      type="text"
                      value={docModel.author || ''}
                      onChange={(e) => setDocModel({ ...docModel, author: e.target.value })}
                      placeholder="Author name"
                      className="text-slate-700 font-medium bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <span>Date:</span>
                    <input
                      type="text"
                      value={docModel.date || ''}
                      onChange={(e) => setDocModel({ ...docModel, date: e.target.value })}
                      className="text-slate-700 font-medium bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Interactive WYSIWYG Sections */}
                <div className="relative z-10 space-y-4 pt-1">
                  {docModel.sections.map((sec, secIdx) => (
                    <div
                      key={sec.id}
                      className="relative group/sec p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50/80 transition-all"
                    >
                      {/* Section Action Toolbar (Move Up, Move Down, Delete) */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/sec:opacity-100 transition-opacity bg-white p-1 rounded-lg shadow-md border border-slate-200 z-20">
                        <button
                          type="button"
                          onClick={() => handleMoveSection(secIdx, 'up')}
                          disabled={secIdx === 0}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(secIdx, 'down')}
                          disabled={secIdx === docModel.sections.length - 1}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(sec.id)}
                          className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Heading */}
                      {sec.type === 'heading' && (
                        <input
                          type="text"
                          value={sec.text || ''}
                          onChange={(e) => handleUpdateSection(sec.id, { text: e.target.value })}
                          className="text-base font-bold text-slate-800 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                        />
                      )}

                      {/* Paragraph */}
                      {sec.type === 'paragraph' && (
                        <textarea
                          rows={3}
                          value={sec.text || ''}
                          onChange={(e) => handleUpdateSection(sec.id, { text: e.target.value })}
                          className="text-xs text-slate-700 leading-relaxed w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded p-1.5 focus:outline-none resize-y"
                        />
                      )}

                      {/* Bullet List */}
                      {sec.type === 'bullet' && (
                        <div className="space-y-1.5">
                          {(sec.bullets || []).map((b, bi) => (
                            <div key={bi} className="flex items-center gap-2 group/bullet">
                              <span className="text-blue-600 font-bold">•</span>
                              <input
                                type="text"
                                value={b}
                                onChange={(e) => handleUpdateBulletItem(sec.id, bi, e.target.value)}
                                className="flex-1 text-xs text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveBulletItem(sec.id, bi)}
                                className="p-0.5 text-slate-400 hover:text-rose-500 opacity-0 group-bullet:opacity-100 transition-opacity"
                                title="Remove Bullet"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddBulletItem(sec.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline mt-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add bullet item</span>
                          </button>
                        </div>
                      )}

                      {/* Callout Box */}
                      {sec.type === 'callout' && (
                        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                          <textarea
                            rows={2}
                            value={sec.text || ''}
                            onChange={(e) => handleUpdateSection(sec.id, { text: e.target.value })}
                            className="text-xs text-blue-900 leading-relaxed w-full bg-transparent border-none focus:outline-none resize-none font-medium"
                          />
                        </div>
                      )}

                      {/* Table */}
                      {sec.type === 'table' && (
                        <div className="space-y-2">
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <tr>
                                  {sec.tableHeaders?.map((th, thi) => (
                                    <th key={thi} className="p-2.5">
                                      {th}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sec.tableRows?.map((tr, tri) => (
                                  <tr key={tri} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                    {tr.map((td, tdi) => (
                                      <td key={tdi} className="p-2">
                                        <input
                                          type="text"
                                          value={td || ''}
                                          onChange={(e) => handleUpdateTableCell(sec.id, tri, tdi, e.target.value)}
                                          className="w-full text-xs text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddTableRow(sec.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Table Row</span>
                          </button>
                        </div>
                      )}

                      {/* Stat Grid KPI Cards */}
                      {sec.type === 'stat-grid' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {(sec.stats || []).map((st, si) => (
                              <div
                                key={si}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 relative group/stat"
                              >
                                <input
                                  type="text"
                                  value={st.label}
                                  onChange={(e) => handleUpdateStat(sec.id, si, e.target.value, st.value)}
                                  className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-full bg-transparent border-none focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={st.value}
                                  onChange={(e) => handleUpdateStat(sec.id, si, st.label, e.target.value)}
                                  className="text-base font-extrabold text-slate-900 w-full bg-transparent border-none focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStat(sec.id, si)}
                                  className="absolute top-1 right-1 p-1 text-slate-400 hover:text-rose-500 opacity-0 group-stat:opacity-100 transition-opacity"
                                  title="Remove Metric"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddStat(sec.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Metric Card</span>
                          </button>
                        </div>
                      )}

                      {/* Divider */}
                      {sec.type === 'divider' && (
                        <div className="py-2">
                          <hr className="border-t border-slate-200" />
                        </div>
                      )}

                      {/* Image Block */}
                      {sec.type === 'image' && (
                        <div className="space-y-2 text-center">
                          {sec.imageUrl && (
                            <img
                              src={sec.imageUrl}
                              alt={sec.imageCaption || 'Document visual'}
                              className="max-h-60 rounded-xl mx-auto shadow-md border border-slate-200 object-contain"
                            />
                          )}
                          <input
                            type="text"
                            placeholder="Add photo caption..."
                            value={sec.imageCaption || ''}
                            onChange={(e) => handleUpdateSection(sec.id, { imageCaption: e.target.value })}
                            className="text-[11px] text-slate-500 italic text-center w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Handwritten Signature Block */}
                      {sec.type === 'signature' && (
                        <div className="pt-4 max-w-xs">
                          {sec.signatureDataUrl && (
                            <img
                              src={sec.signatureDataUrl}
                              alt="Handwritten Signature"
                              className="h-12 object-contain mb-1"
                            />
                          )}
                          <div className="border-t-2 border-slate-800 pt-2 space-y-0.5">
                            <input
                              type="text"
                              value={sec.signatoryName || ''}
                              onChange={(e) => handleUpdateSection(sec.id, { signatoryName: e.target.value })}
                              placeholder="Signatory Name"
                              className="text-xs font-bold text-slate-900 w-full bg-transparent border-none focus:outline-none"
                            />
                            <input
                              type="text"
                              value={sec.signatoryTitle || ''}
                              onChange={(e) => handleUpdateSection(sec.id, { signatoryTitle: e.target.value })}
                              placeholder="Signatory Role / Title"
                              className="text-[11px] text-slate-500 w-full bg-transparent border-none focus:outline-none"
                            />
                            <input
                              type="text"
                              value={sec.dateSigned || ''}
                              onChange={(e) => handleUpdateSection(sec.id, { dateSigned: e.target.value })}
                              placeholder="Date Signed"
                              className="text-[10px] text-slate-400 italic w-full bg-transparent border-none focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setSignatureModalOpen(true)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                          >
                            <PenTool className="w-2.5 h-2.5" />
                            <span>Redraw Signature</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer Bar */}
                <div className="relative z-10 pt-6 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                  <span>Generated with FileDoctor Privacy Engine · 100% Client-Side</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modals for Document & Canvas */}
      <SignaturePadModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSave={handleSaveSignature}
        initialName={docModel.author || 'Authorized Representative'}
      />

      <CameraCaptureModal
        open={docCameraModalOpen}
        onClose={() => setDocCameraModalOpen(false)}
        onCapture={handleDocCameraCapture}
      />

      <CameraCaptureModal
        open={canvasCameraOpen}
        onClose={() => setCanvasCameraOpen(false)}
        onCapture={handleCanvasCameraCapture}
      />

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
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Camera className="w-3.5 h-3.5 text-arctic-mint" />}
                onClick={() => setCanvasCameraOpen(true)}
              >
                Snap Photo onto Canvas
              </Button>
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

