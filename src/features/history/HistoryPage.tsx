import { Clock, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useHistory } from '@/hooks/useHistory';
import { formatBytes, formatTimestamp } from '@/utils/format';
import { getToolById } from '@/services/toolRegistry';

export function HistoryPage() {
  const { entries, loading, removeEntry, clearHistory } = useHistory();

  const statusColor = (s: string) =>
    s === 'success' ? 'text-emerald-500' : s === 'error' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Clock}
        title="Recent Operations"
        description="Metadata from your recent file processing sessions. No file contents are stored here."
        actions={
          entries.length > 0 ? (
            <button
              onClick={() => { if (confirm('Clear all history?')) clearHistory(); }}
              className="btn-ghost text-xs text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          ) : undefined
        }
      />

      <div className="card p-3 flex items-start gap-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Operation history stores metadata only (tool name, file sizes, timestamps). File contents are never stored. To repeat an operation, re-select your original file.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="card p-10 text-center">
          <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No operations yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Use a tool and your session metadata will appear here.</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const tool = getToolById(entry.toolId);
            return (
              <div key={entry.id} className="card p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{entry.toolName}</span>
                    <span className={`text-xs font-medium ${statusColor(entry.status)}`}>
                      {entry.status === 'success' ? '✓' : entry.status === 'error' ? '✗' : '—'} {entry.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {entry.inputFileName} · {formatBytes(entry.inputFileSizeBytes)}
                    {entry.outputFileSizeBytes ? ` → ${formatBytes(entry.outputFileSizeBytes)}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatTimestamp(entry.timestamp)}</p>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="shrink-0 p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                  aria-label="Remove entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
