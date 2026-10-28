import { useState } from 'react';
import { Eraser, Copy, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/feedback/Toast';
import { cleanText, type TextCleanOptions } from '@/services/dataProcessing';
import { downloadBlob } from '@/utils/download';
import { addRecentTool } from '@/services/storage';

const DEFAULT_OPTIONS: TextCleanOptions = {
  removeDuplicateLines: false,
  normalizeWhitespace: true,
  removeBlankLines: false,
  fixLineBreaks: true,
  stripMarkdown: false,
  trimLines: true,
};

export function TextCleanerPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [options, setOptions] = useState<TextCleanOptions>(DEFAULT_OPTIONS);
  const { success, error: toastError } = useToast();

  const toggle = (key: keyof TextCleanOptions) => {
    setOptions((o) => ({ ...o, [key]: !o[key] }));
  };

  const handleClean = () => {
    if (!input.trim()) { toastError('Enter some text first.'); return; }
    addRecentTool('text-cleaner');
    setOutput(cleanText(input, options));
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output).then(() => success('Copied!'));
  };

  const downloadOutput = () => {
    downloadBlob(new Blob([output], { type: 'text/plain' }), 'cleaned_text.txt');
  };

  const inLines = input.split('\n').length;
  const outLines = output.split('\n').length;

  const OPTION_LABELS: { key: keyof TextCleanOptions; label: string; hint: string }[] = [
    { key: 'fixLineBreaks', label: 'Fix line breaks', hint: 'Normalize \\r\\n and \\r to \\n' },
    { key: 'trimLines', label: 'Trim line ends', hint: 'Remove trailing whitespace from each line' },
    { key: 'normalizeWhitespace', label: 'Normalize whitespace', hint: 'Collapse multiple spaces/tabs' },
    { key: 'removeBlankLines', label: 'Remove extra blank lines', hint: 'Reduce multiple blank lines to one' },
    { key: 'removeDuplicateLines', label: 'Remove duplicate lines', hint: 'Keep only first occurrence of each line' },
    { key: 'stripMarkdown', label: 'Strip Markdown syntax', hint: 'Remove headings, bold, links, etc. (basic)' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Eraser} title="Text Cleaner" description="Remove duplicates, normalize whitespace, strip Markdown, and more." badge={<span className="badge-green">Processed locally</span>} />

      <div className="card p-4 flex flex-col gap-3">
        <p className="label">Transformations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {OPTION_LABELS.map(({ key, label, hint }) => (
            <label key={key} className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggle(key)}
                className="mt-0.5 accent-brand-600 w-4 h-4 rounded shrink-0"
              />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="text-input">Input <span className="text-gray-400 font-normal">({inLines} lines)</span></label>
            <button onClick={() => { setInput(''); setOutput(''); }} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
          </div>
          <textarea id="text-input" value={input} onChange={(e) => setInput(e.target.value)} className="input h-64 resize-none text-sm" placeholder="Paste your text here…" spellCheck={false} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="label">Output {output && <span className="text-gray-400 font-normal">({outLines} lines)</span>}</label>
            {output && (
              <div className="flex gap-1">
                <button onClick={copyOutput} className="btn-ghost text-xs p-1.5"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={downloadOutput} className="btn-ghost text-xs p-1.5"><Download className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          <textarea readOnly value={output} className="input h-64 resize-none text-sm" placeholder="Cleaned text appears here…" spellCheck={false} aria-label="Output" />
        </div>
      </div>

      <button onClick={handleClean} className="btn-primary self-start">Clean Text</button>
    </div>
  );
}
