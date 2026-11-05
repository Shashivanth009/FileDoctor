import React, { useState } from 'react';
import { Database, ArrowRightLeft, Download, CheckCircle } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Select, ProgressBar, ResultPanel, useToast } from '@/components/ui';
import {
  convertCsvToJson,
  convertJsonToCsv,
  convertCsvToXlsx,
  convertXlsxToCsv,
  convertJsonToXlsx,
  convertXlsxToJson,
} from '@/services/dataService';
import { formatFileSize, downloadBlob } from '@/services/fileService';
import { addHistoryEntry, saveOutput } from '@/services/historyService';
import { ProcessingResult } from '@/types';

export const DataConverterPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<string>('csv-to-json');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      let res: ProcessingResult;
      switch (conversionType) {
        case 'csv-to-json':
          res = await convertCsvToJson(file, { pretty: true });
          break;
        case 'json-to-csv':
          res = await convertJsonToCsv(file);
          break;
        case 'csv-to-xlsx':
          res = await convertCsvToXlsx(file);
          break;
        case 'xlsx-to-csv':
          res = await convertXlsxToCsv(file);
          break;
        case 'json-to-xlsx':
          res = await convertJsonToXlsx(file);
          break;
        case 'xlsx-to-json':
          res = await convertXlsxToJson(file);
          break;
        default:
          throw new Error('Unsupported conversion');
      }

      setResult(res);

      if (res.success && res.outputBlob && res.outputFilename) {
        const id = Math.random().toString(36).substring(2);
        await addHistoryEntry({
          id,
          toolId: conversionType,
          toolName: `Data Converter (${conversionType})`,
          inputFilename: file.name,
          originalSize: file.size,
          outputFilename: res.outputFilename,
          outputSize: res.outputSize,
          timestamp: Date.now(),
          status: 'success',
          hasRetainedOutput: true,
        });
        await saveOutput(id, res.outputBlob, res.outputFilename);

        toast({
          type: 'success',
          title: 'Data converted successfully',
          description: `Generated ${res.outputFilename}`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Conversion failed', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <ToolHeader
        icon={<Database className="w-6 h-6" />}
        name="Data Converter"
        description="Convert tabular data between CSV, JSON, and Microsoft Excel spreadsheets (XLSX) in your browser."
        category="Data & Text"
        categoryRoute="/data-text"
        categoryColor="#496BFF"
        formats={['.csv', '.json', '.xlsx', '.xls']}
        privacyLevel="local"
      />

      {!file ? (
        <Card padding="lg">
          <FileUploadZone
            accept=".csv,.json,.xlsx,.xls,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onFiles={(files) => {
              if (files[0]) {
                setFile(files[0]);
                const ext = files[0].name.split('.').pop()?.toLowerCase();
                if (ext === 'csv') setConversionType('csv-to-json');
                else if (ext === 'json') setConversionType('json-to-csv');
                else if (ext === 'xlsx' || ext === 'xls') setConversionType('xlsx-to-json');
              }
            }}
            label="Drop data file (CSV, JSON, or Excel)"
          />
        </Card>
      ) : (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-color">
            <div>
              <p className="text-sm font-semibold text-main-white">{file.name}</p>
              <p className="text-xs text-muted-white">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }}>
              Change file
            </Button>
          </div>

          <Select
            label="Conversion Pipeline"
            value={conversionType}
            onChange={(e) => setConversionType(e.target.value)}
            options={[
              { value: 'csv-to-json', label: 'CSV → JSON (Structured Objects)' },
              { value: 'json-to-csv', label: 'JSON → CSV (Comma Delimited)' },
              { value: 'csv-to-xlsx', label: 'CSV → Excel Spreadsheet (.xlsx)' },
              { value: 'xlsx-to-csv', label: 'Excel Spreadsheet (.xlsx) → CSV' },
              { value: 'json-to-xlsx', label: 'JSON → Excel Spreadsheet (.xlsx)' },
              { value: 'xlsx-to-json', label: 'Excel Spreadsheet (.xlsx) → JSON' },
            ]}
          />

          <Button
            size="lg"
            fullWidth
            loading={isProcessing}
            icon={<ArrowRightLeft className="w-4 h-4" />}
            onClick={handleConvert}
          >
            Execute Conversion
          </Button>
        </Card>
      )}

      {isProcessing && <ProgressBar value={50} indeterminate />}

      {result && result.success && result.outputBlob && result.outputFilename && (
        <ResultPanel
          originalSize={result.originalSize}
          outputSize={result.outputSize || 0}
          outputFilename={result.outputFilename}
          processingTime={result.processingTime}
          onDownload={() => downloadBlob(result.outputBlob!, result.outputFilename!)}
          onProcessAnother={() => {
            setFile(null);
            setResult(null);
          }}
        />
      )}
    </div>
  );
};

