import { FileText, Image, Music, FileSpreadsheet, File, X, GripVertical } from 'lucide-react';
import { formatBytes } from '@/utils/format';

type Props = {
  file: File;
  onRemove?: () => void;
  extra?: React.ReactNode;
  draggable?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
  if (mime === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
  if (mime.startsWith('audio/')) return <Music className="w-4 h-4 text-purple-500" />;
  if (mime.includes('spreadsheet') || mime.includes('excel')) return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  return <File className="w-4 h-4 text-gray-400" />;
}

export function FileItem({ file, onRemove, extra, draggable, dragHandleProps }: Props) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
      {draggable && (
        <div
          {...dragHandleProps}
          className="text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <div className="shrink-0">{getFileIcon(file.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</p>
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
          aria-label={`Remove ${file.name}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
