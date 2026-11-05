import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Download,
  Trash2,
  HardDrive,
  FileText,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Info,
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

export const RecentOperations: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await getHistory(100);
      setHistory(items);
      const est = await getStorageEstimate();
      setStorage(est);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Event listener for updates
  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener(HISTORY_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, handleUpdate);
  }, []);

  // Live timer tick every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadRetained = async (id: string, defaultName: string) => {
    try {
      const retained = await getOutput(id);
      if (retained) {
        downloadBlob(retained.blob, retained.filename || defaultName);
        toast({ type: 'success', title: 'File downloaded from local vault' });
      } else {
        const inputItem = await getInput(id);
        if (inputItem) {
          downloadBlob(inputItem.blob, inputItem.filename || defaultName);
          toast({ type: 'info', title: 'Downloaded original file' });
        } else {
          toast({ type: 'warning', title: 'Output expired or removed from local device' });
        }
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Download failed', description: err.message });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteHistoryEntry(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast({
        type: 'info',
        title: 'File deleted from vault',
        description: `Removed ${name} from browser storage.`,
      });
      const est = await getStorageEstimate();
      setStorage(est);
    } catch (err: any) {
      toast({ type: 'error', title: 'Delete failed', description: err.message });
    }
  };

  const handleOpenFile = (entry: HistoryEntry) => {
    if (entry.toolId === 'pdf-compress') {
      navigate(`/tools/pdf-compress?historyId=${entry.id}`);
    } else if (entry.toolId.startsWith('pdf-')) {
      navigate(`/tools/${entry.toolId}?historyId=${entry.id}`);
    } else {
      navigate(`/tools/${entry.toolId}`);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Clear all operation history and retained local files from this browser?')) {
      await clearHistory();
      setHistory([]);
      const est = await getStorageEstimate();
      setStorage(est);
      toast({ type: 'success', title: 'Device vault cleared completely' });
    }
  };

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

    const text = minutes > 0 ? `${minutes}m left` : `${seconds}s left`;
    const isUrgent = minutes < 10;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
          isUrgent
            ? 'bg-amber/15 text-amber border-amber/30'
            : 'bg-arctic-mint/10 text-arctic-mint border-arctic-mint/20'
        }`}
        title={`Automatically purged at ${new Date(expiresAt).toLocaleTimeString()}`}
      >
        <Clock className="w-2.5 h-2.5" />
        {text}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-color">
        <div>
          <h1 className="text-3xl font-bold font-heading text-main-white">Recent Operations & Local Vault</h1>
          <p className="text-sm text-muted-white mt-1">
            Operation logs and retained file outputs stored securely in this browser's IndexedDB. Files automatically expire after 1 hour.
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleClearAll}>
            Clear Device Vault
          </Button>
        )}
      </div>

      {/* Storage Quota Card */}
      {storage && (
        <Card padding="md" className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-electric-blue" />
            <div>
              <p className="font-semibold text-main-white">Local Storage Allocation</p>
              <p className="text-muted-white">
                Using <span className="font-mono text-main-white">{formatFileSize(storage.usage)}</span> of browser quota (~{formatFileSize(storage.quota)})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-arctic-mint font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">1-Hour Safe Expiration Policy Active</span>
          </div>
        </Card>
      )}

      {/* History table & mobile card view */}
      {history.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="No recent operations recorded"
            description="Process a PDF, image, audio, or data file and your operation records will appear here."
          />
        </Card>
      ) : (
        <>
          {/* Mobile Card List (screens < sm) */}
          <div className="block sm:hidden space-y-3">
            {history.map((entry) => (
              <Card key={entry.id} padding="md" className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-electric-blue uppercase tracking-wider">{entry.toolName}</span>
                    <p className="text-sm font-semibold text-main-white truncate mt-0.5" title={entry.inputFilename}>
                      {entry.inputFilename}
                    </p>
                  </div>
                  <div>{getExpirationBadge(entry)}</div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-white font-mono bg-elevated-navy p-2 rounded-lg">
                  <span>{formatFileSize(entry.originalSize)}</span>
                  {entry.outputSize && (
                    <>
                      <ArrowRight className="w-3 h-3 text-muted-white/60" />
                      <span className="text-success font-semibold">{formatFileSize(entry.outputSize)}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border-color">
                  <button
                    type="button"
                    onClick={() => handleOpenFile(entry)}
                    className="text-xs text-electric-blue hover:text-bright-blue font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </button>

                  <div className="flex items-center gap-2">
                    {entry.hasRetainedOutput && (
                      <button
                        type="button"
                        onClick={() => handleDownloadRetained(entry.id, entry.outputFilename || 'document')}
                        className="p-1.5 rounded-lg bg-surface-navy border border-border-color text-muted-white hover:text-main-white cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id, entry.inputFilename)}
                      className="p-1.5 rounded-lg bg-surface-navy border border-border-color text-muted-white hover:text-coral hover:bg-coral/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table (screens >= sm) */}
          <Card padding="none" className="hidden sm:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-elevated-navy border-b border-border-color text-muted-white uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tool</th>
                    <th className="py-3 px-4">Input Document</th>
                    <th className="py-3 px-4">Original</th>
                    <th className="py-3 px-4">Output</th>
                    <th className="py-3 px-4">Expiration</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {history.map((entry) => (
                    <tr key={entry.id} className="hover:bg-elevated-navy/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-main-white whitespace-nowrap">
                        {entry.toolName}
                      </td>
                      <td className="py-3 px-4 text-muted-white truncate max-w-xs" title={entry.inputFilename}>
                        {entry.inputFilename}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-white whitespace-nowrap">
                        {formatFileSize(entry.originalSize)}
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        {entry.outputSize ? (
                          <span className="text-success font-semibold">{formatFileSize(entry.outputSize)}</span>
                        ) : (
                          <span className="text-muted-white">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getExpirationBadge(entry)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenFile(entry)}
                            title="Open in tool workspace"
                            className="p-1.5 rounded-lg bg-surface-navy border border-border-color text-muted-white hover:text-electric-blue hover:border-electric-blue/40 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {entry.hasRetainedOutput && (
                            <button
                              type="button"
                              onClick={() => handleDownloadRetained(entry.id, entry.outputFilename || 'document')}
                              title="Download processed file"
                              className="p-1.5 rounded-lg bg-surface-navy border border-border-color text-muted-white hover:text-main-white hover:bg-elevated-navy transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id, entry.inputFilename)}
                            title="Delete from local vault"
                            className="p-1.5 rounded-lg bg-surface-navy border border-border-color text-muted-white hover:text-coral hover:bg-coral/10 hover:border-coral/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
