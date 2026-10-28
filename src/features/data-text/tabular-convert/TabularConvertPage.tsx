import { useState } from 'react';
import { Table, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropZone } from '@/components/files/DropZone';
import { FileItem } from '@/components/files/FileItem';
import { ProcessingCard } from '@/components/processing/ProcessingCard';
import { useProcessing } from '@/hooks/useProcessing';
import { validateFile } from '@/utils/validate';
import { csvToJson, jsonToCsv, xlsxToCsv, csvToXlsx, getXlsxSheets } from '@/services/dataProcessing';
import { addRecentTool } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import { getExtension } from '@/utils/sanitize';
import type { ProcessingResult } from '@/types';

type ConvertOp = 'csv-to-json' | 'json-to-csv' | 'xlsx-to-csv' | 'csv-to-xlsx';

export function TabularConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [operation, setOperation] = useState<ConvertOp>('csv-to-json');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const proc = useProcessing();
  const { error: toastError } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const ext = getExtension(f.name);
    const v = validateFile(f, { acceptedExtensions: ['csv','json','xlsx'], maxSizeBytes: 50*1024*1024 });
    if (!v.valid) { toastError(v.error); return; }
    setFile(f); setResult(null); proc.reset();

    if (ext === 'csv') setOperation('csv-to-json');
    else if (ext === 'json') setOperation('json-to-csv');
    else if (ext === 'xlsx') {
      setOperation('xlsx-to-csv');
      const sh = await getXlsxSheets(f);
      setSheets(sh);
      setSelectedSheet(sh[0] ?? '');
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    const ac = proc.start();
    addRecentTool('tabular-convert');
    try {
      let res: ProcessingResult;
      if (operation === 'csv-to-json') res = await csvToJson(file);
      else if (operation === 'json-to-csv') res = await jsonToCsv(file);
      else if (operation === 'xlsx-to-csv') res = await xlsxToCsv(file, selectedSheet || undefined);
      else res = await csvToXlsx(file);
      setResult(res);
      proc.setDone();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { proc.cancel(); return; }
      proc.setError({ code: 'CONVERT_FAILED', message: (err as Error).message });
    }
  };

  const OPS: { value: ConvertOp; label: string }[] = [
    { value: 'csv-to-json', label: 'CSV → JSON' },
    { value: 'json-to-csv', label: 'JSON → CSV' },
    { value: 'xlsx-to-csv', label: 'Excel → CSV' },
    { value: 'csv-to-xlsx', label: 'CSV → Excel' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Table} title="CSV / JSON / Excel Converter" description="Convert between tabular data formats in your browser." badge={<span className="badge-green">Processed locally</span>} />

      <DropZone onFiles={handleFile} accept=".csv,.json,.xlsx,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" label="Drop a CSV, JSON, or Excel file" hint="CSV, JSON, XLSX" maxSizeMB={50} />

      {file && (
        <div className="flex flex-col gap-4">
          <FileItem file={file} onRemove={() => { setFile(null); setSheets([]); setResult(null); proc.reset(); }} />

          <div className="card p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="label">Conversion</label>
              <div className="flex flex-wrap gap-2">
                {OPS.map((op) => (
                  <button key={op.value} onClick={() => setOperation(op.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${operation === op.value ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'}`}>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {operation === 'xlsx-to-csv' && sheets.length > 1 && (
              <div className="flex flex-col gap-1">
                <label className="label">Sheet</label>
                <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} className="input w-48">
                  {sheets.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <button onClick={handleConvert} disabled={proc.status === 'processing'} className="btn-primary self-start">
              Convert
            </button>
          </div>
        </div>
      )}

      <ProcessingCard
        status={proc.status}
        progress={proc.progress}
        errorMessage={proc.error?.message}
        result={result}
        originalSize={file?.size}
        onCancel={proc.cancel}
        onReset={() => { proc.reset(); setFile(null); setSheets([]); setResult(null); }}
      />
    </div>
  );
}
