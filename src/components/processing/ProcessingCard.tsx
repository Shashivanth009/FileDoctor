import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Download, RotateCcw } from 'lucide-react';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { formatBytes, formatSizeReduction } from '@/utils/format';
import { downloadBlob } from '@/utils/download';
import type { ProcessingStatus, ProcessingResult } from '@/types';

type Props = {
  status: ProcessingStatus;
  progress: number;
  errorMessage?: string | null;
  result?: ProcessingResult | null;
  originalSize?: number;
  onCancel?: () => void;
  onReset?: () => void;
  statusLabel?: string;
};

export function ProcessingCard({
  status,
  progress,
  errorMessage,
  result,
  originalSize,
  onCancel,
  onReset,
  statusLabel,
}: Props) {
  return (
    <AnimatePresence mode="wait">
      {status === 'processing' && (
        <motion.div
          key="processing"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="card p-4 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statusLabel ?? 'Processing…'}
            </p>
          </div>
          <ProgressBar progress={progress > 0 ? progress : -1} />
          {onCancel && (
            <button onClick={onCancel} className="btn-secondary self-start text-xs">
              Cancel
            </button>
          )}
        </motion.div>
      )}

      {status === 'done' && result && (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="card p-4 flex flex-col gap-3 border-emerald-200 dark:border-emerald-800"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Done</p>
            </div>
            {onReset && (
              <button onClick={onReset} className="btn-ghost text-xs" aria-label="Start over">
                <RotateCcw className="w-3.5 h-3.5" />
                New
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span><strong className="text-gray-700 dark:text-gray-200">{result.fileName}</strong></span>
            <span>{formatBytes(result.blob.size)}</span>
            {originalSize !== undefined && (
              <span className={result.blob.size < originalSize ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {formatSizeReduction(originalSize, result.blob.size)}
              </span>
            )}
          </div>

          <button
            onClick={() => downloadBlob(result.blob, result.fileName)}
            className="btn-primary self-start"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="card p-4 flex flex-col gap-3 border-red-200 dark:border-red-800"
        >
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing failed</p>
              {errorMessage && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errorMessage}</p>}
            </div>
          </div>
          {onReset && (
            <button onClick={onReset} className="btn-secondary self-start text-xs">
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
          )}
        </motion.div>
      )}

      {status === 'cancelled' && (
        <motion.div
          key="cancelled"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="card p-4 flex items-center gap-2"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled.</p>
          {onReset && (
            <button onClick={onReset} className="btn-ghost text-xs">Start over</button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
