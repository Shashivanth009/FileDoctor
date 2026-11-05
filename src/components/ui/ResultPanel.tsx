import React from 'react';
import { Download, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { formatFileSize } from '@/services/fileService';

interface ResultPanelProps {
  originalSize: number;
  outputSize: number;
  outputFilename: string;
  processingTime: number;
  onDownload: () => void;
  onProcessAnother: () => void;
  warnings?: string[];
  targetSize?: number;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  originalSize,
  outputSize,
  outputFilename,
  processingTime,
  onDownload,
  onProcessAnother,
  warnings = [],
  targetSize,
}) => {
  const reduction = ((1 - outputSize / originalSize) * 100);
  const grew = outputSize > originalSize;
  const unchanged = outputSize === originalSize;

  return (
    <div className="bg-surface-navy border border-border-color rounded-xl p-4 sm:p-6 space-y-5">
      <div className="flex items-start sm:items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          unchanged ? 'bg-electric-blue/10' : grew ? 'bg-amber/10' : 'bg-success/10'
        }`}>
          <CheckCircle className={`w-5 h-5 ${
            unchanged ? 'text-electric-blue' : grew ? 'text-amber' : 'text-success'
          }`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-main-white font-heading">
            {unchanged
              ? 'Document Evaluated (Already at Minimal Size)'
              : grew
              ? 'Processing Complete'
              : 'Successfully Compressed'}
          </h3>
          <p className="text-xs text-muted-white truncate max-w-full">{outputFilename}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3.5 bg-elevated-navy/50 rounded-xl border border-border-color/50">
        <Stat label="Original" value={formatFileSize(originalSize)} />
        <Stat label="Output" value={formatFileSize(outputSize)} />
        <Stat
          label={unchanged ? 'Reduction' : grew ? 'Increase' : 'Saved'}
          value={
            unchanged
              ? '0.0% (Optimal)'
              : grew
              ? `+${Math.abs(reduction).toFixed(1)}%`
              : `${reduction.toFixed(1)}%`
          }
          accent={unchanged ? '#496BFF' : grew ? '#FFBF69' : '#35C98A'}
        />
        <Stat label="Time" value={`${(processingTime / 1000).toFixed(1)}s`} />
      </div>

      {targetSize && (
        <div className="text-xs text-muted-white p-3 bg-elevated-navy rounded-lg">
          Target: {formatFileSize(targetSize)} · Actual: {formatFileSize(outputSize)} ·{' '}
          {outputSize <= targetSize ? (
            <span className="text-success font-medium">Target achieved</span>
          ) : (
            <span className="text-amber font-medium">Target adjusted ({((1 - outputSize / originalSize) * 100).toFixed(1)}% reduction achieved)</span>
          )}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber bg-amber/5 p-2 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <Button icon={<Download className="w-4 h-4" />} onClick={onDownload} fullWidth className="sm:w-auto">
          Download
        </Button>
        <Button variant="secondary" icon={<RotateCcw className="w-4 h-4" />} onClick={onProcessAnother} fullWidth className="sm:w-auto">
          Process Another
        </Button>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; accent?: string }> = ({ label, value, accent }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-muted-white mb-0.5">{label}</p>
    <p
      className="text-sm font-semibold text-main-white font-mono"
      style={accent ? { color: accent } : undefined}
    >
      {value}
    </p>
  </div>
);

