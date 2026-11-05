import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Trash2,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Music,
  Code,
  X,
  HardDrive,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, EmptyState, useToast } from '@/components/ui';
import {
  getHistory,
  deleteHistoryEntry,
  clearHistory,
  getOutput,
  getInput,
  getStorageEstimate,
  HISTORY_UPDATED_EVENT,
  FILE_EXPIRATION_MS,
} from '@/services/historyService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { HistoryEntry } from '@/types';

interface FileHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const FileHistoryDrawer: React.FC<FileHistoryDrawerProps> = ({ open, onClose }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const items = await getHistory(100);
      setHistory(items);
      const est = await getStorageEstimate();
      setStorage(est);
    } catch (e) {
      console.error('Failed to load file history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Listen for history update events dispatched anywhere in the app
  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(HISTORY_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, handleUpdate);
  }, []);

  // Live timer tick to update remaining expiration time every 5 seconds
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, [open]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteHistoryEntry(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast({
        type: 'info',
        title: 'File deleted from vault',
        description: `Removed ${name} from local storage.`,
      });
      const est = await getStorageEstimate();
      setStorage(est);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete failed',
        description: err.message,
      });
    }
  };

  const handleDownloadOutput = async (id: string, defaultFilename?: string) => {
    try {
      const out = await getOutput(id);
      if (out && out.blob) {
        downloadBlob(out.blob, out.filename || defaultFilename || 'filedoctor_output');
        toast({
          type: 'success',
          title: 'Download started',
          description: `Downloaded ${out.filename || defaultFilename}`,
        });
      } else {
        // Fallback to input file if output not stored
        const inp = await getInput(id);
        if (inp && inp.blob) {
          downloadBlob(inp.blob, inp.filename || 'filedoctor_file');
          toast({
            type: 'info',
            title: 'Downloaded original file',
            description: `Output expired, original downloaded.`,
          });
        } else {
          toast({
            type: 'warning',
            title: 'File expired or deleted',
            description: 'The requested file has expired from local storage.',
          });
        }
      }
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Download failed',
        description: err.message,
      });
    }
  };

  const handleOpenFile = (entry: HistoryEntry) => {
    onClose();
    // Navigate to the tool that handles this file, with historyId to load it directly
    if (entry.toolId === 'pdf-compress') {
      navigate(`/tools/pdf-compress?historyId=${entry.id}`);
    } else if (entry.toolId.startsWith('pdf-')) {
      navigate(`/tools/${entry.toolId}?historyId=${entry.id}`);
    } else {
      navigate(`/tools/${entry.toolId}`);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Delete all stored files and history from your browser?')) {
      await clearHistory();
      setHistory([]);
      const est = await getStorageEstimate();
      setStorage(est);
      toast({
        type: 'success',
        title: 'Local vault cleared',
        description: 'All files and history have been removed.',
      });
    }
  };

  // Helper to format remaining expiration time
  const getExpirationBadge = (entry: HistoryEntry) => {
    const expiresAt = entry.expiresAt || (entry.timestamp + FILE_EXPIRATION_MS);
    const msRemaining = expiresAt - currentTime;

    if (msRemaining <= 0) {
      return (
        <span className="text-[10px] font-medium text-coral flex items-center gap-1">
          <Clock className="w-3 h-3" /> Expired
        </span>
      );
    }

    const minutes = Math.floor(msRemaining / (60 * 1000));
    const seconds = Math.floor((msRemaining % (60 * 1000)) / 1000);

    let text = '';
    if (minutes > 0) {
      text = `${minutes}m left`;
    } else {
      text = `${seconds}s left`;
    }

    const isUrgent = minutes < 10;

    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
          isUrgent
            ? 'bg-amber/15 text-amber border-amber/30'
            : 'bg-arctic-mint/10 text-arctic-mint border-arctic-mint/20'
        }`}
        title={`File automatically deletes from your browser at ${new Date(expiresAt).toLocaleTimeString()}`}
      >
        <Clock className="w-2.5 h-2.5" />
        {text}
      </span>
    );
  };

  const getFileIcon = (filename: string, toolId: string) => {
    if (toolId.startsWith('pdf-') || filename.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-coral/15 text-coral flex items-center justify-center font-bold text-[10px] shrink-0">
          PDF
        </div>
      );
    }
    if (toolId.startsWith('img-') || /\.(png|jpe?g|webp|gif|svg)$/i.test(filename)) {
      return (
        <div className="w-8 h-8 rounded-lg bg-arctic-mint/15 text-arctic-mint flex items-center justify-center font-bold text-[10px] shrink-0">
          <ImageIcon className="w-4 h-4" />
        </div>
      );
    }
    if (toolId.startsWith('audio-') || /\.(mp3|wav|ogg|m4a)$/i.test(filename)) {
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0">
          <Music className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-electric-blue/15 text-electric-blue flex items-center justify-center font-bold text-[10px] shrink-0">
        <FileText className="w-4 h-4" />
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-navy/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-deep-navy border-l border-border-color shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border-color flex items-center justify-between bg-surface-navy/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-heading text-main-white">Recent Files & Vault</h2>
                <span className="px-2 py-0.5 rounded-full bg-electric-blue/15 text-electric-blue text-[11px] font-semibold border border-electric-blue/30">
                  {history.length}
                </span>
              </div>
              <p className="text-xs text-muted-white mt-0.5">
                Saved locally in browser. Auto-expires in 1 hour.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-white hover:text-main-white hover:bg-elevated-navy transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top Sub-Bar: Storage & Clear All */}
          <div className="px-4 py-2.5 bg-ink-navy/60 border-b border-border-color flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-white text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-electric-blue" />
              <span>
                {storage ? formatFileSize(storage.usage) : '0 B'} used in IndexedDB
              </span>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-coral hover:text-coral/80 font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-white text-xs gap-2">
                <Clock className="w-6 h-6 animate-spin text-electric-blue" />
                <span>Reading local browser vault...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-navy border border-border-color flex items-center justify-center mx-auto mb-3 text-muted-white">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-main-white">No active files in vault</h3>
                <p className="text-xs text-muted-white max-w-xs mx-auto mt-1 leading-relaxed">
                  Files you upload or process are preserved here and will not delete when you refresh the tab. Files automatically expire after 1 hour.
                </p>
              </div>
            ) : (
              history.map((entry) => {
                const hasReduction =
                  entry.outputSize &&
                  entry.originalSize &&
                  entry.outputSize < entry.originalSize;
                const reductionPct = hasReduction
                  ? Math.round(((entry.originalSize - entry.outputSize!) / entry.originalSize) * 100)
                  : 0;

                return (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-surface-navy border border-border-color hover:border-border-color/80 transition-all space-y-2.5 group"
                  >
                    <div className="flex items-start gap-3">
                      {getFileIcon(entry.inputFilename, entry.toolId)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-xs font-semibold text-main-white truncate"
                            title={entry.inputFilename}
                          >
                            {entry.inputFilename}
                          </p>
                          {getExpirationBadge(entry)}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-white">
                          <span className="font-medium text-muted-white/80">{entry.toolName}</span>
                          <span>•</span>
                          <span className="font-mono">{formatFileSize(entry.originalSize)}</span>
                          {entry.outputSize && (
                            <>
                              <ArrowRight className="w-3 h-3 text-muted-white/60" />
                              <span className="font-mono text-success font-semibold">
                                {formatFileSize(entry.outputSize)}
                              </span>
                              {hasReduction && (
                                <span className="text-[10px] text-success bg-success/10 px-1 py-0.2 rounded font-medium">
                                  -{reductionPct}%
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-border-color/60">
                      <button
                        type="button"
                        onClick={() => handleOpenFile(entry)}
                        className="text-[11px] text-electric-blue hover:text-bright-blue font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Workspace
                      </button>

                      <div className="flex items-center gap-1.5">
                        {entry.hasRetainedOutput && (
                          <button
                            type="button"
                            onClick={() => handleDownloadOutput(entry.id, entry.outputFilename)}
                            title="Download processed output"
                            className="p-1 rounded text-muted-white hover:text-main-white hover:bg-elevated-navy transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id, entry.inputFilename)}
                          title="Delete from local vault now"
                          className="p-1 rounded text-muted-white hover:text-coral hover:bg-coral/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3.5 bg-ink-navy/80 border-t border-border-color text-center">
            <p className="text-[11px] text-muted-white/70">
              Files never leave your device. Auto-cleaned after 60 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
