import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File as FileIcon } from 'lucide-react';

type Props = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  maxSizeMB?: number;
  className?: string;
};

export function DropZone({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  label = 'Drop files here',
  hint,
  maxSizeMB,
  className = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setDragError(null);

    const filtered = Array.from(files);

    if (maxSizeMB) {
      const oversized = filtered.find((f) => f.size > maxSizeMB * 1024 * 1024);
      if (oversized) {
        setDragError(`"${oversized.name}" exceeds the ${maxSizeMB} MB limit.`);
        return;
      }
    }

    onFiles(multiple ? filtered : [filtered[0]]);
  }, [onFiles, multiple, maxSizeMB]);

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const onClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') onClick();
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
        onKeyDown={onKeyDown}
        animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200 min-h-[160px] select-none
          ${isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
            : 'border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
          {isDragging ? (
            <FileIcon className="w-6 h-6 text-brand-600" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDragging ? 'Release to upload' : label}
          </p>
          {hint && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>
          )}
          {maxSizeMB && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Max {maxSizeMB} MB</p>
          )}
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline pointer-events-none"
        >
          Browse files
        </button>
      </motion.div>

      {dragError && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠</span> {dragError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
        disabled={disabled}
      />
    </div>
  );
}
